import { AsyncLocalStorage } from "node:async_hooks";

export interface ReportProgress {
  /** Pull requests collected so far. */
  fetched: number;
  /** Total pull requests GitHub reports for the user, once known. */
  total: number | null;
}

/**
 * Thrown when a report cannot be finished before the caller's deadline. Each
 * GitHub page fetched before that point is cached, so the next attempt resumes
 * where this one stopped.
 */
export class BudgetExceededError extends Error {
  constructor(public readonly progress: ReportProgress) {
    super("Report is still being built.");
    this.name = "BudgetExceededError";
  }
}

interface Budget {
  deadline: number;
  progress: ReportProgress;
}

/**
 * Hosting platforms stop serverless functions after ~10 s, so a report is built
 * in time-boxed slices. The budget travels through async context so cached
 * wrappers do not need it as an argument (which would leak into cache keys).
 */
const storage = new AsyncLocalStorage<Budget>();

/**
 * Runs `fn` with a deadline. Requests already in flight when the deadline
 * passes keep running in the background and still land in the cache; the
 * caller gets `BudgetExceededError` promptly so the response stays well under
 * platform function limits.
 */
export function withBudget<T>(ms: number, fn: () => Promise<T>): Promise<T> {
  const budget: Budget = {
    deadline: Date.now() + ms,
    progress: { fetched: 0, total: null },
  };
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new BudgetExceededError({ ...budget.progress })),
      ms,
    );
  });
  const work = storage.run(budget, fn);
  work.catch(() => undefined);
  return Promise.race([work, timeout]).finally(() => clearTimeout(timer));
}

export function reportTotal(total: number) {
  const budget = storage.getStore();
  if (budget) budget.progress.total = total;
}

export function reportFetched(count: number) {
  const budget = storage.getStore();
  if (budget) budget.progress.fetched += count;
}

export function assertBudget() {
  const budget = storage.getStore();
  if (budget && Date.now() > budget.deadline) {
    throw new BudgetExceededError({ ...budget.progress });
  }
}
