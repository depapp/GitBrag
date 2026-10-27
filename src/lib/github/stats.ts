import type {
  ContributionStats,
  LanguageShare,
  MonthBucket,
  PullRequest,
  RepoSummary,
  YearBucket,
} from "./types";

function monthKey(iso: string) {
  return `${iso.slice(0, 7)}-01`;
}

function sortByDate(a: string, b: string) {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function summarizeRepositories(prs: PullRequest[]): RepoSummary[] {
  const byRepo = new Map<string, RepoSummary>();
  for (const pr of prs) {
    const key = pr.repo.nameWithOwner;
    const existing = byRepo.get(key);
    if (existing) {
      existing.pullRequests += 1;
      existing.merged += pr.state === "MERGED" ? 1 : 0;
      if (pr.createdAt < existing.firstContribution) {
        existing.firstContribution = pr.createdAt;
      }
      if (pr.createdAt > existing.lastContribution) {
        existing.lastContribution = pr.createdAt;
      }
    } else {
      byRepo.set(key, {
        ...pr.repo,
        pullRequests: 1,
        merged: pr.state === "MERGED" ? 1 : 0,
        firstContribution: pr.createdAt,
        lastContribution: pr.createdAt,
      });
    }
  }
  return [...byRepo.values()]
    .filter((repo) => repo.merged > 0)
    .sort(
      (a, b) =>
        b.merged - a.merged ||
        b.pullRequests - a.pullRequests ||
        b.stars - a.stars ||
        a.nameWithOwner.localeCompare(b.nameWithOwner),
    );
}

export function summarizeLanguages(prs: PullRequest[]): LanguageShare[] {
  const counts = new Map<string, LanguageShare>();
  let total = 0;
  for (const pr of prs) {
    if (!pr.repo.language) continue;
    total += 1;
    const current = counts.get(pr.repo.language.name);
    if (current) {
      current.pullRequests += 1;
    } else {
      counts.set(pr.repo.language.name, {
        name: pr.repo.language.name,
        color: pr.repo.language.color,
        pullRequests: 1,
        share: 0,
      });
    }
  }
  return [...counts.values()]
    .map((l) => ({ ...l, share: total ? l.pullRequests / total : 0 }))
    .sort(
      (a, b) => b.pullRequests - a.pullRequests || a.name.localeCompare(b.name),
    );
}

export function bucketByMonth(prs: PullRequest[]): MonthBucket[] {
  if (prs.length === 0) return [];
  const buckets = new Map<string, MonthBucket>();
  const ensure = (key: string) => {
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { month: key, merged: 0, opened: 0 };
      buckets.set(key, bucket);
    }
    return bucket;
  };
  for (const pr of prs) {
    ensure(monthKey(pr.createdAt)).opened += 1;
    if (pr.mergedAt) ensure(monthKey(pr.mergedAt)).merged += 1;
  }

  const keys = [...buckets.keys()].sort(sortByDate);
  const first = new Date(keys[0]);
  const last = new Date();
  const cursor = new Date(
    Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), 1),
  );
  const end = Date.UTC(last.getUTCFullYear(), last.getUTCMonth(), 1);
  while (cursor.getTime() <= end) {
    ensure(cursor.toISOString().slice(0, 10));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return [...buckets.values()].sort((a, b) => sortByDate(a.month, b.month));
}

export function bucketByYear(monthly: MonthBucket[]): YearBucket[] {
  const years = new Map<number, YearBucket>();
  for (const m of monthly) {
    const year = Number(m.month.slice(0, 4));
    const bucket = years.get(year) ?? { year, merged: 0, opened: 0 };
    bucket.merged += m.merged;
    bucket.opened += m.opened;
    years.set(year, bucket);
  }
  return [...years.values()].sort((a, b) => a.year - b.year);
}

export function computeStats(prs: PullRequest[]): ContributionStats {
  const mergedPrs = prs.filter((p) => p.state === "MERGED");
  const merged = mergedPrs.length;
  const open = prs.filter((p) => p.state === "OPEN").length;
  const closed = prs.filter((p) => p.state === "CLOSED").length;
  const repos = summarizeRepositories(prs);
  const monthly = bucketByMonth(prs);
  const dates = mergedPrs.map((p) => p.createdAt).sort(sortByDate);
  const first = dates[0] ?? null;
  const last = dates[dates.length - 1] ?? null;
  const yearsActive = first
    ? Math.max(
        1,
        Math.round(
          ((Date.now() - new Date(first).getTime()) /
            (365.25 * 24 * 3600 * 1000)) *
            10,
        ) / 10,
      )
    : 0;
  const decided = merged + closed;

  return {
    total: prs.length,
    merged,
    open,
    closed,
    repositories: repos.length,
    organizations: new Set(repos.map((r) => r.owner)).size,
    totalStars: repos.reduce((sum, r) => sum + r.stars, 0),
    firstContribution: first,
    lastContribution: last,
    yearsActive,
    languages: summarizeLanguages(mergedPrs),
    topRepositories: repos,
    monthly,
    yearly: bucketByYear(monthly),
    mergeRate: decided ? merged / decided : 0,
  };
}
