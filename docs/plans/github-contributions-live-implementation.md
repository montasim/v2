# Live GitHub Contributions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show live GitHub contribution data on the homepage Contributions section (calendar, last-12-month totals including private work and code reviews, all-time totals, and most active public repositories) without any manual sync.

**Architecture:** A server-only loader calls the GitHub GraphQL API with the owner's personal access token, validates the response with Zod, and caches the result in module memory for one hour (with a five-minute back-off after failures). A `createServerFn` exposes it to the homepage route loader, so the numbers are in the server-rendered HTML. When the token is missing or GitHub fails, the loader returns the last good result (`stale`) or the bundled `src/data/contributions.json` snapshot, so the homepage never breaks. This mirrors `src/features/project-status` (UptimeRobot).

**Tech Stack:** TanStack Start (`createServerFn`, route `loader`), Zod 4, GitHub GraphQL API v4, React 19, Tailwind CSS v4, Vitest + Testing Library.

## Global Constraints

- No new dependencies. Use global `fetch`, `zod`, and existing UI components only.
- The token is read only on the server from `process.env.GITHUB_CONTRIBUTIONS_TOKEN`. It must never be imported into client code, logged, or returned to the browser.
- Token: a GitHub personal access token owned by `montasim` with read-only `read:user` access. Private contribution counts and the full calendar total are returned only because the token belongs to the profile owner.
- Never expose private repository names. Private work is shown only as the aggregate `restrictedContributionsCount`; `topRepositories` must exclude entries where `repository.isPrivate` is `true`.
- Cache TTL is exactly 1 hour (`60 * 60 * 1000` ms); failure back-off is exactly 5 minutes (`5 * 60 * 1000` ms); request timeout is 4 seconds.
- The homepage must render even if GitHub is unreachable or the token is missing (fall back to the snapshot).
- Keep `src/data/contributions.json` and `src/lib/content/contributions.ts` unchanged. They are the fallback and are also used by the chat knowledge base (`src/features/chat/knowledge/*`), which stays static and is out of scope.
- Code style: `pnpm typecheck`, `pnpm lint`, and Prettier (`pnpm prettier --check <files>`) must pass. Follow the feature layout `domain/`, `infrastructure/*.server.ts`, `application/` used by `src/features/project-status`.

## File Structure

| File                                                                              | Responsibility                                                                     |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `src/features/github-contributions/domain/contributions.ts` (create)              | Public types and `snapshotContributions()` fallback built from the bundled catalog |
| `src/features/github-contributions/infrastructure/github.server.ts` (create)      | GraphQL query, Zod validation, mapping, cache, back-off, fallback                  |
| `src/features/github-contributions/infrastructure/github.server.test.ts` (create) | Loader tests with mocked `fetch`                                                   |
| `src/features/github-contributions/application/github-contributions.ts` (create)  | `getGitHubContributions` server function                                           |
| `src/routes/index.tsx` (modify, loader at line ~36 and `OverviewPage` at ~40-155) | Load availability and contributions together; pass contributions to the calendar   |
| `src/components/portfolio/contribution-calendar.tsx` (modify)                     | Render from a `data` prop; add stats, all-time line and most active repositories   |
| `src/components/portfolio/contribution-calendar.test.tsx` (create)                | Component tests for live and snapshot data                                         |
| `.env.example` (modify)                                                           | Document `GITHUB_CONTRIBUTIONS_TOKEN`                                              |

---

### Task 1: Live GitHub contributions loader

**Files:**

- Create: `src/features/github-contributions/domain/contributions.ts`
- Create: `src/features/github-contributions/infrastructure/github.server.ts`
- Test: `src/features/github-contributions/infrastructure/github.server.test.ts`

**Interfaces:**

