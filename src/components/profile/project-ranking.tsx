"use client";

import { GitMerge, Star } from "lucide-react";
import Image, { type StaticImageData } from "next/image";
import bronze from "@/assets/icons/medal-bronze.png";
import gold from "@/assets/icons/medal-gold.png";
import silver from "@/assets/icons/medal-silver.png";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { RepoSummary } from "@/lib/github/types";
import {
  repoPullsUrl,
  cn,
  formatCompact,
  formatNumber,
  pluralize,
} from "@/lib/utils";

type SortKey = "merged" | "stars";

const sorts: Array<{ key: SortKey; label: string }> = [
  { key: "stars", label: "Most starred" },
  { key: "merged", label: "Most merged" },
];

const LIST = 5;

function sortRepos(repos: RepoSummary[], sort: SortKey) {
  if (sort === "merged") return repos;
  return [...repos].sort(
    (a, b) =>
      b.stars - a.stars ||
      b.merged - a.merged ||
      a.nameWithOwner.localeCompare(b.nameWithOwner),
  );
}

export function ProjectRanking({
  repos,
  login,
}: {
  repos: RepoSummary[];
  login: string;
}) {
  const [sort, setSort] = useState<SortKey>("stars");
  const [limit, setLimit] = useState(LIST);
  const ranked = useMemo(() => sortRepos(repos, sort), [repos, sort]);
  const podium = ranked.slice(0, 3);
  const rest = ranked.slice(3, 3 + limit);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="label">Where the work landed</span>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">
            {formatNumber(repos.length)} {pluralize(repos.length, "project")}
          </h2>
        </div>
        <div
          role="radiogroup"
          aria-label="Rank projects by"
          className="border-border bg-border flex shrink-0 gap-px overflow-hidden rounded-md border font-mono text-[11px]"
        >
          {sorts.map((s) => (
            <button
              key={s.key}
              type="button"
              role="radio"
              aria-checked={sort === s.key}
              onClick={() => setSort(s.key)}
              className={cn(
                "px-3 py-1.5 uppercase",
                sort === s.key
                  ? "bg-accent text-accent-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <ol className="grid items-end gap-3 sm:grid-cols-3">
        {podium.map((repo, i) => (
          <Podium
            key={repo.nameWithOwner}
            repo={repo}
            place={i}
            sort={sort}
            login={login}
          />
        ))}
      </ol>

      {rest.length > 0 ? (
        <ol className="divide-border border-border mt-3 divide-y border-t">
          {rest.map((repo, i) => (
            <li key={repo.nameWithOwner}>
              <a
                href={repoPullsUrl(repo.url, login)}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-4 py-3"
              >
                <span className="text-muted-foreground w-6 font-mono text-xs tabular-nums">
                  {String(i + 4).padStart(2, "0")}
                </span>
                <Image
                  src={repo.ownerAvatarUrl}
                  alt=""
                  width={28}
                  height={28}
                  className="border-border size-7 rounded-md border"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm">
                    <span className="text-muted-foreground">{repo.owner}/</span>
                    <span className="group-hover:text-accent font-medium">
                      {repo.name}
                    </span>
                  </div>
                  {repo.description ? (
                    <p className="text-muted-foreground mt-0.5 truncate text-xs">
                      {repo.description}
                    </p>
                  ) : null}
                </div>
                <Metric repo={repo} sort={sort} compact />
              </a>
            </li>
          ))}
        </ol>
      ) : null}

      {ranked.length > 3 + limit ? (
        <div className="border-border flex justify-center border-t pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLimit((l) => l + 10)}
          >
            Show {Math.min(10, ranked.length - 3 - limit)} more
          </Button>
        </div>
      ) : null}
    </div>
  );
}

const places: Array<{
  order: string;
  pad: string;
  ring: string;
  medal: StaticImageData;
  label: string;
}> = [
  {
    order: "sm:order-2",
    pad: "pt-6",
    ring: "border-accent",
    medal: gold,
    label: "1st place",
  },
  {
    order: "sm:order-1",
    pad: "pt-5",
    ring: "border-border-strong",
    medal: silver,
    label: "2nd place",
  },
  {
    order: "sm:order-3",
    pad: "pt-5",
    ring: "border-border-strong",
    medal: bronze,
    label: "3rd place",
  },
];

function Podium({
  repo,
  place,
  sort,
  login,
}: {
  repo: RepoSummary;
  place: number;
  sort: SortKey;
  login: string;
}) {
  const p = places[place];
  return (
    <li className={cn("flex flex-col", p.order)}>
      <a
        href={repoPullsUrl(repo.url, login)}
        target="_blank"
        rel="noreferrer"
        className={cn(
          "group bg-card border-border hover:border-border-strong flex flex-1 flex-col items-center rounded-lg border px-4 pb-5 text-center transition-colors",
          p.pad,
          place === 0 && "border-accent/50",
        )}
      >
        <Image
          src={p.medal}
          alt={p.label}
          title={p.label}
          width={48}
          height={48}
          className={place === 0 ? "size-14" : "size-11"}
        />
        <Image
          src={repo.ownerAvatarUrl}
          alt=""
          width={56}
          height={56}
          className={cn(
            "mt-3 rounded-xl border-2",
            place === 0 ? "size-16" : "size-12",
            p.ring,
          )}
        />
        <div className="mt-3 w-full min-w-0">
          <div className="text-muted-foreground truncate text-xs">
            {repo.owner}
          </div>
          <div className="group-hover:text-accent truncate font-semibold">
            {repo.name}
          </div>
        </div>
        <div
          className={cn(
            "tabular mt-3 font-mono tracking-tight",
            place === 0 ? "text-4xl" : "text-3xl",
          )}
        >
          {sort === "merged"
            ? formatNumber(repo.merged)
            : formatCompact(repo.stars)}
        </div>
        <div className="text-muted-foreground mt-1 font-mono text-[11px] uppercase">
          {sort === "merged" ? "merged" : "stars"}
        </div>
        <div className="text-muted-foreground mt-3 flex items-center gap-3 font-mono text-[11px]">
          {sort === "merged" ? (
            <span className="inline-flex items-center gap-1">
              <Star className="size-3" /> {formatCompact(repo.stars)}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <GitMerge className="text-accent size-3" /> {repo.merged} merged
            </span>
          )}
          {repo.language ? (
            <span className="inline-flex items-center gap-1">
              <span
                className="size-2 rounded-full"
                style={{ background: repo.language.color ?? "currentColor" }}
              />
              {repo.language.name}
            </span>
          ) : null}
        </div>
      </a>
    </li>
  );
}

function Metric({
  repo,
  sort,
  compact,
}: {
  repo: RepoSummary;
  sort: SortKey;
  compact?: boolean;
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 flex-col items-end font-mono",
        compact ? "text-sm" : "text-base",
      )}
    >
      <span className="tabular">
        {sort === "merged"
          ? formatNumber(repo.merged)
          : formatCompact(repo.stars)}
      </span>
      <span className="text-muted-foreground text-[11px]">
        {sort === "merged" ? (
          <>★ {formatCompact(repo.stars)}</>
        ) : (
          <>{repo.merged} merged</>
        )}
      </span>
    </span>
  );
}
