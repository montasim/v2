import { contributionCatalog } from "@/lib/content/contributions"
import { profileCatalog } from "@/lib/content/profile"

export type ContributionDay = { date: string; contributionCount: number }
export type ContributionWeek = { contributionDays: ContributionDay[] }

export type GitHubContributionsSource = "live" | "stale" | "snapshot"

export type GitHubContributions = {
  source: GitHubContributionsSource
  retrievedAt: string | null
  profileUrl: string
  totalContributions: number
  weeks: ContributionWeek[]
}

/** Bundled calendar used when the live GitHub API is unconfigured or down. */
export function snapshotContributions(): GitHubContributions {
  return {
    source: "snapshot",
    retrievedAt: null,
    profileUrl: profileCatalog.socialUrl("github"),
    totalContributions: contributionCatalog.totalContributions,
    weeks: contributionCatalog.weeks,
  }
}
