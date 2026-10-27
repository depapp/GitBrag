import { headers } from "next/headers";
import { getSiteUrl } from "./site";
/**
 * Origin of the current request, so links and cards point at whichever host
 * is serving the page (preview/alias deploys, custom domains) rather than the
 * configured production URL. Falls back to `getSiteUrl()` outside a request.
 */
export async function requestSiteUrl() {
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (!host) return getSiteUrl();
    const proto =
      h.get("x-forwarded-proto") ??
      (host.startsWith("localhost") ? "http" : "https");
    return `${proto}://${host}`;
  } catch {
    return getSiteUrl();
  }
}

export async function requestProfileUrl(login: string) {
  return `${await requestSiteUrl()}/u/${encodeURIComponent(login)}`;
}
