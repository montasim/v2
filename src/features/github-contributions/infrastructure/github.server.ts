import { z } from "zod"

import { snapshotContributions } from "@/features/github-contributions/domain/contributions"
import type { GitHubContributions } from "@/features/github-contributions/domain/contributions"

const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql"
const CACHE_TTL_MS = 60 * 60 * 1000
const FAILURE_BACKOFF_MS = 5 * 60 * 1000
const REQUEST_TIMEOUT_MS = 4_000

// The viewer is the token owner, so the calendar total includes private
// contributions (counts only; no repository details are requested).
const QUERY = `query PortfolioContributions {
  viewer {
    url
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { contributionCount date } }
      }
    }
  }
}`

const count = z.number().int().nonnegative()

const responseSchema = z.object({
  data: z.object({
    viewer: z.object({
      url: z.url(),
      contributionsCollection: z.object({
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
      }),
    }),
  }),
})

type Viewer = z.infer<typeof responseSchema>["data"]["viewer"]

function toContributions(
  viewer: Viewer,
  retrievedAt: string
): GitHubContributions {
  const calendar = viewer.contributionsCollection.contributionCalendar
  return {
    source: "live",
    retrievedAt,
    profileUrl: viewer.url,
    totalContributions: calendar.totalContributions,
    weeks: calendar.weeks,
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
