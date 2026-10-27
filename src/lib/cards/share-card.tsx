import type { ContributionReport, GitHubUser } from "@/lib/github/types";
import { formatCompact } from "@/lib/utils";

export type CardFormat = "og" | "square" | "story";

export const CARD_SIZES: Record<CardFormat, { width: number; height: number }> =
  {
    og: { width: 1200, height: 630 },
    square: { width: 1080, height: 1080 },
    story: { width: 1080, height: 1920 },
  };

export function parseCardFormat(value: string | null): CardFormat {
  return value === "square" || value === "story" ? value : "og";
}

const BLUE = "#2563eb";
const BG = "#090c14";
const BORDER = "rgba(255,255,255,0.12)";
const MUTED = "#9aa3b2";

/** JSX rendered by Satori (`ImageResponse`); uses only flexbox + inline styles. */
export function ShareCard({
  report,
  format,
  siteHost,
  logo,
}: {
  logo?: string;
  report: ContributionReport;
  format: CardFormat;
  siteHost: string;
}) {
  const { user, stats } = report;
  const { width, height } = CARD_SIZES[format];
  const vertical = format !== "og";
  const scale = format === "story" ? 1.35 : 1;
  const px = (n: number) => Math.round(n * scale);

  const kpis = [
    { label: "MERGED PRS", value: formatCompact(stats.merged) },
    { label: "PROJECTS", value: formatCompact(stats.repositories) },
    { label: "STARS REACHED", value: formatCompact(stats.totalStars) },
    { label: "YEARS ACTIVE", value: String(stats.yearsActive) },
  ];
  const months = stats.monthly.slice(-24);
  const max = Math.max(1, ...months.map((m) => m.merged));
  const topRepos = [...stats.topRepositories]
    .sort(
      (a, b) =>
        b.stars - a.stars ||
        b.merged - a.merged ||
        a.nameWithOwner.localeCompare(b.nameWithOwner),
    )
    .slice(0, format === "story" ? 5 : 3);
  const langs = stats.languages.slice(0, 5);

  return (
    <div
      style={{
        width,
        height,
        display: "flex",
        flexDirection: "column",
        background: BG,
        color: "#f3f4f6",
        fontFamily: "Inter",
        padding: px(56),
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: px(28),
          border: `1px solid ${BORDER}`,
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: px(28),
          left: px(28),
          width: px(14),
          height: px(14),
          borderTop: `2px solid ${BLUE}`,
          borderLeft: `2px solid ${BLUE}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: px(28),
          right: px(28),
          width: px(14),
          height: px(14),
          borderBottom: `2px solid ${BLUE}`,
          borderRight: `2px solid ${BLUE}`,
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: px(10) }}>
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element -- Satori renders plain <img>
            <img src={logo} width={px(26)} height={px(26)} alt="" />
          ) : (
            <div
              style={{
                width: px(22),
                height: px(22),
                borderRadius: px(5),
                background: BLUE,
                display: "flex",
              }}
            />
          )}
          <span
            style={{ fontSize: px(22), fontWeight: 600, letterSpacing: -0.5 }}
          >
            GitBrag
          </span>
        </div>
        <span
          style={{
            fontFamily: "JetBrains Mono",
            fontSize: px(14),
            color: MUTED,
            letterSpacing: 1,
          }}
        >
          {siteHost.toUpperCase()}/U/{user.login.toUpperCase()}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: px(24),
          marginTop: px(vertical ? 56 : 36),
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${user.avatarUrl}${user.avatarUrl.includes("?") ? "&" : "?"}s=256`}
          alt=""
          width={px(vertical ? 128 : 96)}
          height={px(vertical ? 128 : 96)}
          style={{ borderRadius: px(16), border: `1px solid ${BORDER}` }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: px(4) }}>
          <span
            style={{
              fontFamily: "JetBrains Mono",
              fontSize: px(13),
              color: BLUE,
              letterSpacing: 2,
            }}
          >
            OPEN-SOURCE CONTRIBUTIONS
          </span>
          <span
            style={{
              fontSize: px(vertical ? 54 : 44),
              fontWeight: 800,
              letterSpacing: -2,
              lineHeight: 1.05,
            }}
          >
            {user.name ?? user.login}
          </span>
          <span
            style={{
              fontFamily: "JetBrains Mono",
              fontSize: px(18),
              color: MUTED,
            }}
          >
            @{user.login}
          </span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          marginTop: px(vertical ? 48 : 32),
          border: `1px solid ${BORDER}`,
          borderRadius: px(10),
          overflow: "hidden",
          flexWrap: vertical ? "wrap" : "nowrap",
        }}
      >
        {kpis.map((k, i) => (
          <div
            key={k.label}
            style={{
              display: "flex",
              flexDirection: "column",
              flexBasis: vertical ? "50%" : "25%",
              padding: `${px(18)}px ${px(22)}px`,
              ...(!vertical && i > 0
                ? { borderLeft: `1px solid ${BORDER}` }
                : {}),
              ...(vertical && i % 2 === 0
                ? { borderRight: `1px solid ${BORDER}` }
                : {}),
              ...(vertical && i >= 2
                ? { borderTop: `1px solid ${BORDER}` }
                : {}),
            }}
          >
            <span
              style={{
                fontFamily: "JetBrains Mono",
                fontSize: px(12),
                color: MUTED,
                letterSpacing: 1.5,
              }}
            >
              {k.label}
            </span>
            <span
              style={{
                fontFamily: "JetBrains Mono",
                fontSize: px(vertical ? 54 : 44),
                fontWeight: 500,
                marginTop: px(6),
                letterSpacing: -1,
              }}
            >
              {k.value}
            </span>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: vertical ? "column" : "row",
          gap: px(32),
          marginTop: px(vertical ? 40 : 28),
          flex: 1,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            ...(vertical ? {} : { flex: 3 }),
          }}
        >
          <span
            style={{
              fontFamily: "JetBrains Mono",
              fontSize: px(12),
              color: MUTED,
              letterSpacing: 1.5,
            }}
          >
            MERGED · LAST 24 MONTHS
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: px(5),
              height: px(format === "story" ? 160 : 110),
              marginTop: px(14),
            }}
          >
            {months.map((m, i) => (
              <div
                key={m.month}
                style={{
                  flex: 1,
                  height: `${Math.max(4, (m.merged / max) * 100)}%`,
                  background: BLUE,
                  opacity: 0.4 + (i / months.length) * 0.6,
                  borderRadius: 2,
                }}
              />
            ))}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            ...(vertical ? {} : { flex: 2 }),
            gap: px(10),
          }}
        >
          <span
            style={{
              fontFamily: "JetBrains Mono",
              fontSize: px(12),
              color: MUTED,
              letterSpacing: 1.5,
            }}
          >
            TOP PROJECTS
          </span>
          {topRepos.map((r) => (
            <div
              key={r.nameWithOwner}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: px(vertical ? 22 : 18),
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: px(10),
                  minWidth: 0,
                  flex: 1,
                }}
              >
                <span
                  style={{
                    width: px(10),
                    height: px(10),
                    borderRadius: 999,
                    background: r.language?.color ?? MUTED,
                    display: "flex",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontWeight: 600,
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                    maxWidth: "100%",
                  }}
                >
                  {r.nameWithOwner}
                </span>
              </span>
              <span
                style={{
                  fontFamily: "JetBrains Mono",
                  color: MUTED,
                  fontSize: px(vertical ? 18 : 15),
                  flexShrink: 0,
                  marginLeft: px(12),
                }}
              >
                {formatCompact(r.stars)} stars
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: px(24),
        }}
      >
        <div style={{ display: "flex", gap: px(16) }}>
          {langs.map((l) => (
            <span
              key={l.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: px(6),
                fontFamily: "JetBrains Mono",
                fontSize: px(13),
                color: MUTED,
              }}
            >
              <span
                style={{
                  width: px(8),
                  height: px(8),
                  borderRadius: 999,
                  background: l.color ?? MUTED,
                  display: "flex",
                }}
              />
              {l.name}
            </span>
          ))}
        </div>
        <span
          style={{
            fontFamily: "JetBrains Mono",
            fontSize: px(13),
            color: MUTED,
            letterSpacing: 1,
          }}
        >
          {Math.round(stats.mergeRate * 100)}% MERGE RATE
        </span>
      </div>
    </div>
  );
}

