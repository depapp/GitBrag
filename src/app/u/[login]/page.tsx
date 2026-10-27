import { AlertTriangle, Building2, GitPullRequest } from "lucide-react";
import type { Metadata } from "next";
import Image, { type StaticImageData } from "next/image";
import companyIcon from "@/assets/icons/company.png";
import followersIcon from "@/assets/icons/followers.png";
import locationIcon from "@/assets/icons/location.png";
import websiteIcon from "@/assets/icons/website.png";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { LanguageBar } from "@/components/profile/language-bar";
import { ReportWarmup } from "@/components/profile/report-warmup";
import { PullRequestList } from "@/components/profile/pr-list";
import { ProjectRanking } from "@/components/profile/project-ranking";
import { ShareSection } from "@/components/profile/share-section";
import { TimelineChart } from "@/components/profile/timeline-chart";
import { SiteFooter } from "@/components/site/site-footer";
import { SupportCallout } from "@/components/site/support-callout";
import { SiteHeader } from "@/components/site/site-header";
import { ButtonLink } from "@/components/ui/button";
import {
  isGitHubError,
  compactPullRequests,
  loadReport,
  getUser,
  hasGitHubToken,
  type GitHubUser,
} from "@/lib/github";
import { computeStats } from "@/lib/github/stats";
import { siteConfig } from "@/lib/site";
import { requestProfileUrl, requestSiteUrl } from "@/lib/site-request";
import {
  cn,
  formatCompact,
  formatDate,
  formatNumber,
  pluralize,
} from "@/lib/utils";

type Props = PageProps<"/u/[login]">;

