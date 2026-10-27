import type { ContributionReport } from "@/lib/github/types";
import { formatCompact } from "@/lib/utils";

function esc(s: string) {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
}

/** Compact stat card for READMEs. Pure SVG, no external fonts or images. */
export function renderBadgeSvg(
  report: ContributionReport,
  theme: "dark" | "light",
) {
  const { user, stats } = report;
  const dark = theme === "dark";
  const bg = dark ? "#090c14" : "#ffffff";
  const fg = dark ? "#f3f4f6" : "#0b1220";
  const muted = dark ? "#9aa3b2" : "#6b7280";
  const border = dark ? "#1f2633" : "#e5e7eb";
  const blue = "#2563eb";
  const months = stats.monthly.slice(-24);
  const max = Math.max(1, ...months.map((m) => m.merged));
  const w = 495;
  const h = 195;
  const kpis = [
    ["Merged PRs", formatCompact(stats.merged)],
    ["Projects", formatCompact(stats.repositories)],
    ["Stars reached", formatCompact(stats.totalStars)],
    ["Years active", String(stats.yearsActive)],
  ];
  const barW = (w - 48) / months.length;
  const bars = months
    .map((m, i) => {
      const bh = Math.max(2, (m.merged / max) * 40);
      return `<rect x="${(24 + i * barW).toFixed(1)}" y="${(h - 24 - bh).toFixed(1)}" width="${(barW - 2).toFixed(1)}" height="${bh.toFixed(1)}" rx="1" fill="${blue}" opacity="${(0.4 + (i / months.length) * 0.6).toFixed(2)}"/>`;
    })
    .join("");
  const name = esc(user.name ?? user.login);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${name}: ${stats.merged} merged open-source pull requests">
  <title>${name}: open-source contributions on GitBrag</title>
  <style>
    .t{font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;fill:${fg}}
    .m{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
    .mu{fill:${muted}}
  </style>
  <rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="8" fill="${bg}" stroke="${border}"/>
  <rect x="24" y="22" width="12" height="12" rx="3" fill="${blue}"/>
  <text x="42" y="32.5" class="t" font-size="13" font-weight="600">GitBrag</text>
  <text x="${w - 24}" y="32.5" text-anchor="end" class="m mu" font-size="10" letter-spacing="1">@${esc(user.login).toUpperCase()}</text>
  <text x="24" y="62" class="t" font-size="18" font-weight="700">${name}</text>
  <text x="24" y="78" class="m mu" font-size="10" letter-spacing="1">OPEN-SOURCE CONTRIBUTIONS</text>
  ${kpis
    .map(
      ([label, value], i) => `<g transform="translate(${24 + i * 112},96)">
    <text class="m mu" font-size="9" letter-spacing="1">${label.toUpperCase()}</text>
    <text y="24" class="m t" font-size="22" font-weight="500">${esc(value)}</text>
  </g>`,
    )
    .join("\n  ")}
  ${bars}
</svg>`;
}
