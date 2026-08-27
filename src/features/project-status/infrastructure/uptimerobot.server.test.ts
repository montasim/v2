import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

describe("UptimeRobot monitor loading", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv("UPTIMEROBOT_READ_ONLY_API_KEY", "test-read-only-key")
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it("accepts a single-page response that omits nextLink", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [
            {
              id: 42,
              friendlyName: "Example project",
              status: "PAUSED",
              url: "https://example.com",
              interval: 300,
            },
          ],
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        }
      )
    )
    vi.stubGlobal("fetch", fetchMock)

    const { loadUptimeRobotMonitors } =
      await import("@/features/project-status/infrastructure/uptimerobot.server")
    const result = await loadUptimeRobotMonitors()

    expect(result).toMatchObject({
      source: "live",
      monitors: [
        {
          id: 42,
          friendlyName: "Example project",
          status: "PAUSED",
          url: "https://example.com",
          intervalSeconds: 300,
        },
      ],
    })
    expect(fetchMock).toHaveBeenCalledOnce()
  })
})