- Consumes: `contributionCatalog` from `@/lib/content/contributions` (`{ totalContributions: number; weeks: { contributionDays: { contributionCount: number; date: string }[] }[] }`); `profileCatalog.socialUrl("github")` from `@/lib/content/profile`.
- Produces:
  - Types `ContributionDay`, `ContributionWeek`, `GitHubContributionStats`, `GitHubRepositoryContribution`, `GitHubContributionsSource`, `GitHubContributions` (exact shapes in Step 3).
  - `export const TOP_REPOSITORY_LIMIT = 5`
  - `export function snapshotContributions(): GitHubContributions`
  - `export async function loadGitHubContributions(): Promise<GitHubContributions>` (never throws)

- [ ] **Step 1: Write the failing tests**

Create `src/features/github-contributions/infrastructure/github.server.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const week = {
  contributionDays: [
    { contributionCount: 3, date: "2026-10-04" },
    { contributionCount: 0, date: "2026-10-05" },
  ],
}

function repository(name: string, commits: number, isPrivate = false) {
  return {
    repository: {
      nameWithOwner: `montasim/${name}`,
      url: `https://github.com/montasim/${name}`,
      isPrivate,
    },
    contributions: { totalCount: commits },
  }
}

function graphqlResponse() {
  return new Response(
    JSON.stringify({
      data: {
        viewer: {
          url: "https://github.com/montasim",
          followers: { totalCount: 111 },
          repositories: { totalCount: 92 },
          pullRequests: { totalCount: 535 },
          mergedPullRequests: { totalCount: 471 },
          issues: { totalCount: 183 },
          contributionsCollection: {
            totalCommitContributions: 1832,
            totalPullRequestContributions: 186,
            totalPullRequestReviewContributions: 4,
            totalIssueContributions: 7,
            totalRepositoryContributions: 43,
            restrictedContributionsCount: 702,
            contributionCalendar: { totalContributions: 2770, weeks: [week] },
            commitContributionsByRepository: [
              repository("PostCraft", 406),
              repository("client-secret-app", 300, true),
              repository("devtools", 275),
              repository("v2", 236),
              repository("v1", 123),
              repository("Routempo", 86),
              repository("BugReceipt", 40),
            ],
          },
        },
      },
    }),
    { status: 200, headers: { "content-type": "application/json" } }
  )
}

async function loader() {
  const module =
    await import("@/features/github-contributions/infrastructure/github.server")
  return module.loadGitHubContributions
}

