import { ImageResponse } from "next/og";
import { loadCardFonts } from "@/lib/cards/fonts";
import { loadCardLogo } from "@/lib/cards/logo";
import { CARD_SIZES, PendingCard, ShareCard } from "@/lib/cards/share-card";
import { getUser, loadReport } from "@/lib/github";
import { requestSiteUrl } from "@/lib/site-request";

export const alt = "Open-source contributions on GitBrag";
export const size = CARD_SIZES.og;
export const contentType = "image/png";

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ login: string }>;
}) {
  const { login } = await params;
  const [result, fonts, logo] = await Promise.all([
    loadReport(login),
    loadCardFonts(),
    loadCardLogo(),
  ]);
  const siteHost = new URL(await requestSiteUrl()).host;
  if (result.status === "pending") {
    const user = await getUser(login);
    return new ImageResponse(
      <PendingCard user={user} format="og" siteHost={siteHost} />,
      { ...size, fonts, headers: { "Cache-Control": "no-store" } },
    );
  }
  return new ImageResponse(
    <ShareCard
      report={result.report}
      format="og"
      siteHost={siteHost}
      logo={logo}
    />,
    { ...size, fonts },
  );
}
