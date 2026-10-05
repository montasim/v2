import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const week = {
  contributionDays: [
    { contributionCount: 3, date: "2026-10-04" },
    { contributionCount: 0, date: "2026-10-05" },
  ],
}

function graphqlResponse() {
  return new Response(
    JSON.stringify({
      data: {
        viewer: {
          url: "https://github.com/montasim",
          contributionsCollection: {
            contributionYears: [2026, 2025, 2024],
            contributionCalendar: { totalContributions: 2770, weeks: [week] },
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
    expect(result.weeks.length).toBeGreaterThan(0)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("maps the live calendar", async () => {
    const fetchMock = vi.fn().mockResolvedValue(graphqlResponse())
    vi.stubGlobal("fetch", fetchMock)

    const result = await (await loader())()

    expect(result).toMatchObject({
      source: "live",
      retrievedAt: "2026-10-04T12:00:00.000Z",
      profileUrl: "https://github.com/montasim",
      totalContributions: 2770,
      weeks: [week],
    })
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
  it("requests exact year boundaries and caches each period separately", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => graphqlResponse())
    vi.stubGlobal("fetch", fetchMock)
    const load = await loader()
    await load()
    const historical = await load(2024)
    await load(2024)
    await load(2025)
    expect(historical.year).toBe(2024)
    expect(historical.availableYears).toEqual([2026, 2025, 2024])
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).variables).toEqual({
      from: "2024-01-01T00:00:00Z",
      to: "2024-12-31T23:59:59Z",
    })
  })

  it("caps the current calendar year at now", async () => {
    const fetchMock = vi.fn().mockResolvedValue(graphqlResponse())
    vi.stubGlobal("fetch", fetchMock)
    await (
      await loader()
    )(2026)
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).variables.to).toBe(
      "2026-10-04T12:00:00.000Z"
    )
  })

  it("never substitutes the rolling snapshot for an unavailable historical year", async () => {
    vi.stubEnv("GITHUB_CONTRIBUTIONS_TOKEN", "")
    await expect((await loader())(2025)).rejects.toThrow(
      "temporarily unavailable"
    )
  })

  it("rejects invalid years before contacting GitHub", async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)
    const load = await loader()
    for (const year of [2007, 2027, 2025.5, NaN]) {
      await expect(load(year)).rejects.toThrow("Invalid contribution year")
    }
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