describe("GitHub contributions loader", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(new Date("2026-10-04T12:00:00Z"))
    vi.stubEnv("GITHUB_CONTRIBUTIONS_TOKEN", "test-read-user-token")
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it("falls back to the bundled snapshot without a token", async () => {
    vi.stubEnv("GITHUB_CONTRIBUTIONS_TOKEN", "")
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)

    const result = await (await loader())()

    expect(result.source).toBe("snapshot")
    expect(result.stats).toBeNull()
    expect(result.weeks.length).toBeGreaterThan(0)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("maps live totals and hides private repository names", async () => {
    const fetchMock = vi.fn().mockResolvedValue(graphqlResponse())
    vi.stubGlobal("fetch", fetchMock)

    const result = await (await loader())()

    expect(result).toMatchObject({
      source: "live",
      retrievedAt: "2026-10-04T12:00:00.000Z",
      profileUrl: "https://github.com/montasim",
      totalContributions: 2770,
      weeks: [week],
      stats: {
        commits: 1832,
        pullRequests: 186,
        codeReviews: 4,
        issues: 7,
        repositoriesCreated: 43,
        privateContributions: 702,
        allTimePullRequests: 535,
        allTimeMergedPullRequests: 471,
        allTimeIssues: 183,
        publicRepositories: 92,
        followers: 111,
      },
    })
    expect(result.topRepositories.map((repo) => repo.name)).toEqual([
      "montasim/PostCraft",
      "montasim/devtools",
      "montasim/v2",
      "montasim/v1",
      "montasim/Routempo",
    ])
    const [, init] = fetchMock.mock.calls[0]
    expect(init.headers.Authorization).toBe("Bearer test-read-user-token")
  })

  it("serves the cached result for one hour", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => graphqlResponse())
    vi.stubGlobal("fetch", fetchMock)
    const load = await loader()

    await load()
    vi.setSystemTime(new Date("2026-10-04T12:59:00Z"))
    await load()
    expect(fetchMock).toHaveBeenCalledOnce()

    vi.setSystemTime(new Date("2026-10-04T13:01:00Z"))
    await load()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it("returns the last good data as stale when GitHub fails", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(graphqlResponse())
      .mockResolvedValueOnce(new Response("Bad gateway", { status: 502 }))
    vi.stubGlobal("fetch", fetchMock)
    const load = await loader()

    await load()
    vi.setSystemTime(new Date("2026-10-04T13:01:00Z"))
    const result = await load()

    expect(result.source).toBe("stale")
    expect(result.totalContributions).toBe(2770)
  })

  it("backs off for five minutes after a failure without cache", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(async () => new Response("", { status: 500 }))
    vi.stubGlobal("fetch", fetchMock)
    const load = await loader()

    expect((await load()).source).toBe("snapshot")
    vi.setSystemTime(new Date("2026-10-04T12:04:00Z"))
    expect((await load()).source).toBe("snapshot")
    expect(fetchMock).toHaveBeenCalledOnce()

    vi.setSystemTime(new Date("2026-10-04T12:06:00Z"))
    await load()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it("treats a GraphQL error payload as a failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          data: null,
          errors: [{ message: "Bad credentials" }],
        })
      )
    )

    expect((await (await loader())()).source).toBe("snapshot")
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm vitest run src/features/github-contributions/infrastructure/github.server.test.ts`
Expected: FAIL with `Failed to load url @/features/github-contributions/infrastructure/github.server` (or "Does the file exist?").

- [ ] **Step 3: Write the domain types and snapshot fallback**

Create `src/features/github-contributions/domain/contributions.ts`:

```ts
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
```

- [ ] **Step 4: Write the loader**

Create `src/features/github-contributions/infrastructure/github.server.ts`:

```ts
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
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm vitest run src/features/github-contributions/infrastructure/github.server.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 6: Type-check, lint and format**

Run: `pnpm typecheck && pnpm lint && pnpm prettier --check src/features/github-contributions`
Expected: no errors; "All matched files use Prettier code style!".

- [ ] **Step 7: Commit**

```bash
git add src/features/github-contributions
git commit -m "Load live GitHub contributions with caching and fallback"
```

---

### Task 2: Serve live contributions to the homepage

**Files:**

- Create: `src/features/github-contributions/application/github-contributions.ts`
- Modify: `src/routes/index.tsx` (imports, `loader` at ~line 36, `OverviewPage` ~line 42, Contributions section ~line 200)
- Modify: `src/components/portfolio/contribution-calendar.tsx` (read from a `data` prop instead of the static import)
- Test: `src/components/portfolio/contribution-calendar.test.tsx`

**Interfaces:**

- Consumes: `loadGitHubContributions()` and `GitHubContributions` from Task 1.
- Produces:
  - `export const getGitHubContributions` (TanStack `createServerFn` GET handler returning `Promise<GitHubContributions>`)
  - `export function ContributionCalendar({ data }: { data: GitHubContributions })`

- [ ] **Step 1: Write the failing component test**

Create `src/components/portfolio/contribution-calendar.test.tsx`:

