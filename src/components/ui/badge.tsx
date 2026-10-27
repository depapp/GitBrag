import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "accent" | "positive" | "negative";

const tones: Record<Tone, string> = {
  neutral: "border-border bg-muted text-muted-foreground",
  accent: "border-accent/20 bg-accent-soft text-accent",
  positive: "border-positive/20 bg-positive/10 text-positive",
  negative: "border-negative/20 bg-negative/10 text-negative",
};

export function Badge({
  className,
  tone = "neutral",
  ...props
}: ComponentProps<"span"> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 font-mono text-[11px] font-medium tracking-wide uppercase",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
