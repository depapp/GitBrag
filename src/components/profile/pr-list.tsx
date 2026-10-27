"use client";

import {
  ChevronDown,
  ExternalLink,
  GitMerge,
  GitPullRequest,
  GitPullRequestClosed,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  expandPullRequests,
  type CompactPullRequest,
} from "@/lib/github/compact";
import type { PullRequestState, RepoRef } from "@/lib/github/types";
import { Select } from "@/components/ui/select";
import { cn, formatDate } from "@/lib/utils";

const PAGE = 5;

const stateMeta: Record<
  PullRequestState,
  { label: string; Icon: typeof GitMerge; className: string }
> = {
  MERGED: { label: "Merged", Icon: GitMerge, className: "text-accent" },
  OPEN: { label: "Open", Icon: GitPullRequest, className: "text-positive" },
  CLOSED: {
    label: "Closed",
    Icon: GitPullRequestClosed,
    className: "text-negative",
  },
};

export function PullRequestList({
  repos,
  prs,
}: {
  repos: RepoRef[];
  prs: CompactPullRequest[];
}) {
  const pullRequests = useMemo(
    () => expandPullRequests(repos, prs),
    [repos, prs],
  );
  const [state, setState] = useState<PullRequestState | "ALL">("ALL");
  const [repo, setRepo] = useState("ALL");
  const [year, setYear] = useState("ALL");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE);

  const repoNames = useMemo(
    () => [...new Set(pullRequests.map((p) => p.repo.nameWithOwner))].sort(),
    [pullRequests],
  );
  const years = useMemo(
    () =>
      [...new Set(pullRequests.map((p) => p.createdAt.slice(0, 4)))]
        .sort()
        .reverse(),
    [pullRequests],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pullRequests.filter(
      (p) =>
        (state === "ALL" || p.state === state) &&
        (repo === "ALL" || p.repo.nameWithOwner === repo) &&
        (year === "ALL" || p.createdAt.startsWith(year)) &&
        (!q ||
          p.title.toLowerCase().includes(q) ||
          p.repo.nameWithOwner.toLowerCase().includes(q)),
    );
  }, [pullRequests, state, repo, year, query]);

  const visible = filtered.slice(0, limit);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="border-border bg-border flex gap-px overflow-hidden rounded-md border font-mono text-[11px]">
          {(["ALL", "MERGED", "OPEN", "CLOSED"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setState(s);
                setLimit(PAGE);
              }}
              className={cn(
                "px-2.5 py-1.5",
                state === s
                  ? "bg-accent text-accent-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {s === "ALL" ? "All" : stateMeta[s].label}
            </button>
          ))}
        </div>
        <Select
          aria-label="Repository"
          value={repo}
          onChange={(v) => {
            setRepo(v);
            setLimit(PAGE);
          }}
          options={[
            { value: "ALL", label: "All repositories" },
            ...repoNames.map((r) => ({ value: r, label: r })),
          ]}
          className="w-full sm:w-56"
        />
        <Select
          aria-label="Year"
          value={year}
          onChange={(v) => {
            setYear(v);
            setLimit(PAGE);
          }}
          options={[
            { value: "ALL", label: "All years" },
            ...years.map((y) => ({ value: y, label: y })),
          ]}
          className="w-32"
        />
        <input
          type="search"
          placeholder="Filter by title"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border-border bg-card text-foreground placeholder:text-muted-foreground hover:border-border-strong focus-visible:border-accent ml-auto h-9 w-full rounded-md border px-3 font-mono text-xs transition-colors outline-none sm:w-48"
        />
      </div>

      <div className="border-border overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr className="label text-left">
              <th className="px-4 py-2 font-normal">State</th>
              <th className="px-4 py-2 font-normal">Pull request</th>
              <th className="hidden px-4 py-2 font-normal md:table-cell">
                Repository
              </th>
              <th className="px-4 py-2 text-right font-normal">Date</th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {visible.map((pr) => {
              const meta = stateMeta[pr.state];
              return (
                <tr key={pr.id} className="bg-card hover:bg-muted/60">
                  <td className="px-4 py-2.5">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 font-mono text-[11px]",
                        meta.className,
                      )}
                    >
                      <meta.Icon className="size-3.5" />
                      <span className="hidden sm:inline">{meta.label}</span>
                    </span>
                  </td>
                  <td className="max-w-[320px] px-4 py-2.5">
                    <a
                      href={pr.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group hover:text-accent inline-flex max-w-full items-center gap-1.5"
                    >
                      <span className="truncate">{pr.title}</span>
                      <ExternalLink className="size-3 shrink-0 opacity-0 group-hover:opacity-100" />
                    </a>
                    <div className="text-muted-foreground truncate font-mono text-[11px] md:hidden">
                      {pr.repo.nameWithOwner}
                    </div>
                  </td>
                  <td className="text-muted-foreground hidden max-w-[220px] truncate px-4 py-2.5 font-mono text-xs md:table-cell">
                    {pr.repo.nameWithOwner}
                    <span className="text-border-strong"> #{pr.number}</span>
                  </td>
                  <td className="tabular text-muted-foreground px-4 py-2.5 text-right font-mono text-[11px] whitespace-nowrap">
                    {formatDate(pr.mergedAt ?? pr.createdAt, {
                      day: undefined,
                    })}
                  </td>
                </tr>
              );
            })}
            {visible.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="bg-card text-muted-foreground px-4 py-10 text-center text-sm"
                >
                  No pull requests match these filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="text-muted-foreground flex items-center justify-between font-mono text-[11px]">
        <span>
          Showing {visible.length.toLocaleString("en-US")} of{" "}
          {filtered.length.toLocaleString("en-US")}
        </span>
        {filtered.length > limit ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLimit((l) => l + PAGE)}
          >
            Show more <ChevronDown />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