```tsx
// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { ContributionCalendar } from "@/components/portfolio/contribution-calendar"
import type { GitHubContributions } from "@/features/github-contributions/domain/contributions"

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}))

const weeks = [
  {
    contributionDays: [
      { contributionCount: 3, date: "2026-09-27" },
      { contributionCount: 0, date: "2026-09-28" },
    ],
  },
  {
    contributionDays: [{ contributionCount: 12, date: "2026-10-04" }],
  },
]

const liveData: GitHubContributions = {
  source: "live",
  retrievedAt: "2026-10-04T12:00:00.000Z",
  profileUrl: "https://github.com/montasim",
  totalContributions: 2770,
  weeks,
  stats: {
    commits: 1832,
    pullRequests: 186,
    codeReviews: 0,
    issues: 7,
    repositoriesCreated: 43,
    privateContributions: 702,
    allTimePullRequests: 535,
    allTimeMergedPullRequests: 471,
    allTimeIssues: 183,
    publicRepositories: 92,
    followers: 111,
  },
  topRepositories: [
    {
      name: "montasim/PostCraft",
      url: "https://github.com/montasim/PostCraft",
      commits: 406,
    },
  ],
}

afterEach(cleanup)

describe("ContributionCalendar", () => {
  it("renders the calendar total from the provided data", () => {
    render(<ContributionCalendar data={liveData} />)

    expect(
      screen.getByRole("img", {
        name: "2,770 GitHub contributions in the last year",
      })
    ).toBeTruthy()
    expect(
      screen
        .getByRole("link", { name: /2,770 GitHub contributions/ })
        .getAttribute("href")
    ).toBe("https://github.com/montasim")
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run src/components/portfolio/contribution-calendar.test.tsx`
Expected: FAIL. TypeScript-only prop errors do not fail Vitest, so the failure is the rendered total: the component still reads the bundled snapshot and shows `1,824` instead of `2,770`.

- [ ] **Step 3: Add the server function**

Create `src/features/github-contributions/application/github-contributions.ts`:

```ts
import { createServerFn } from "@tanstack/react-start"

import { loadGitHubContributions } from "@/features/github-contributions/infrastructure/github.server"

export const getGitHubContributions = createServerFn({ method: "GET" }).handler(
  () => loadGitHubContributions()
)
```

- [ ] **Step 4: Make the calendar render from a `data` prop**

In `src/components/portfolio/contribution-calendar.tsx`:

1. Replace the two content imports at the top:

```tsx
import { contributionCatalog as contributions } from "@/lib/content/contributions"
import { profileCatalog } from "@/lib/content/profile"
```

with:

```tsx
import type {
  ContributionWeek,
  GitHubContributions,
} from "@/features/github-contributions/domain/contributions"
```

2. Replace the module-level `const monthLabels = contributions.weeks.reduce<…>(…, [])` block with a function:

```tsx
function monthLabels(weeks: readonly ContributionWeek[]) {
  return weeks.reduce<{ month: number; start: number; span: number }[]>(
    (labels, week, index) => {
      const firstDay = week.contributionDays[0]
      const month = utcDate(firstDay.date).getUTCMonth()
      const current = labels.at(-1)

      if (current?.month === month) {
        current.span += 1
      } else {
        labels.push({ month, start: index, span: 1 })
      }

      return labels
    },
    []
  )
}
```

3. Change the component signature and its first lines:

```tsx
export function ContributionCalendar({ data }: { data: GitHubContributions }) {
  const total = data.totalContributions.toLocaleString("en")
```

4. Inside the component, replace every `contributions.weeks` with `data.weeks`, replace `monthLabels.map(` with `monthLabels(data.weeks).map(`, and replace `href={profileCatalog.socialUrl("github")}` with `href={data.profileUrl}`. Use `toLocaleString("en")` (not the bare call) so server and client render the same separators.

- [ ] **Step 5: Load contributions in the homepage route**

In `src/routes/index.tsx`:

1. Add the import next to the availability import:

```tsx
import { getGitHubContributions } from "@/features/github-contributions/application/github-contributions"
```

2. Replace `loader: () => getPublicAvailabilitySettings(),` with:

```tsx
  loader: async () => {
    const [availabilitySettings, contributions] = await Promise.all([
      getPublicAvailabilitySettings(),
      getGitHubContributions(),
    ])
    return { availabilitySettings, contributions }
  },
```

3. In `OverviewPage`, replace `const availabilitySettings = Route.useLoaderData()` with:

```tsx
const { availabilitySettings, contributions } = Route.useLoaderData()
```

4. Replace `<ContributionCalendar />` with `<ContributionCalendar data={contributions} />`.

- [ ] **Step 6: Run tests, type-check, lint and format**

