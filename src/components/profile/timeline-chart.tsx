"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonthBucket } from "@/lib/github/types";
import { cn, formatMonth } from "@/lib/utils";

const ranges = [
  { key: "1Y", months: 12 },
  { key: "3Y", months: 36 },
  { key: "ALL", months: Infinity },
] as const;

export function TimelineChart({ monthly }: { monthly: MonthBucket[] }) {
  const [range, setRange] = useState<(typeof ranges)[number]["key"]>(
    monthly.length > 36 ? "3Y" : "ALL",
  );
  const data = useMemo(() => {
    const months = ranges.find((r) => r.key === range)?.months ?? Infinity;
    const slice = Number.isFinite(months) ? monthly.slice(-months) : monthly;
    return slice.map((m) => ({ ...m, label: formatMonth(m.month) }));
  }, [monthly, range]);
  const total = data.reduce((sum, m) => sum + m.merged, 0);

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <span className="label">Merged pull requests over time</span>
          <div className="tabular mt-1 font-mono text-sm">
            {total.toLocaleString("en-US")}{" "}
            <span className="text-muted-foreground">in range</span>
          </div>
        </div>
        <div className="border-border bg-border flex shrink-0 gap-px overflow-hidden rounded-md border font-mono text-[11px]">
          {ranges.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRange(r.key)}
              className={cn(
                "px-2.5 py-1",
                range === r.key
                  ? "bg-accent text-accent-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {r.key}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 4, right: 0, bottom: 0, left: -24 }}
            barCategoryGap={data.length > 48 ? 1 : 3}
          >
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="label"
              tick={{
                fill: "var(--color-muted-foreground)",
                fontSize: 10,
                fontFamily: "var(--font-mono)",
              }}
              tickLine={false}
              axisLine={false}
              minTickGap={32}
            />
            <YAxis
              allowDecimals={false}
              tick={{
                fill: "var(--color-muted-foreground)",
                fontSize: 10,
                fontFamily: "var(--font-mono)",
              }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: "var(--border)" }}
              contentStyle={{
                background: "var(--color-card)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                fontSize: 12,
                fontFamily: "var(--font-mono)",
              }}
              labelStyle={{ color: "var(--color-muted-foreground)" }}
              itemStyle={{ color: "var(--color-foreground)" }}
              formatter={(value, name) => [
                value,
                name === "merged" ? "Merged" : "Opened",
              ]}
            />
            <Bar
              dataKey="opened"
              stackId="a"
              fill="var(--color-muted-foreground)"
              fillOpacity={0.45}
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="merged"
              stackId="a"
              fill="var(--accent)"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
