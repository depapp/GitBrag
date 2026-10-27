const GRAPHQL_ENDPOINT = "https://api.github.com/graphql";

export type GitHubErrorCode =
  "NOT_FOUND" | "RATE_LIMITED" | "NO_TOKEN" | "UPSTREAM";

export class GitHubError extends Error {
  constructor(
    message: string,
    public readonly code: GitHubErrorCode,
    public readonly status = 500,
  ) {
    super(message);
    this.name = "GitHubError";
  }
}

/** `instanceof` is unreliable when server bundles each carry their own copy of this module. */
export function isGitHubError(error: unknown): error is GitHubError {
  return (
    error instanceof GitHubError ||
    (error instanceof Error && error.name === "GitHubError")
  );
}

interface GraphQLErrorItem {
  type?: string;
  message: string;
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: GraphQLErrorItem[];
}

export function hasGitHubToken() {
  return Boolean(process.env.GITHUB_TOKEN);
}

export async function githubGraphQL<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new GitHubError(
      "GITHUB_TOKEN is not configured on the server.",
      "NO_TOKEN",
      500,
    );
  }

  const res = await fetchWithRetry(() =>
    fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "gitbrag",
      },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    }),
  );

  if (res.status === 401) {
    throw new GitHubError("GitHub rejected the server token.", "UPSTREAM", 502);
  }
  if (res.status === 403 || res.status === 429) {
    throw new GitHubError(
      "GitHub API rate limit reached. Please try again in a few minutes.",
      "RATE_LIMITED",
      429,
    );
  }
  if (!res.ok) {
    throw new GitHubError(
      `GitHub API responded with ${res.status}.`,
      "UPSTREAM",
      502,
    );
  }

  let json: GraphQLResponse<T>;
  try {
    json = (await res.json()) as GraphQLResponse<T>;
  } catch {
    throw new GitHubError(
      "GitHub returned an unreadable response.",
      "UPSTREAM",
      502,
    );
  }
  if (json.errors?.length) {
    const notFound = json.errors.find((e) => e.type === "NOT_FOUND");
    if (notFound) {
      throw new GitHubError(notFound.message, "NOT_FOUND", 404);
    }
    const rateLimited = json.errors.find((e) => e.type === "RATE_LIMITED");
    if (rateLimited) {
      throw new GitHubError(rateLimited.message, "RATE_LIMITED", 429);
    }
    if (!json.data) {
      throw new GitHubError(json.errors[0].message, "UPSTREAM", 502);
    }
  }
  if (!json.data) {
    throw new GitHubError("Empty response from GitHub.", "UPSTREAM", 502);
  }
  return json.data;
}

/** GitHub occasionally answers 502/504 under load; retry those a couple of times. */
async function fetchWithRetry(
  run: () => Promise<Response>,
  attempts = 3,
): Promise<Response> {
  let last: Response | undefined;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      last = await run();
    } catch (error) {
      if (attempt === attempts - 1) throw error;
      await sleep(500 * 2 ** attempt);
      continue;
    }
    if (last.status < 500) return last;
    if (attempt < attempts - 1) await sleep(500 * 2 ** attempt);
  }
  return last!;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
