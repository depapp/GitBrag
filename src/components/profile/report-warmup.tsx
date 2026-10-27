"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReportProgress } from "@/lib/github/budget";

type Status =
  | { status: "pending"; fetched: number; total: number | null }
  | { status: "ready" }
  | { status: "error"; error: string };

/**
 * Shown while a profile's pull requests are still being fetched from GitHub.
 * Polls `/api/report/<login>` (each call advances the report) and refreshes
 * the page once the report is cached.
 */
export function ReportWarmup({
  login,
  initial,
}: {
  login: string;
  initial: ReportProgress;
}) {
  const router = useRouter();
  const [state, setState] = useState<Status>({
    status: "pending",
    ...initial,
  });

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function poll() {
      while (!cancelled) {
        try {
          const res = await fetch(`/api/report/${login}`, {
            cache: "no-store",
            signal: controller.signal,
          });
          const body = (await res.json()) as Status;
          if (cancelled) return;
          if (body.status === "ready") {
            setState(body);
            router.refresh();
            return;
          }
          setState(
            body.status === "error"
              ? body
              : { status: "pending", fetched: body.fetched, total: body.total },
          );
          if (body.status === "error") return;
        } catch (error) {
          if (cancelled || (error as Error).name === "AbortError") return;
          await new Promise((r) => setTimeout(r, 2000));
        }
      }
    }

    void poll();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [login, router]);

  if (state.status === "error") {
    return (
      <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-6 text-sm text-rose-600 dark:text-rose-400">
        {state.error}
      </div>
    );
  }

  const fetched = state.status === "pending" ? state.fetched : 0;
  const total = state.status === "pending" ? state.total : null;
  const percent =
    total && total > 0
      ? Math.min(99, Math.round((fetched / total) * 100))
      : null;

  return (
    <div className="border-border bg-card rounded-lg border p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <Loader2 className="text-accent size-5 animate-spin" aria-hidden />
        <div>
          <p className="font-semibold">
            {state.status === "ready"
              ? "Report ready, loading…"
              : "Scanning pull requests on GitHub…"}
          </p>
          <p className="text-muted-foreground text-sm">
            {total
              ? `${fetched.toLocaleString()} of ${total.toLocaleString()} pull requests collected`
              : "Counting pull requests…"}
            . The first visit for an active contributor can take a minute; the
            result is cached for an hour.
          </p>
        </div>
      </div>
      <div
        className="bg-muted mt-5 h-2 w-full overflow-hidden"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent ?? undefined}
      >
        <div
          className="bg-accent h-full transition-all duration-700"
          style={{ width: `${percent ?? 8}%` }}
        />
      </div>
    </div>
  );
}
