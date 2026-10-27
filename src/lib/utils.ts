import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const plain = new Intl.NumberFormat("en-US");

export function formatCompact(n: number) {
  return compact.format(n);
}

export function formatNumber(n: number) {
  return plain.format(n);
}

export function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...opts,
  });
}

export function formatMonth(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
  });
}

export function pluralize(
  n: number,
  singular: string,
  plural = `${singular}s`,
) {
  return n === 1 ? singular : plural;
}

export function repoPullsUrl(repoUrl: string, login: string) {
  return `${repoUrl}/pulls?q=${encodeURIComponent(`is:pr author:${login}`)}`;
}
