import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";
import { loadCardFonts } from "@/lib/cards/fonts";
import { renderBadgeSvg } from "@/lib/cards/badge-svg";
import { loadCardLogo } from "@/lib/cards/logo";
import { CARD_SIZES, parseCardFormat, ShareCard } from "@/lib/cards/share-card";
import {
  isGitHubError,
  loadReport,
  REPORT_REVALIDATE_SECONDS,
} from "@/lib/github";
import { requestSiteUrl } from "@/lib/site-request";

const cacheHeader = `public, s-maxage=${REPORT_REVALIDATE_SECONDS}, stale-while-revalidate=${REPORT_REVALIDATE_SECONDS}`;
// Netlify's CDN only keys cached responses on the query parameters listed here.
const varyHeader = "query=format|download|theme";

/**
 * `/api/card/<login>.svg`  → live README badge (SVG).
 * `/api/card/<login>.png?format=og|square|story[&download=1]` → share image.
 */
export async function GET(
  request: Request,
  { params }: RouteContext<"/api/card/[login]">,
) {
  const { login: raw } = await params;
  const match = /^(.+?)(?:\.(svg|png))?$/.exec(raw);
  const login = match?.[1] ?? raw;
  const ext = match?.[2] ?? "png";
  const { searchParams } = new URL(request.url);

  let report;
  try {
    const result = await loadReport(login);
    if (result.status === "pending") {
      return NextResponse.json(
        {
          status: "pending",
          ...result.progress,
          message: `Report for ${login} is still being built. Open the profile page and try again.`,
        },
        {
          status: 503,
          headers: { "Cache-Control": "no-store", "Retry-After": "10" },
        },
      );
    }
    report = result.report;
  } catch (error) {
    if (isGitHubError(error)) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    throw error;
  }

  if (ext === "svg") {
    return new NextResponse(
      renderBadgeSvg(
        report,
        searchParams.get("theme") === "light" ? "light" : "dark",
      ),
      {
        headers: {
          "Content-Type": "image/svg+xml; charset=utf-8",
          "Cache-Control": cacheHeader,
          "Netlify-Vary": varyHeader,
        },
      },
    );
  }

  const format = parseCardFormat(searchParams.get("format"));
  const [fonts, logo] = await Promise.all([loadCardFonts(), loadCardLogo()]);
  const siteHost = new URL(await requestSiteUrl()).host;
  const image = new ImageResponse(
    <ShareCard
      report={report}
      format={format}
      siteHost={siteHost}
      logo={logo}
    />,
    {
      ...CARD_SIZES[format],
      fonts,
    },
  );
  const headers = new Headers(image.headers);
  headers.set("Cache-Control", cacheHeader);
  headers.set("Netlify-Vary", varyHeader);
  if (searchParams.get("download")) {
    headers.set(
      "Content-Disposition",
      `attachment; filename="gitbrag-${report.user.login}-${format}.png"`,
    );
  }
  return new Response(image.body, { status: 200, headers });
}