Run: `pnpm vitest run src/components/portfolio/contribution-calendar.test.tsx src/features/github-contributions && pnpm typecheck && pnpm lint && pnpm prettier --check src/components/portfolio/contribution-calendar.tsx src/components/portfolio/contribution-calendar.test.tsx src/routes/index.tsx src/features/github-contributions`
Expected: all tests pass (1 + 6); no type, lint or format errors.

- [ ] **Step 7: Commit**

```bash
git add src/features/github-contributions/application src/components/portfolio/contribution-calendar.tsx src/components/portfolio/contribution-calendar.test.tsx src/routes/index.tsx
git commit -m "Serve live GitHub contributions to the homepage calendar"
```

---

### Task 3: Show contribution stats and most active repositories

**Files:**

- Modify: `src/components/portfolio/contribution-calendar.tsx`
- Test: `src/components/portfolio/contribution-calendar.test.tsx`

**Interfaces:**

- Consumes: `GitHubContributions`, `GitHubContributionStats` from Task 1; `ContributionCalendar({ data })` from Task 2.
- Produces: no new exports.

- [ ] **Step 1: Add the failing tests**

Append inside the `describe("ContributionCalendar", …)` block of `src/components/portfolio/contribution-calendar.test.tsx`:

```tsx
it("shows last-year stats including private work and code reviews", () => {
  render(<ContributionCalendar data={liveData} />)

  const stats = screen.getByRole("list", { name: "Last 12 months" })
  for (const text of [
    "1,832",
    "Commits",
    "186",
    "Pull requests",
    "0",
    "Code reviews",
    "7",
    "Issues",
    "43",
    "New repositories",
    "702",
    "Private contributions",
  ]) {
    expect(stats.textContent).toContain(text)
  }
})

it("shows all-time totals and public top repositories", () => {
  render(<ContributionCalendar data={liveData} />)

  expect(
    screen.getByText(
      "All time: 535 pull requests (471 merged) · 183 issues · 92 public repositories · 111 followers"
    )
  ).toBeTruthy()
  expect(
    screen
      .getByRole("link", { name: "montasim/PostCraft, 406 commits" })
      .getAttribute("href")
  ).toBe("https://github.com/montasim/PostCraft")
})

it("hides stats when only the bundled snapshot is available", () => {
  render(
    <ContributionCalendar
      data={{
        ...liveData,
        source: "snapshot",
        stats: null,
        topRepositories: [],
      }}
    />
  )

  expect(screen.queryByRole("list", { name: "Last 12 months" })).toBeNull()
  expect(screen.queryByText(/All time:/)).toBeNull()
  expect(screen.queryByText("Most active in")).toBeNull()
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm vitest run src/components/portfolio/contribution-calendar.test.tsx`
Expected: FAIL. The two new live-data tests cannot find the "Last 12 months" list and the "All time" text; the snapshot test passes.

- [ ] **Step 3: Implement the stats, all-time line and top repositories**

Replace the whole of `src/components/portfolio/contribution-calendar.tsx` with:

