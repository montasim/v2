import { createServerFn } from "@tanstack/react-start"

import { buildProjectStatusSnapshot } from "@/features/project-status/domain/status"
import { loadUptimeRobotMonitors } from "@/features/project-status/infrastructure/uptimerobot.server"
import { projectCatalog } from "@/lib/content/projects"

export const getProjectStatus = createServerFn({ method: "GET" }).handler(
  async () => {
    const result = await loadUptimeRobotMonitors()

    return buildProjectStatusSnapshot({
      source: result.source,
      checkedAt: result.retrievedAt,
      providerMonitors: result.monitors,
      projects: projectCatalog.records,
    })
  }
)
