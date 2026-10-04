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