```tsx
import { ExternalLink } from "@/components/shared/navigation-action"
import type {
  ContributionWeek,
  GitHubContributionStats,
  GitHubContributions,
} from "@/features/github-contributions/domain/contributions"

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const

const levelClasses = [
  "bg-border dark:bg-white/10",
  "bg-[#6ee7b7] dark:bg-[#064e3b]",
  "bg-[#10b981] dark:bg-[#047857]",
  "bg-[#047857] dark:bg-[#10b981]",
  "bg-[#064e3b] dark:bg-[#6ee7b7]",
] as const

function contributionLevel(count: number) {
  if (count === 0) return 0
  if (count <= 2) return 1
  if (count <= 5) return 2
  if (count <= 8) return 3
  return 4
}

function utcDate(date: string) {
  return new Date(`${date}T00:00:00Z`)
}

const formatCount = (value: number) => value.toLocaleString("en")

function monthLabels(weeks: readonly ContributionWeek[]) {
  return weeks.reduce<{ month: number; start: number; span: number }[]>(
    (labels, week, index) => {
      const firstDay = week.contributionDays[0]
      const month = utcDate(firstDay.date).getUTCMonth()
      const current = labels.at(-1)

      if (current?.month === month) {
        current.span += 1
      } else {
        labels.push({ month, start: index, span: 1 })
      }

      return labels
    },
    []
  )
}

function lastYearStats(stats: GitHubContributionStats) {
  return [
    ["Commits", stats.commits],
    ["Pull requests", stats.pullRequests],
    ["Code reviews", stats.codeReviews],
    ["Issues", stats.issues],
    ["New repositories", stats.repositoriesCreated],
    ["Private contributions", stats.privateContributions],
  ] as const
}

function allTimeSummary(stats: GitHubContributionStats) {
  return [
    `${formatCount(stats.allTimePullRequests)} pull requests (${formatCount(stats.allTimeMergedPullRequests)} merged)`,
    `${formatCount(stats.allTimeIssues)} issues`,
    `${formatCount(stats.publicRepositories)} public repositories`,
    `${formatCount(stats.followers)} followers`,
  ].join(" · ")
}

function ContributionCell({ count }: { count: number }) {
  return (
    <span
      className={`size-2.5 rounded-[2px] ${levelClasses[contributionLevel(count)]}`}
      aria-hidden="true"
    />
  )
}

export function ContributionCalendar({ data }: { data: GitHubContributions }) {
  const total = formatCount(data.totalContributions)

  return (
    <div className="space-y-5">
      {data.stats ? (
        <ul
          aria-label="Last 12 months"
          className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-3 lg:grid-cols-6"
        >
          {lastYearStats(data.stats).map(([label, value]) => (
            <li key={label} className="bg-background px-4 py-3">
              <span className="block text-lg font-semibold text-strong-foreground tabular-nums">
                {formatCount(value)}
              </span>
              <span className="block text-xs text-muted-foreground">
                {label}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <div>
        <div className="overflow-x-auto pb-2">
          <div className="inline-block min-w-fit">
            <div
              className="mb-1 grid gap-[3px] text-[10px] text-muted-foreground"
              style={{
                gridTemplateColumns: `repeat(${data.weeks.length}, 10px)`,
              }}
              aria-hidden="true"
            >
              {monthLabels(data.weeks).map(({ month, start, span }) => (
                <span
                  key={`${month}-${start}`}
                  style={{ gridColumn: `${start + 1} / span ${span}` }}
                >
                  {span >= 2 ? monthNames[month] : ""}
                </span>
              ))}
            </div>
            <div
              className="grid auto-cols-[10px] grid-flow-col gap-[3px]"
              role="img"
              aria-label={`${total} GitHub contributions in the last year`}
            >
              {data.weeks.map((week) => (
                <div
                  key={week.contributionDays[0].date}
                  className="grid grid-rows-7 gap-[3px]"
                >
                  {week.contributionDays.map((day) => (
                    <span
                      key={day.date}
                      className={`size-2.5 rounded-[2px] ${levelClasses[contributionLevel(day.contributionCount)]}`}
                      style={{
                        gridRowStart: utcDate(day.date).getUTCDay() + 1,
                      }}
                      title={`${day.date}: ${day.contributionCount} contribution${day.contributionCount === 1 ? "" : "s"}`}
                      aria-hidden="true"
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <ExternalLink
            href={data.profileUrl}
            className="rounded-sm transition-[color,opacity] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:text-foreground hover:underline hover:opacity-80 motion-reduce:transition-none"
          >
            {total} GitHub contributions in the last year
          </ExternalLink>
          <div
            className="flex items-center gap-1"
            aria-label="Contribution activity intensity"
          >
            <span>Less</span>
            {[0, 1, 3, 6, 9].map((count) => (
              <ContributionCell key={count} count={count} />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>

      {data.stats ? (
        <p className="text-xs text-muted-foreground">
          {`All time: ${allTimeSummary(data.stats)}`}
        </p>
      ) : null}

      {data.topRepositories.length ? (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground">Most active in</span>
          {data.topRepositories.map((repository) => (
            <ExternalLink
              key={repository.name}
              href={repository.url}
              aria-label={`${repository.name}, ${repository.commits} commits`}
              className="rounded-md border px-2 py-1 transition-colors hover:bg-muted hover:text-foreground motion-reduce:transition-none"
            >
              {repository.name.replace(/^montasim\//, "")}{" "}
              <span className="text-muted-foreground tabular-nums">
                {formatCount(repository.commits)}
              </span>
            </ExternalLink>
          ))}
        </div>
      ) : null}
    </div>
  )
}
```

