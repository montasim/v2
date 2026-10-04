import { z } from "zod"

import {
  TOP_REPOSITORY_LIMIT,
  snapshotContributions,
} from "@/features/github-contributions/domain/contributions"
import type { GitHubContributions } from "@/features/github-contributions/domain/contributions"

const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql"
const CACHE_TTL_MS = 60 * 60 * 1000
const FAILURE_BACKOFF_MS = 5 * 60 * 1000
const REQUEST_TIMEOUT_MS = 4_000

// The viewer is the token owner, so private counts and the full calendar
// total are included. Private repository names are filtered out below.
const QUERY = `query PortfolioContributions {
  viewer {
    url
    followers { totalCount }
    repositories(ownerAffiliations: OWNER, privacy: PUBLIC) { totalCount }
    pullRequests { totalCount }
    mergedPullRequests: pullRequests(states: MERGED) { totalCount }
    issues { totalCount }
    contributionsCollection {
      totalCommitContributions
      totalPullRequestContributions
      totalPullRequestReviewContributions
      totalIssueContributions
      totalRepositoryContributions
      restrictedContributionsCount
      contributionCalendar {
        totalContributions
        weeks { contributionDays { contributionCount date } }
      }
      commitContributionsByRepository(maxRepositories: 25) {
        repository { nameWithOwner url isPrivate }
        contributions { totalCount }
      }
    }
  }
}`

const count = z.number().int().nonnegative()
const total = z.object({ totalCount: count })

const responseSchema = z.object({
  data: z.object({
    viewer: z.object({
      url: z.url(),
      followers: total,
      repositories: total,
      pullRequests: total,
      mergedPullRequests: total,
      issues: total,
      contributionsCollection: z.object({
        totalCommitContributions: count,
        totalPullRequestContributions: count,
        totalPullRequestReviewContributions: count,
        totalIssueContributions: count,
        totalRepositoryContributions: count,
        restrictedContributionsCount: count,
        contributionCalendar: z.object({
          totalContributions: count,
          weeks: z.array(
            z.object({
              contributionDays: z.array(
                z.object({ contributionCount: count, date: z.iso.date() })
              ),
            })
          ),
        }),
        commitContributionsByRepository: z.array(
          z.object({
            repository: z.object({
              nameWithOwner: z.string().min(1),
              url: z.url(),
              isPrivate: z.boolean(),
            }),
            contributions: total,
          })
        ),
      }),
    }),
  }),
})

type Viewer = z.infer<typeof responseSchema>["data"]["viewer"]

function toContributions(
  viewer: Viewer,
  retrievedAt: string
): GitHubContributions {
  const collection = viewer.contributionsCollection
  return {
    source: "live",
    retrievedAt,
    profileUrl: viewer.url,
    totalContributions: collection.contributionCalendar.totalContributions,
    weeks: collection.contributionCalendar.weeks,
    stats: {
      commits: collection.totalCommitContributions,
      pullRequests: collection.totalPullRequestContributions,
      codeReviews: collection.totalPullRequestReviewContributions,
      issues: collection.totalIssueContributions,
      repositoriesCreated: collection.totalRepositoryContributions,
      privateContributions: collection.restrictedContributionsCount,
      allTimePullRequests: viewer.pullRequests.totalCount,
      allTimeMergedPullRequests: viewer.mergedPullRequests.totalCount,
      allTimeIssues: viewer.issues.totalCount,
      publicRepositories: viewer.repositories.totalCount,
      followers: viewer.followers.totalCount,
    },
    // Private work is only shown as the aggregate privateContributions count.
    topRepositories: collection.commitContributionsByRepository
      .filter((entry) => !entry.repository.isPrivate)
      .slice(0, TOP_REPOSITORY_LIMIT)
      .map((entry) => ({
        name: entry.repository.nameWithOwner,
        url: entry.repository.url,
        commits: entry.contributions.totalCount,
      })),
  }
}

let cache: { value: GitHubContributions; expiresAt: number } | null = null
let failedUntil = 0

async function requestContributions(token: string, retrievedAt: string) {
  const response = await fetch(GITHUB_GRAPHQL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "montasim-portfolio",
    },
    body: JSON.stringify({ query: QUERY }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  if (!response.ok) {
    throw new Error(`GitHub GraphQL request failed with ${response.status}`)
  }
  const { data } = responseSchema.parse(await response.json())
  return toContributions(data.viewer, retrievedAt)
}

/**
 * Live GitHub contributions with a one-hour in-memory cache. Never throws:
 * failures return the last good data (stale) or the bundled snapshot.
 */
export async function loadGitHubContributions(): Promise<GitHubContributions> {
  const token = process.env.GITHUB_CONTRIBUTIONS_TOKEN?.trim()
  if (!token) return snapshotContributions()

  const now = Date.now()
  if (cache && cache.expiresAt > now) return cache.value

  const fallback = () =>
    cache
      ? { ...cache.value, source: "stale" as const }
      : snapshotContributions()
  if (now < failedUntil) return fallback()

  try {
    const value = await requestContributions(token, new Date(now).toISOString())
    cache = { value, expiresAt: now + CACHE_TTL_MS }
    return value
  } catch {
    failedUntil = now + FAILURE_BACKOFF_MS
    return fallback()
  }
}
