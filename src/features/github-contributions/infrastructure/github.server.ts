import { z } from "zod"

import { snapshotContributions } from "@/features/github-contributions/domain/contributions"
import type { GitHubContributions } from "@/features/github-contributions/domain/contributions"

const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql"
const CACHE_TTL_MS = 60 * 60 * 1000
const FAILURE_BACKOFF_MS = 5 * 60 * 1000
const REQUEST_TIMEOUT_MS = 4_000

// The viewer is the token owner, so the calendar total includes private
// contributions (counts only; no repository details are requested).
const QUERY = `query PortfolioContributions($from: DateTime, $to: DateTime) {
  viewer {
    url
    contributionsCollection(from: $from, to: $to) {
      contributionYears
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
        contributionYears: z.array(z.number().int()),
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
  retrievedAt: string,
  year: number | null
): GitHubContributions {
  const calendar = viewer.contributionsCollection.contributionCalendar
  return {
    year,
    availableYears: viewer.contributionsCollection.contributionYears,
    source: "live",
    retrievedAt,
    profileUrl: viewer.url,
    totalContributions: calendar.totalContributions,
    weeks: calendar.weeks,
  }
}

const caches = new Map<
  number | null,
  { value: GitHubContributions; expiresAt: number }
>()
const failures = new Map<number | null, number>()

async function requestContributions(
  token: string,
  retrievedAt: string,
  year: number | null
) {
  const response = await fetch(GITHUB_GRAPHQL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "montasim-portfolio",
    },
    body: JSON.stringify({
      query: QUERY,
      variables:
        year === null
          ? {}
          : {
              from: `${year}-01-01T00:00:00Z`,
              to:
                year === new Date(retrievedAt).getUTCFullYear()
                  ? retrievedAt
                  : `${year}-12-31T23:59:59Z`,
            },
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  if (!response.ok) {
    throw new Error(`GitHub GraphQL request failed with ${response.status}`)
  }
  const { data } = responseSchema.parse(await response.json())
  return toContributions(data.viewer, retrievedAt, year)
}

/** Cache each period independently; never substitute rolling data for a year. */
export async function loadGitHubContributions(
  year: number | null = null
): Promise<GitHubContributions> {
  if (
    year !== null &&
    (!Number.isInteger(year) ||
      year < 2008 ||
      year > new Date().getUTCFullYear())
  ) {
    throw new Error("Invalid contribution year")
  }
  const cache = caches.get(year)
  const fallback = (): GitHubContributions => {
    if (cache) return { ...cache.value, source: "stale" }
    if (year === null) return snapshotContributions()
    throw new Error("Contributions for this year are temporarily unavailable")
  }
  const token = process.env.GITHUB_CONTRIBUTIONS_TOKEN?.trim()
  if (!token) return fallback()

  const now = Date.now()
  if (cache && cache.expiresAt > now) return cache.value
  if (now < (failures.get(year) ?? 0)) return fallback()

  try {
    const value = await requestContributions(
      token,
      new Date(now).toISOString(),
      year
    )
    caches.set(year, { value, expiresAt: now + CACHE_TTL_MS })
    return value
  } catch {
    failures.set(year, now + FAILURE_BACKOFF_MS)
    return fallback()
  }
}
