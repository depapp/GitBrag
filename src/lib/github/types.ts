export type PullRequestState = "MERGED" | "OPEN" | "CLOSED";

export interface Language {
  name: string;
  color: string | null;
}

export interface RepoRef {
  nameWithOwner: string;
  owner: string;
  name: string;
  url: string;
  description: string | null;
  stars: number;
  forks: number;
  language: Language | null;
  ownerAvatarUrl: string;
  isFork: boolean;
  isArchived: boolean;
}

export interface PullRequest {
  id: string;
  number: number;
  title: string;
  url: string;
  state: PullRequestState;
  createdAt: string;
  mergedAt: string | null;
  closedAt: string | null;
  repo: RepoRef;
  /** The repository belongs to an organization the user is a public member of. */
  inUserOrg: boolean;
}

export interface GitHubUser {
  login: string;
  name: string | null;
  avatarUrl: string;
  bio: string | null;
  location: string | null;
  company: string | null;
  websiteUrl: string | null;
  twitterUsername: string | null;
  followers: number;
  following: number;
  publicRepos: number;
  createdAt: string;
  url: string;
  organizations: string[];
}

export interface RepoSummary extends RepoRef {
  pullRequests: number;
  merged: number;
  firstContribution: string;
  lastContribution: string;
}

export interface LanguageShare {
  name: string;
  color: string | null;
  pullRequests: number;
  share: number;
}

export interface MonthBucket {
  /** First day of the month, ISO date (YYYY-MM-01). */
  month: string;
  merged: number;
  opened: number;
}

export interface YearBucket {
  year: number;
  merged: number;
  opened: number;
}

export interface ContributionStats {
  total: number;
  merged: number;
  open: number;
  closed: number;
  repositories: number;
  organizations: number;
  totalStars: number;
  firstContribution: string | null;
  lastContribution: string | null;
  yearsActive: number;
  languages: LanguageShare[];
  topRepositories: RepoSummary[];
  monthly: MonthBucket[];
  yearly: YearBucket[];
  mergeRate: number;
}

export interface ContributionReport {
  user: GitHubUser;
  pullRequests: PullRequest[];
  stats: ContributionStats;
  fetchedAt: string;
  /** True when GitHub's search limits prevented loading every pull request. */
  truncated: boolean;
}

export interface UserSuggestion {
  login: string;
  name: string | null;
  avatarUrl: string;
}
