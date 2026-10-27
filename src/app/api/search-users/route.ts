import { NextResponse } from "next/server";
import { isGitHubError, sanitizeSearchTerm, searchUsers } from "@/lib/github";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const term = sanitizeSearchTerm(searchParams.get("q") ?? "");
  if (term.length < 2) {
    return NextResponse.json({ users: [] });
  }
  try {
    const users = await searchUsers(term.toLowerCase());
    return NextResponse.json(
      { users },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=86400, stale-while-revalidate=86400",
        },
      },
    );
  } catch (error) {
    const status = isGitHubError(error) ? error.status : 502;
    return NextResponse.json(
      { users: [], error: "search_unavailable" },
      { status },
    );
  }
}
