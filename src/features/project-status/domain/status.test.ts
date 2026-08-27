import { describe, expect, it } from "vitest"

import {
  buildProjectStatusSnapshot,
  mapProviderStatus,
} from "@/features/project-status/domain/status"

describe("project status", () => {
  it("maps every documented UptimeRobot monitor state", () => {
    expect(mapProviderStatus("UP")).toBe("operational")
    expect(mapProviderStatus("LOOKS_DOWN")).toBe("degraded")
    expect(mapProviderStatus("DOWN")).toBe("down")
    expect(mapProviderStatus("PAUSED")).toBe("paused")
    expect(mapProviderStatus("STARTED")).toBe("unknown")
  })

  it("matches monitors to portfolio projects and puts outages first", () => {
    const snapshot = buildProjectStatusSnapshot({
      source: "live",
      checkedAt: "2026-08-26T08:00:00.000Z",
      projects: [
        {
          id: "project-example",
          title: "Example project",
          type: "website",
          liveUrl: "https://example.com",
        },
      ],
      providerMonitors: [
        {
          id: 1,
          friendlyName: "Example monitor",
          status: "UP",
          url: "https://example.com/health",
          intervalSeconds: 300,
        },
        {
          id: 2,
          friendlyName: "Another service",
          status: "DOWN",
          url: "https://service.example.net",
        },
      ],
    })

    expect(snapshot.overall).toBe("down")
    expect(snapshot.summary).toMatchObject({
      total: 2,
      operational: 1,
      down: 1,
    })
    expect(snapshot.monitors[0]).toMatchObject({
      name: "Another service",
      status: "down",
    })
    expect(snapshot.monitors[1]).toMatchObject({
      projectId: "project-example",
      name: "Example project",
      kind: "Web application",
      status: "operational",
      url: "https://example.com",
    })
  })

  it("returns a useful unknown state before monitoring is configured", () => {
    const snapshot = buildProjectStatusSnapshot({
      source: "unconfigured",
      checkedAt: null,
      projects: [],
      providerMonitors: [],
    })

    expect(snapshot.overall).toBe("unknown")
    expect(snapshot.summary.total).toBe(0)
  })
})
