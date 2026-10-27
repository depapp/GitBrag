import { describe, expect, it } from "vitest";
import { GitHubError } from "./client";
import { baseSearchQuery, normalizeLogin } from "./contributions";

describe("normalizeLogin", () => {
  it("trims whitespace and a leading @", () => {
    expect(normalizeLogin("  @torvalds ")).toBe("torvalds");
  });

  it("accepts hyphenated usernames", () => {
    expect(normalizeLogin("octo-cat-42")).toBe("octo-cat-42");
  });

  it.each([
    "",
    "-leading",
    "trailing-",
    "double--dash",
    "has space",
    "a".repeat(40),
    "bad/slash",
  ])("rejects %j", (value) => {
    expect(() => normalizeLogin(value)).toThrow(GitHubError);
  });
});

describe("baseSearchQuery", () => {
  it("looks for pull requests by the author outside their own repositories", () => {
    expect(baseSearchQuery("octocat")).toContain("is:pr");
    expect(baseSearchQuery("octocat")).toContain("author:octocat");
    expect(baseSearchQuery("octocat")).toContain("-user:octocat");
  });
});