/** Shown while a profile's report is still being built; never cached. */
export function PendingCard({
  user,
  format,
  siteHost,
}: {
  user: GitHubUser;
  format: CardFormat;
  siteHost: string;
}) {
  const { width, height } = CARD_SIZES[format];
  const scale = format === "story" ? 1.35 : format === "square" ? 1.15 : 1;
  const px = (n: number) => Math.round(n * scale);
  return (
    <div
      style={{
        width,
        height,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: BG,
        color: "white",
        fontFamily: "Inter",
        gap: px(20),
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={user.avatarUrl}
        alt=""
        width={px(112)}
        height={px(112)}
        style={{ borderRadius: px(24), border: `2px solid ${BORDER}` }}
      />
      <div style={{ display: "flex", fontSize: px(44), fontWeight: 800 }}>
        {user.name ?? user.login}
      </div>
      <div
        style={{
          display: "flex",
          fontFamily: "JetBrains Mono",
          fontSize: px(20),
          color: MUTED,
        }}
      >
        @{user.login} · OPEN-SOURCE CONTRIBUTIONS
      </div>
      <div
        style={{
          display: "flex",
          marginTop: px(16),
          fontSize: px(18),
          color: BLUE,
          fontFamily: "JetBrains Mono",
          letterSpacing: 1,
        }}
      >
        {siteHost.toUpperCase()}/U/{user.login.toUpperCase()}
      </div>
    </div>
  );
}
