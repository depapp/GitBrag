import { cache } from "react";
import { BudgetExceededError, withBudget, type ReportProgress } from "./budget";
import { CACHE_SECONDS } from "./cached";
import { expandReport, toCompactReport } from "./compact";
import { fetchPullRequests, fetchUser, normalizeLogin } from "./contributions";
import type { ContributionReport, GitHubUser } from "./types";

export const REPORT_REVALIDATE_SECONDS = CACHE_SECONDS;

/** Default time slice for building a report inside one request. */
export const DEFAULT_BUDGET_MS = 5_000;

/** Profile only: one cached GitHub call, used to render the page header first. */
export const getUser = cache(async (rawLogin: string): Promise<GitHubUser> => {
  return fetchUser(normalizeLogin(rawLogin).toLowerCase());
});

export type ReportResult =
  | { status: "ready"; report: ContributionReport }
  | { status: "pending"; progress: ReportProgress };

/**
 * Builds a user's contribution report from cached GitHub pages. Every GitHub
 * response is cached for an hour, so repeat visits and share images cost no
 * API calls, and a build interrupted by `budgetMs` resumes on the next call.
 * Deduplicated per request so `generateMetadata` and the page share one load.
 */
export const loadReport = cache(
  async (
    rawLogin: string,
    budgetMs = DEFAULT_BUDGET_MS,
  ): Promise<ReportResult> => {
    const login = normalizeLogin(rawLogin).toLowerCase();
    try {
      const report = await withBudget(budgetMs, async () => {
        const user = await fetchUser(login);
        const { pullRequests, truncated } = await fetchPullRequests(user);
        return expandReport(toCompactReport(user, pullRequests, truncated));
      });
      return { status: "ready", report };
    } catch (error) {
      if (error instanceof BudgetExceededError) {
        return { status: "pending", progress: error.progress };
      }
      throw error;
    }
  },
);
