"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { LanguageShare } from "@/lib/github/types";

const GAP = 8;
const FALLBACK = 6;

function color(l: LanguageShare) {
  return l.color ?? "var(--color-muted-foreground)";
}

function Chip({ l }: { l: LanguageShare }) {
  return (
    <span className="border-border bg-card inline-flex items-center gap-2 rounded-full border py-1 pr-3 pl-2 text-sm whitespace-nowrap">
      <span
        className="size-2.5 rounded-full"
        style={{ background: color(l) }}
      />
      {l.name}
      <span className="tabular text-muted-foreground font-mono text-xs">
        {(l.share * 100).toFixed(0)}%
      </span>
    </span>
  );
}

function More({ count, share }: { count: number; share: number }) {
  return (
    <span className="text-muted-foreground inline-flex items-center py-1 pl-1 text-sm whitespace-nowrap">
      +{count} more · {(share * 100).toFixed(0)}%
    </span>
  );
}

export function LanguageBar({ languages }: { languages: LanguageShare[] }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(Math.min(FALLBACK, languages.length));

  useLayoutEffect(() => {
    const row = rowRef.current;
    const measure = measureRef.current;
    if (!row || !measure) return;
    const fit = () => {
      const width = row.clientWidth;
      const nodes = Array.from(measure.children) as HTMLElement[];
      const more = nodes[nodes.length - 1].offsetWidth;
      const chips = nodes.slice(0, -1).map((n) => n.offsetWidth);
      const maxRows = width < 640 ? 2 : 1;
      let line = 0;
      let used = 0;
      let count = 0;
      for (let i = 0; i < chips.length; i++) {
        const last = i === chips.length - 1;
        let next = used + chips[i] + (used > 0 ? GAP : 0);
        if (next > width && used > 0) {
          line += 1;
          next = chips[i];
        }
        if (line >= maxRows) break;
        const tail = last ? 0 : more + GAP;
        const spill = next + tail > width && line === maxRows - 1;
        if (spill && !(last && next <= width)) break;
        used = next;
        count = i + 1;
      }
      setVisible(Math.max(1, count));
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(row);
    return () => observer.disconnect();
  }, [languages]);

  if (languages.length === 0) return null;
  const top = languages.slice(0, visible);
  const rest = languages.slice(visible);
  const restShare = rest.reduce((s, l) => s + l.share, 0);

  return (
    <div className="border-border flex flex-col gap-3 border-b pb-6">
      <div className="bg-muted flex h-3 overflow-hidden rounded-full">
        {top.map((l) => (
          <span
            key={l.name}
            title={`${l.name} ${(l.share * 100).toFixed(0)}%`}
            style={{ width: `${l.share * 100}%`, background: color(l) }}
          />
        ))}
        {restShare > 0 ? (
          <span
            title={`${rest.length} more ${(restShare * 100).toFixed(0)}%`}
            style={{
              width: `${restShare * 100}%`,
              background: "var(--border-strong)",
            }}
          />
        ) : null}
      </div>
      <div className="relative">
        <div
          ref={measureRef}
          aria-hidden="true"
          className="pointer-events-none invisible absolute inset-x-0 top-0 flex gap-2 overflow-hidden whitespace-nowrap"
        >
          {languages.map((l) => (
            <Chip key={l.name} l={l} />
          ))}
          <More count={languages.length} share={1} />
        </div>
        <div ref={rowRef} className="flex flex-wrap gap-2 overflow-hidden">
          {top.map((l) => (
            <Chip key={l.name} l={l} />
          ))}
          {rest.length > 0 ? (
            <More count={rest.length} share={restShare} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
