import type {
  ContributionReport,
  GitHubUser,
  PullRequest,
  PullRequestState,
  RepoRef,
} from "./types";
import { computeStats } from "./stats";

const STATES: PullRequestState[] = ["MERGED", "OPEN", "CLOSED"];

/**
 * `[repoIndex, number, title, state, createdAt, mergedAt, closedAt, inUserOrg]`
 * Dates are ISO strings, missing dates are "". Keeps the cached payload and the
 * data sent to the browser small enough for contributors with thousands of PRs.
 */
export type CompactPullRequest = [
  number,
  number,
  string,
  number,
  string,
  string,
  string,
  number,
];

export interface CompactReport {
  user: GitHubUser;
  repos: RepoRef[];
  prs: CompactPullRequest[];
  fetchedAt: string;
  truncated: boolean;
}

export function compactPullRequests(pullRequests: PullRequest[]): {
  repos: RepoRef[];
  prs: CompactPullRequest[];
} {
  const repoIndex = new Map<string, number>();
  const repos: RepoRef[] = [];
  const prs = pullRequests.map<CompactPullRequest>((pr) => {
    let index = repoIndex.get(pr.repo.nameWithOwner);
    if (index === undefined) {
      index = repos.length;
      repos.push(pr.repo);
      repoIndex.set(pr.repo.nameWithOwner, index);
    }
    return [
      index,
      pr.number,
      pr.title,
      STATES.indexOf(pr.state),
      pr.createdAt,
      pr.mergedAt ?? "",
      pr.closedAt ?? "",
      pr.inUserOrg ? 1 : 0,
    ];
  });
  return { repos, prs };
}

export function expandPullRequests(
  repos: RepoRef[],
  prs: CompactPullRequest[],
): PullRequest[] {
  return prs.map(
    ([repoIdx, number, title, state, createdAt, mergedAt, closedAt, inOrg]) => {
      const repo = repos[repoIdx];
      return {
        id: `${repo.nameWithOwner}#${number}`,
        number,
        title,
        url: `${repo.url}/pull/${number}`,
        state: STATES[state] ?? "CLOSED",
        createdAt,
        mergedAt: mergedAt || null,
        closedAt: closedAt || null,
        repo,
        inUserOrg: inOrg === 1,
      };
    },
  );
}

export function toCompactReport(
  user: GitHubUser,
  pullRequests: PullRequest[],
  truncated: boolean,
): CompactReport {
  return {
    user,
    ...compactPullRequests(pullRequests),
    fetchedAt: new Date().toISOString(),
    truncated,
  };
}

export function expandReport(compact: CompactReport): ContributionReport {
  const pullRequests = expandPullRequests(compact.repos, compact.prs);
  return {
    user: compact.user,
    pullRequests,
    stats: computeStats(pullRequests),
    fetchedAt: compact.fetchedAt,
    truncated: compact.truncated,
  };
}
