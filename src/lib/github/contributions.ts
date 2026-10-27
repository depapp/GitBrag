import { assertBudget, reportFetched, reportTotal } from "./budget";
import { GitHubError } from "./client";
import { cachedGraphQL } from "./cached";
import {
  PULL_REQUEST_COUNT_QUERY,
  PULL_REQUEST_SEARCH_QUERY,
  USER_QUERY,
} from "./queries";
import type { GitHubUser, PullRequest, PullRequestState } from "./types";

/** GitHub search never returns more than 1,000 results for one query. */
const SEARCH_RESULT_LIMIT = 1000;
const PAGE_SIZE = 100;
/** Safety valve so one profile cannot burn the whole API budget. */
const MAX_PULL_REQUESTS = 6000;
/** Concurrent GitHub search requests per report. */
const CONCURRENCY = 5;
/** Above this many results we fetch year by year in parallel instead of one long cursor walk. */
const PARALLEL_THRESHOLD = 300;

interface UserQueryResult {
  user: {
    login: string;
    name: string | null;
    avatarUrl: string;
    bio: string | null;
    location: string | null;
    company: string | null;
    websiteUrl: string | null;
    twitterUsername: string | null;
    createdAt: string;
    url: string;
    followers: { totalCount: number };
    following: { totalCount: number };
    repositories: { totalCount: number };
    organizations: { nodes: Array<{ login: string } | null> };
  } | null;
}

interface SearchNode {
  id: string;
  number: number;
  title: string;
  url: string;
  state: PullRequestState;
  createdAt: string;
  mergedAt: string | null;
  closedAt: string | null;
  repository: {
    nameWithOwner: string;
    name: string;
    url: string;
    description: string | null;
    stargazerCount: number;
    forkCount: number;
    isFork: boolean;
    isArchived: boolean;
    primaryLanguage: { name: string; color: string | null } | null;
    owner: { login: string; avatarUrl: string };
  };
}

interface SearchQueryResult {
  search: {
    issueCount: number;
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    nodes: Array<SearchNode | Record<string, never> | null>;
  };
}

interface CountQueryResult {
  search: { issueCount: number };
}

export function normalizeLogin(raw: string) {
  const login = raw.trim().replace(/^@/, "");
  if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(login)) {
    throw new GitHubError(
      "That is not a valid GitHub username.",
      "NOT_FOUND",
      404,
    );
  }
  return login;
}

export async function fetchUser(login: string): Promise<GitHubUser> {
  const data = await cachedGraphQL<UserQueryResult>(USER_QUERY, { login });
  if (!data.user) {
    throw new GitHubError(
      `GitHub user "${login}" was not found.`,
      "NOT_FOUND",
      404,
    );
  }
  const u = data.user;
  return {
    login: u.login,
    name: u.name,
    avatarUrl: u.avatarUrl,
    bio: u.bio,
    location: u.location,
    company: u.company,
    websiteUrl: u.websiteUrl,
    twitterUsername: u.twitterUsername,
    followers: u.followers.totalCount,
    following: u.following.totalCount,
    publicRepos: u.repositories.totalCount,
    createdAt: u.createdAt,
    url: u.url,
    organizations: u.organizations.nodes
      .filter((n): n is { login: string } => Boolean(n))
      .map((n) => n.login),
  };
}

export function baseSearchQuery(login: string) {
  return `is:pr author:${login} -user:${login}`;
}

function isPullRequestNode(
  node: SearchNode | Record<string, never> | null,
): node is SearchNode {
  return Boolean(node && "repository" in node && node.repository);
}

async function fetchAllPages(q: string): Promise<SearchNode[]> {
  const nodes: SearchNode[] = [];
  let after: string | null = null;
  for (let page = 0; page < SEARCH_RESULT_LIMIT / PAGE_SIZE; page++) {
    assertBudget();
    const data: SearchQueryResult = await cachedGraphQL<SearchQueryResult>(
      PULL_REQUEST_SEARCH_QUERY,
      { q, after },
    );
    const pageNodes = data.search.nodes.filter(isPullRequestNode);
    nodes.push(...pageNodes);
    reportFetched(pageNodes.length);
    if (!data.search.pageInfo.hasNextPage || !data.search.pageInfo.endCursor)
      break;
    after = data.search.pageInfo.endCursor;
  }
  return nodes;
}

async function countResults(q: string) {
  assertBudget();
  const data = await cachedGraphQL<CountQueryResult>(PULL_REQUEST_COUNT_QUERY, {
    q,
  });
  return data.search.issueCount;
}

function toIsoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

