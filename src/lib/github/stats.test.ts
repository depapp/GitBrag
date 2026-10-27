import { describe, expect, it } from "vitest";
import {
  bucketByMonth,
  computeStats,
  summarizeLanguages,
  summarizeRepositories,
} from "./stats";
import type { PullRequest, RepoRef } from "./types";

function repo(overrides: Partial<RepoRef> = {}): RepoRef {
  return {
    nameWithOwner: "acme/widgets",
    owner: "acme",
    name: "widgets",
    url: "https://github.com/acme/widgets",
    description: null,
    stars: 100,
    forks: 5,
    language: { name: "TypeScript", color: "#3178c6" },
    ownerAvatarUrl: "https://avatars.githubusercontent.com/u/1",
    isFork: false,
    isArchived: false,
    ...overrides,
  };
}

function pr(overrides: Partial<PullRequest> = {}): PullRequest {
  return {
    id: Math.random().toString(36).slice(2),
    number: 1,
    title: "Fix things",
    url: "https://github.com/acme/widgets/pull/1",
    state: "MERGED",
    createdAt: "2024-01-10T00:00:00Z",
    mergedAt: "2024-01-12T00:00:00Z",
    closedAt: "2024-01-12T00:00:00Z",
    repo: repo(),
    inUserOrg: false,
    ...overrides,
  };
}

const sample: PullRequest[] = [
  pr(),
  pr({
    state: "OPEN",
    mergedAt: null,
    closedAt: null,
    createdAt: "2024-03-01T00:00:00Z",
  }),
  pr({
    state: "CLOSED",
    mergedAt: null,
    createdAt: "2023-11-01T00:00:00Z",
    repo: repo({
      nameWithOwner: "org/lib",
      owner: "org",
      name: "lib",
      stars: 2000,
      language: { name: "Go", color: null },
    }),
  }),
  pr({
    createdAt: "2023-12-05T00:00:00Z",
    mergedAt: "2024-01-02T00:00:00Z",
    repo: repo({
      nameWithOwner: "org/lib",
      owner: "org",
      name: "lib",
      stars: 2000,
      language: { name: "Go", color: null },
    }),
  }),
];

describe("summarizeRepositories", () => {
  it("groups by repository and counts merged pull requests", () => {
    const repos = summarizeRepositories(sample);
    expect(repos.map((r) => r.nameWithOwner)).toEqual([
      "org/lib",
      "acme/widgets",
    ]);
    expect(repos[0]).toMatchObject({
      pullRequests: 2,
      merged: 1,
    });
    expect(repos[1]).toMatchObject({
      pullRequests: 2,
      merged: 1,
      firstContribution: "2024-01-10T00:00:00Z",
    });
  });

  it("skips repositories where nothing was merged", () => {
    const repos = summarizeRepositories([
      pr({
        state: "CLOSED",
        mergedAt: null,
        repo: repo({ nameWithOwner: "big/corp", owner: "big", name: "corp" }),
      }),
      pr(),
    ]);
    expect(repos.map((r) => r.nameWithOwner)).toEqual(["acme/widgets"]);
    expect(
      computeStats([pr({ state: "CLOSED", mergedAt: null })]),
    ).toMatchObject({
      repositories: 0,
      totalStars: 0,
    });
  });
});

describe("summarizeLanguages", () => {
  it("computes shares that sum to one", () => {
    const langs = summarizeLanguages(sample);
    expect(langs.map((l) => l.name)).toEqual(["Go", "TypeScript"]);
    expect(langs.reduce((s, l) => s + l.share, 0)).toBeCloseTo(1);
  });

  it("ignores pull requests without a language", () => {
    expect(
      summarizeLanguages([pr({ repo: repo({ language: null }) })]),
    ).toEqual([]);
  });
});

describe("bucketByMonth", () => {
  it("fills gaps and counts merges in the merge month", () => {
    const monthly = bucketByMonth(sample);
    expect(monthly[0].month).toBe("2023-11-01");
    const jan = monthly.find((m) => m.month === "2024-01-01");
    expect(jan).toMatchObject({ merged: 2, opened: 1 });
    const feb = monthly.find((m) => m.month === "2024-02-01");
    expect(feb).toMatchObject({ merged: 0, opened: 0 });
    expect(monthly.at(-1)?.month.slice(0, 7)).toBe(
      new Date().toISOString().slice(0, 7),
    );
  });

  it("returns an empty list for no pull requests", () => {
    expect(bucketByMonth([])).toEqual([]);
  });
});

describe("computeStats", () => {
  it("aggregates totals", () => {
    const stats = computeStats(sample);
    expect(stats).toMatchObject({
      total: 4,
      merged: 2,
      open: 1,
      closed: 1,
      repositories: 2,
      organizations: 2,
      totalStars: 2100,
      firstContribution: "2023-12-05T00:00:00Z",
    });
    expect(stats.languages.map((l) => [l.name, l.share])).toEqual([
      ["Go", 0.5],
      ["TypeScript", 0.5],
    ]);
    expect(stats.mergeRate).toBeCloseTo(2 / 3);
    expect(stats.yearsActive).toBeGreaterThan(1);
  });

  it("handles an empty list", () => {
    const stats = computeStats([]);
    expect(stats.total).toBe(0);
    expect(stats.firstContribution).toBeNull();
    expect(stats.monthly).toEqual([]);
  });
});