async function loadUser(login: string): Promise<GitHubUser> {
  try {
    return await getUser(login);
  } catch (error) {
    if (isGitHubError(error) && error.code === "NOT_FOUND") notFound();
    console.error(`[gitbrag] loading user ${login} failed`, error);
    throw error;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { login } = await params;
  const user = await loadUser(login);
  const name = user.name ?? user.login;
  let description = `${name}'s open-source contributions: merged pull requests, projects and languages, on ${siteConfig.name}.`;
  try {
    const result = await loadReport(login);
    if (result.status === "ready") {
      const { stats } = result.report;
      description = `${formatNumber(stats.merged)} merged pull requests across ${formatNumber(stats.repositories)} open-source projects reaching ${formatCompact(stats.totalStars)} stars.`;
    }
  } catch {
    /* keep the generic description; the page shows the error */
  }
  const title = `${name}'s open-source contributions`;
  return {
    metadataBase: new URL(await requestSiteUrl()),
    title: `${name} (@${user.login}) open-source contributions`,
    description,
    alternates: { canonical: `/u/${user.login}` },
    openGraph: { title, description, url: `/u/${user.login}`, type: "profile" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ProfilePage({ params, searchParams }: Props) {
  const [{ login }, query] = await Promise.all([params, searchParams]);
  const user = await loadUser(login);
  const hideOrgs = query.orgs === "hide";

  return (
    <>
      <SiteHeader />
      <main className="flex-1 px-2">
        <div className="border-border mx-auto w-full max-w-6xl border-x px-4 py-10 sm:px-8 md:py-14">
          <Identity user={user} />
          {!hasGitHubToken() ? (
            <Notice tone="warning">
              This instance has no <code>GITHUB_TOKEN</code> configured, so
              GitHub allows only 60 requests per hour. Add a token to the
              environment to make searches reliable.
            </Notice>
          ) : null}
          <Suspense fallback={<ReportSkeleton />}>
            <Report login={user.login} hideOrgs={hideOrgs} />
          </Suspense>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function Identity({ user }: { user: GitHubUser }) {
  const website = user.websiteUrl
    ? user.websiteUrl.startsWith("http")
      ? user.websiteUrl
      : `https://${user.websiteUrl}`
    : null;
  const facts: Array<{
    icon: StaticImageData;
    text: string;
    title: string;
    href?: string;
  }> = [];
  if (user.company)
    facts.push({ icon: companyIcon, text: user.company, title: "Company" });
  if (user.location)
    facts.push({ icon: locationIcon, text: user.location, title: "Location" });
  facts.push({
    icon: followersIcon,
    text: `${formatCompact(user.followers)} followers`,
    title: "Followers",
  });
  if (website)
    facts.push({
      icon: websiteIcon,
      text: website.replace(/^https?:\/\//, ""),
      title: "Website",
      href: website,
    });
  return (
    <div className="flex flex-col items-center text-center">
      <Image
        src={user.avatarUrl}
        alt={`${user.login}'s avatar`}
        width={96}
        height={96}
        priority
        className="border-border size-20 rounded-full border md:size-24"
      />
      <a
        href={user.url}
        target="_blank"
        rel="noreferrer"
        className="border-border hover:border-border-strong mt-5 inline-flex items-center border px-3 py-1 font-mono text-xs tracking-[0.08em] uppercase"
      >
        @{user.login} · joined {new Date(user.createdAt).getFullYear()}
      </a>
      <h1 className="mt-4 max-w-4xl text-4xl tracking-tighter text-balance md:text-6xl">
        {user.name ?? user.login}
      </h1>
      {user.bio ? (
        <p className="text-muted-foreground mt-4 max-w-prose text-sm tracking-tight text-balance lg:text-base">
          {user.bio}
        </p>
      ) : null}
      <ul className="text-muted-foreground mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 font-mono text-[11px] uppercase">
        {facts.map((f) => (
          <li key={f.title} title={f.title}>
            {f.href ? (
              <a
                href={f.href}
                target="_blank"
                rel="noreferrer"
                className="hover:text-accent inline-flex items-center gap-1.5 normal-case"
              >
                <Image src={f.icon} alt={f.title} width={18} height={18} />
                {f.text}
              </a>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <Image src={f.icon} alt={f.title} width={18} height={18} />
                {f.text}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

async function Report({
  login,
  hideOrgs,
}: {
  login: string;
  hideOrgs: boolean;
}) {
  const result = await loadReport(login);
  if (result.status === "pending") {
    return (
      <div className="mt-10">
        <ReportWarmup login={login} initial={result.progress} />
      </div>
    );
  }
  const { report } = result;
  const { user } = report;
  const pullRequests = hideOrgs
    ? report.pullRequests.filter((pr) => !pr.inUserOrg)
    : report.pullRequests;
  const stats = hideOrgs ? computeStats(pullRequests) : report.stats;
  const orgPrCount = report.pullRequests.filter((pr) => pr.inUserOrg).length;
  const url = await requestProfileUrl(user.login);
  const cardBase = `${await requestSiteUrl()}/api/card/${encodeURIComponent(user.login)}`;
  const shareText = `${user.name ?? user.login} has ${formatNumber(stats.merged)} merged pull requests across ${formatNumber(stats.repositories)} open-source projects. See the full record on ${siteConfig.name}:`;
  const compact = compactPullRequests(pullRequests);

  if (stats.total === 0) {
    return (
      <section className="border-border-strong bg-card mt-10 rounded-lg border border-dashed px-6 py-16 text-center">
        <GitPullRequest className="text-muted-foreground mx-auto size-8" />
        <h2 className="mt-4 text-xl font-semibold">
          No upstream pull requests yet
        </h2>
        <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm">
          {hideOrgs
            ? `All of @${user.login}'s pull requests go to organizations they belong to.`
            : `@${user.login} has not opened pull requests in repositories owned by others, or they are all in forks.`}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          {hideOrgs ? (
            <ButtonLink href={`/u/${user.login}`} variant="outline" size="sm">
              Include organization repos
            </ButtonLink>
          ) : null}
          <ButtonLink href="/" size="sm">
            Search another user
          </ButtonLink>
        </div>
      </section>
    );
  }

  const numbers: Array<[string, string, string]> = [
    [
      formatNumber(stats.merged),
      "merged pull requests",
      `${Math.round(stats.mergeRate * 100)}% of ${formatNumber(stats.total)} opened`,
    ],
    [
      formatNumber(stats.repositories),
      pluralize(stats.repositories, "project"),
      `${formatNumber(stats.organizations)} ${pluralize(stats.organizations, "owner")}`,
    ],
    [
      formatCompact(stats.totalStars),
      "stars reached",
      "across contributed repos",
    ],
    [
      String(stats.yearsActive),
      pluralize(stats.yearsActive, "year"),
      stats.firstContribution
        ? `since ${new Date(stats.firstContribution).getFullYear()}`
        : "",
    ],
  ];

  return (
    <>
      {report.truncated ? (
        <Notice tone="info">
          GitHub&apos;s search API limited how many pull requests could be
          loaded. The numbers below are a lower bound.
        </Notice>
      ) : null}

      <div className="text-muted-foreground mt-10 flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] uppercase">
        <span>
          Fetched{" "}
          {formatDate(report.fetchedAt, {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        {orgPrCount > 0 ? (
          <span className="flex items-center gap-2">
            <Building2 className="size-3.5" />
            {formatNumber(orgPrCount)} {pluralize(orgPrCount, "PR")} in own orgs
            <Link
              href={
                hideOrgs ? `/u/${user.login}` : `/u/${user.login}?orgs=hide`
              }
              className="border-border text-foreground hover:bg-muted border px-2 py-0.5"
            >
              {hideOrgs ? "Include" : "Hide"}
            </Link>
          </span>
        ) : null}
      </div>

      <dl className="border-border divide-border mt-3 grid grid-cols-2 divide-x border-y text-center lg:grid-cols-4">
        {numbers.map(([value, label, hint]) => (
          <div key={label} className="px-2 py-7">
            <dd className="tabular font-mono text-4xl tracking-tight md:text-5xl">
              {value}
            </dd>
            <dt className="text-muted-foreground mt-2 font-mono text-[11px] uppercase">
              {label}
            </dt>
            <dd className="text-muted-foreground mt-1 font-mono text-[11px]">
              {hint}
            </dd>
          </div>
        ))}
      </dl>
      <div className="mt-6">
        <LanguageBar languages={stats.languages} />
      </div>

      <section className="mt-12">
        <ProjectRanking repos={stats.topRepositories} login={user.login} />
      </section>

      <section className="mt-14">
        <TimelineChart monthly={stats.monthly} />
      </section>

      <ShareSection
        url={url}
        login={user.login}
        text={shareText}
        cardBase={cardBase}
      />

      <section className="mt-14">
        <div className="mb-4">
          <span className="label">All pull requests</span>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">
            {formatNumber(stats.total)} {pluralize(stats.total, "pull request")}
          </h2>
        </div>
        <PullRequestList repos={compact.repos} prs={compact.prs} />
      </section>

      <SupportCallout />
    </>
  );
}

function ReportSkeleton() {
  return (
    <div aria-busy className="mt-10">
      <p className="label text-center">
        Collecting pull requests from GitHub… this can take a few seconds for
        busy contributors.
      </p>
      <div className="border-border divide-border mt-4 grid grid-cols-2 divide-x border-y lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-3 px-2 py-7">
            <div className="skeleton h-10 w-20" />
            <div className="skeleton h-3 w-24" />
          </div>
        ))}
      </div>
      <div className="skeleton mt-12 h-72" />
    </div>
  );
}

function Notice({
  tone,
  children,
}: {
  tone: "warning" | "info";
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "mt-6 flex items-start gap-3 rounded-md border px-4 py-3 text-sm",
        tone === "warning"
          ? "border-negative/30 bg-negative/5 text-foreground"
          : "border-border bg-muted text-muted-foreground",
      )}
    >
      <AlertTriangle
        className={cn(
          "mt-0.5 size-4 shrink-0",
          tone === "warning" ? "text-negative" : "text-accent",
        )}
      />
      <p>{children}</p>
    </div>
  );
}