/**
 * Splits a `created:` window into halves until each half fits under GitHub's
 * 1,000-result ceiling. Returns `truncated: true` when a single day still
 * exceeds the limit (practically impossible for a human account).
 */
async function fetchRange(
  base: string,
  from: Date,
  to: Date,
  count: number,
): Promise<{ nodes: SearchNode[]; truncated: boolean }> {
  const q = `${base} created:${toIsoDate(from)}..${toIsoDate(to)}`;
  if (count <= SEARCH_RESULT_LIMIT) {
    return { nodes: await fetchAllPages(q), truncated: false };
  }
  const spanDays = Math.round((to.getTime() - from.getTime()) / 86_400_000);
  if (spanDays < 1) {
    return { nodes: await fetchAllPages(q), truncated: true };
  }
  const mid = new Date(from.getTime() + Math.floor(spanDays / 2) * 86_400_000);
  const nextDay = new Date(mid.getTime() + 86_400_000);
  const [leftCount, rightCount] = await Promise.all([
    countResults(`${base} created:${toIsoDate(from)}..${toIsoDate(mid)}`),
    countResults(`${base} created:${toIsoDate(nextDay)}..${toIsoDate(to)}`),
  ]);
  const [left, right] = await Promise.all([
    fetchRange(base, from, mid, leftCount),
    fetchRange(base, nextDay, to, rightCount),
  ]);
  return {
    nodes: [...left.nodes, ...right.nodes],
    truncated: left.truncated || right.truncated,
  };
}

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (next < items.length) {
        const index = next++;
        results[index] = await fn(items[index], index);
      }
    },
  );
  await Promise.all(workers);
  return results;
}

function yearRanges(from: Date, to: Date): Array<{ from: Date; to: Date }> {
  const ranges: Array<{ from: Date; to: Date }> = [];
  for (let year = from.getUTCFullYear(); year <= to.getUTCFullYear(); year++) {
    const start =
      year === from.getUTCFullYear() ? from : new Date(Date.UTC(year, 0, 1));
    const end =
      year === to.getUTCFullYear() ? to : new Date(Date.UTC(year, 11, 31));
    ranges.push({ from: start, to: end });
  }
  return ranges;
}

export async function fetchPullRequests(
  user: GitHubUser,
): Promise<{ pullRequests: PullRequest[]; truncated: boolean }> {
  const base = baseSearchQuery(user.login);
  const total = await countResults(base);
  reportTotal(Math.min(total, MAX_PULL_REQUESTS));

  let nodes: SearchNode[];
  let truncated = false;
  if (total <= PARALLEL_THRESHOLD) {
    nodes = await fetchAllPages(base);
  } else {
    const ranges = yearRanges(new Date(user.createdAt), new Date());
    const counts = await mapLimit(ranges, CONCURRENCY, (r) =>
      countResults(`${base} created:${toIsoDate(r.from)}..${toIsoDate(r.to)}`),
    );
    const results = await mapLimit(
      ranges.filter((_, i) => counts[i] > 0),
      CONCURRENCY,
      (r, i) => fetchRange(base, r.from, r.to, counts.filter((c) => c > 0)[i]),
    );
    nodes = results.flatMap((r) => r.nodes);
    truncated = results.some((r) => r.truncated);
  }
  if (nodes.length > MAX_PULL_REQUESTS) {
    nodes = nodes
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, MAX_PULL_REQUESTS);
    truncated = true;
  }

  const orgs = new Set(user.organizations.map((o) => o.toLowerCase()));
  const login = user.login.toLowerCase();
  const seen = new Set<string>();
  const pullRequests: PullRequest[] = [];
  for (const node of nodes) {
    if (seen.has(node.id)) continue;
    seen.add(node.id);
    const owner = node.repository.owner.login;
    if (owner.toLowerCase() === login) continue;
    if (node.repository.isFork) continue;
    pullRequests.push({
      id: node.id,
      number: node.number,
      title: node.title,
      url: node.url,
      state: node.state,
      createdAt: node.createdAt,
      mergedAt: node.mergedAt,
      closedAt: node.closedAt,
      inUserOrg: orgs.has(owner.toLowerCase()),
      repo: {
        nameWithOwner: node.repository.nameWithOwner,
        owner,
        name: node.repository.name,
        url: node.repository.url,
        description: node.repository.description,
        stars: node.repository.stargazerCount,
        forks: node.repository.forkCount,
        language: node.repository.primaryLanguage,
        ownerAvatarUrl: node.repository.owner.avatarUrl,
        isFork: node.repository.isFork,
        isArchived: node.repository.isArchived,
      },
    });
  }
  pullRequests.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return { pullRequests, truncated };
}