The calendar markup in the middle `<div>` is the Task 2 version unchanged; only the stats list above it and the two blocks below it are new. The `All time:` paragraph renders a single template string so the test can match it as one text node.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm vitest run src/components/portfolio/contribution-calendar.test.tsx`
Expected: PASS, 4 tests.

- [ ] **Step 5: Type-check, lint and format**

Run: `pnpm typecheck && pnpm lint && pnpm prettier --check src/components/portfolio/contribution-calendar.tsx src/components/portfolio/contribution-calendar.test.tsx`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/portfolio/contribution-calendar.tsx src/components/portfolio/contribution-calendar.test.tsx
git commit -m "Show GitHub contribution stats and most active repositories"
```

---

### Task 4: Configure the token and verify end to end

**Files:**

- Modify: `.env.example`

**Interfaces:**

- Consumes: everything above.
- Produces: none.

- [ ] **Step 1: Document the environment variable**

Append to `.env.example`:

```bash

# GitHub personal access token (owner: montasim, read-only read:user) used on
# the server to show live contribution data on the homepage. Without it the
# homepage falls back to src/data/contributions.json.
GITHUB_CONTRIBUTIONS_TOKEN=
```

- [ ] **Step 2: Create the token (owner action)**

The repository owner creates the token; an agent must not create, view or paste it.

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token (classic).
2. Note: `portfolio contributions (read-only)`. Expiration: owner's choice (no expiry avoids rotation; otherwise add a calendar reminder).
3. Scope: tick only `read:user`. Generate and copy it.
4. Local: add `GITHUB_CONTRIBUTIONS_TOKEN=<token>` to `.env.local` (git-ignored).
5. Production: Netlify → Site configuration → Environment variables → add `GITHUB_CONTRIBUTIONS_TOKEN`, scoped to Functions/Runtime, then redeploy.

- [ ] **Step 3: Verify locally in the browser**

Restart the dev server (`pnpm dev`) so it reads the new variable, open `http://localhost:3000/#contributions`, and check:

1. The total matches GitHub (about 2,770 at the time of writing, not the old 1,824), and the calendar ends in the current week.
2. The "Last 12 months" row shows six tiles, including Code reviews and Private contributions.
3. The "All time" line shows pull requests (merged), issues, public repositories and followers.
4. "Most active in" lists up to five public repositories with commit counts; no private repository names appear.
5. View the page source (Ctrl+U): the live total is in the server HTML, so nothing flickers after load.
6. Remove the variable, restart, and reload: the section still renders using the 1,824 snapshot with no stats rows and no errors.

- [ ] **Step 4: Run the full verification**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: type and lint clean; the new tests pass. Ten tests in eight files are known pre-existing failures unrelated to this work (command-palette, portfolio-keyboard-shortcuts, portfolio-chat, evaluation-corpus, contact, contact-chat-isolation, static-answers.server, skill-evidence); no other failures.

- [ ] **Step 5: Commit**

```bash
git add .env.example
git commit -m "Document the GitHub contributions token"
```

---

## Out of scope

- Refreshing the chat assistant's knowledge base with live numbers (it keeps using the bundled snapshot).
- Contribution years before the last 12 months (GitHub limits one `contributionsCollection` query to a one-year range).
- Mapping top repositories to portfolio project pages; they link to GitHub.
- A shared cache across serverless instances (for example in Postgres). Each warm instance refreshes at most once an hour, which is well inside GitHub's 5,000 requests/hour limit.
