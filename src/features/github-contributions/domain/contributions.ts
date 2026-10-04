import { contributionCatalog } from "@/lib/content/contributions"
import { profileCatalog } from "@/lib/content/profile"

export type ContributionDay = { date: string; contributionCount: number }
export type ContributionWeek = { contributionDays: ContributionDay[] }

export type GitHubContributionStats = {
  /** Last 12 months (GitHub contributionsCollection default range). */
  commits: number
  pullRequests: number
  codeReviews: number
  issues: number
  repositoriesCreated: number
  privateContributions: number
  /** All time. */
  allTimePullRequests: number
  allTimeMergedPullRequests: number
  allTimeIssues: number
  publicRepositories: number
  followers: number
}

export type GitHubRepositoryContribution = {
  name: string
  url: string
  commits: number
}

export type GitHubContributionsSource = "live" | "stale" | "snapshot"

export type GitHubContributions = {
  source: GitHubContributionsSource
  retrievedAt: string | null
  profileUrl: string
  totalContributions: number
  weeks: ContributionWeek[]
  stats: GitHubContributionStats | null
  topRepositories: GitHubRepositoryContribution[]
}

export const TOP_REPOSITORY_LIMIT = 5

/** Bundled calendar used when the live GitHub API is unconfigured or down. */
export function snapshotContributions(): GitHubContributions {
  return {
    source: "snapshot",
    retrievedAt: null,
    profileUrl: profileCatalog.socialUrl("github"),
    totalContributions: contributionCatalog.totalContributions,
    weeks: contributionCatalog.weeks,
    stats: null,
    topRepositories: [],
  }
}
