import { NextResponse } from "next/server";
import { isGitHubError, loadReport } from "@/lib/github";

/** Each call works on the report for up to this long before handing back progress. */
const SLICE_MS = 6_500;

/**
 * `/api/report/<login>` → `{ status: "ready" }` once the report is cached, or
 * `{ status: "pending", fetched, total }` while GitHub pages are still being
 * fetched. The profile page polls this until it is ready.
 */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/report/[login]">,
) {
  const { login } = await params;
  try {
    const result = await loadReport(login, SLICE_MS);
    const body =
      result.status === "ready"
        ? { status: "ready" as const }
        : { status: "pending" as const, ...result.progress };
    return NextResponse.json(body, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (isGitHubError(error)) {
      return NextResponse.json(
        { status: "error", error: error.message, code: error.code },
        { status: error.status, headers: { "Cache-Control": "no-store" } },
      );
    }
    throw error;
  }
}
