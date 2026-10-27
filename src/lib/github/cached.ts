import { unstable_cache } from "next/cache";
import { githubGraphQL } from "./client";

export const CACHE_SECONDS = 60 * 60;

/**
 * `unstable_cache` derives its key from the callback's source text. Each entry
 * point (page, route handler, OG image) is bundled and minified separately, so
 * an ordinary callback would get a differently-named copy per bundle and its
 * own cache entry. Building the callback from a string at runtime gives every
 * bundle the identical source, so the GitHub cache is shared across them.
 */
declare global {
  var __gitbragGraphQL: typeof githubGraphQL | undefined;
}
globalThis.__gitbragGraphQL = githubGraphQL;

type Cacheable = (
  query: string,
  variables: Record<string, unknown>,
) => Promise<unknown>;

const callback = new Function(
  "query",
  "variables",
  "return globalThis.__gitbragGraphQL(query, variables);",
) as Cacheable;

const cached = unstable_cache(callback, ["github-graphql", "v1"], {
  revalidate: CACHE_SECONDS,
  tags: ["github"],
});

/**
 * Caches one GitHub GraphQL response for an hour. Reports are assembled from
 * many such pages, so a build that runs out of time resumes from the cache.
 */
export function cachedGraphQL<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const started = Date.now();
  return (cached(query, variables) as Promise<T>).finally(() => {
    if (process.env.GITBRAG_DEBUG) {
      console.log(
        `[gitbrag] graphql ${Date.now() - started}ms ${JSON.stringify(variables).slice(0, 80)}`,
      );
    }
  });
}
