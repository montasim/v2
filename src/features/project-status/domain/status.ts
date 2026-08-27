export const projectStatusValues = [
  "operational",
  "degraded",
  "down",
  "paused",
  "unknown",
] as const

export type ProjectStatus = (typeof projectStatusValues)[number]
export type ProjectStatusSource =
  "live" | "stale" | "unconfigured" | "unavailable"

export type ProviderMonitor = {
  id: number
  friendlyName: string
  status: string | number
  url: string
  intervalSeconds?: number
}

type CatalogProject = {
  id: string
  title: string
  type: string
  liveUrl?: string | null
}

export type ProjectStatusRecord = {
  id: string
  projectId: string | null
  name: string
  url: string
  host: string
  kind: string
  status: ProjectStatus
  intervalSeconds: number | null
}

export type ProjectStatusSummary = Record<ProjectStatus, number> & {
  total: number
}

export type ProjectStatusSnapshot = {
  source: ProjectStatusSource
  overall: ProjectStatus
  checkedAt: string | null
  monitors: ProjectStatusRecord[]
  summary: ProjectStatusSummary
}

const statusPriority: Record<ProjectStatus, number> = {
  down: 0,
  degraded: 1,
  unknown: 2,
  paused: 3,
  operational: 4,
}

const projectTypeLabels: Record<string, string> = {
  website: "Web application",
  extension: "Browser extension",
  package: "Package",
  skill: "Agent skill",
  dataset: "Dataset",
  tool: "Developer tool",
  api: "API",
  template: "Template",
}

function normalizedUrl(value: string) {
  try {
    const url = new URL(value)
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "")
    const pathname = url.pathname.replace(/\/$/, "") || "/"
    return `${hostname}${pathname}`
  } catch {
    return value.trim().toLowerCase().replace(/\/$/, "")
  }
}

function urlHost(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, "")
  } catch {
    return value.replace(/^https?:\/\//, "").split("/")[0]
  }
}

export function mapProviderStatus(value: string | number): ProjectStatus {
  const normalized = String(value).trim().toUpperCase()

  if (normalized === "UP") return "operational"
  if (normalized === "LOOKS_DOWN") return "degraded"
  if (normalized === "DOWN") return "down"
  if (normalized === "PAUSED") return "paused"
  return "unknown"
}

function overallStatus(
  source: ProjectStatusSource,
  summary: ProjectStatusSummary
): ProjectStatus {
  if (
    (source === "unconfigured" || source === "unavailable") &&
    summary.total === 0
  ) {
    return "unknown"
  }
  if (summary.down > 0) return "down"
  if (summary.degraded > 0 || summary.unknown > 0) return "degraded"
  if (summary.paused > 0) return "paused"
  if (summary.operational > 0) return "operational"
  return "unknown"
}

export function buildProjectStatusSnapshot({
  source,
  checkedAt,
  providerMonitors,
  projects,
}: {
  source: ProjectStatusSource
  checkedAt: string | null
  providerMonitors: readonly ProviderMonitor[]
  projects: readonly CatalogProject[]
}): ProjectStatusSnapshot {
  const projectsByUrl = new Map(
    projects
      .filter((project) => project.liveUrl)
      .map((project) => [normalizedUrl(project.liveUrl as string), project])
  )
  const projectsByHost = new Map(
    projects
      .filter((project) => project.liveUrl)
      .map((project) => [urlHost(project.liveUrl as string), project])
  )

  const monitors = providerMonitors
    .map((monitor): ProjectStatusRecord => {
      const project =
        projectsByUrl.get(normalizedUrl(monitor.url)) ??
        projectsByHost.get(urlHost(monitor.url))

      return {
        id: String(monitor.id),
        projectId: project?.id ?? null,
        name: project?.title ?? monitor.friendlyName,
        url: project?.liveUrl ?? monitor.url,
        host: urlHost(project?.liveUrl ?? monitor.url),
        kind: project
          ? (projectTypeLabels[project.type] ?? "Project")
          : "External monitor",
        status: mapProviderStatus(monitor.status),
        intervalSeconds: monitor.intervalSeconds ?? null,
      }
    })
    .sort(
      (left, right) =>
        statusPriority[left.status] - statusPriority[right.status] ||
        left.name.localeCompare(right.name)
    )

  const summary: ProjectStatusSummary = {
    total: monitors.length,
    operational: 0,
    degraded: 0,
    down: 0,
    paused: 0,
    unknown: 0,
  }

  for (const monitor of monitors) summary[monitor.status] += 1

  return {
    source,
    overall: overallStatus(source, summary),
    checkedAt,
    monitors,
    summary,
  }
}
