import { unstable_cache } from "next/cache";
import { githubGraphQL } from "./client";
import { USER_SEARCH_QUERY } from "./queries";
import type { UserSuggestion } from "./types";

interface UserSearchResult {
  search: {
    nodes: Array<
      | { login: string; name: string | null; avatarUrl: string }
      | Record<string, never>
      | null
    >;
  };
}

async function searchUsersUncached(term: string): Promise<UserSuggestion[]> {
  const data = await githubGraphQL<UserSearchResult>(USER_SEARCH_QUERY, {
    q: `${term} in:login type:user`,
  });
  return data.search.nodes
    .filter(
      (n): n is { login: string; name: string | null; avatarUrl: string } =>
        Boolean(n && "login" in n && n.login),
    )
    .map((n) => ({ login: n.login, name: n.name, avatarUrl: n.avatarUrl }));
}

export const searchUsers = unstable_cache(
  searchUsersUncached,
  ["user-search"],
  {
    revalidate: 60 * 60 * 24,
  },
);

export function sanitizeSearchTerm(raw: string) {
  return raw
    .trim()
    .replace(/^@/, "")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .slice(0, 39);
}
