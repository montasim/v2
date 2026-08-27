import { z } from "zod"

import type { ProviderMonitor } from "@/features/project-status/domain/status"

const UPTIMEROBOT_API_ORIGIN = "https://api.uptimerobot.com"
const UPTIMEROBOT_MONITORS_URL = `${UPTIMEROBOT_API_ORIGIN}/v3/monitors?limit=200`
const CACHE_TTL_MS = 5 * 60 * 1000
const MAX_PAGES = 5

const monitorSchema = z
  .object({
    id: z.number(),
    friendlyName: z.string().min(1),
    status: z.union([z.string(), z.number()]),
    url: z.string().min(1),
    interval: z.number().optional(),
  })
  .transform((monitor): ProviderMonitor => ({
    id: monitor.id,
    friendlyName: monitor.friendlyName,
    status: monitor.status,
    url: monitor.url,
    intervalSeconds: monitor.interval,
  }))

const monitorPageSchema = z.object({
  data: z.array(monitorSchema),
  nextLink: z.string().nullable().optional(),
})

type CachedMonitors = {
  monitors: ProviderMonitor[]
  retrievedAt: string
  expiresAt: number
}

export type UptimeRobotResult =
  | {
      source: "live" | "stale"
      monitors: ProviderMonitor[]
      retrievedAt: string
    }
  | {
      source: "unconfigured" | "unavailable"
      monitors: []
      retrievedAt: null
    }

let cache: CachedMonitors | null = null

function nextMonitorUrl(nextLink: string) {
  const url = new URL(nextLink, UPTIMEROBOT_API_ORIGIN)

  if (
    url.origin !== UPTIMEROBOT_API_ORIGIN ||
    !url.pathname.startsWith("/v3/monitors")
  ) {
    throw new Error("UptimeRobot returned an invalid pagination link")
  }

  return url.toString()
}

async function requestMonitors(apiKey: string) {
  const monitors: ProviderMonitor[] = []
  let requestUrl: string | null = UPTIMEROBOT_MONITORS_URL

  for (let pageNumber = 0; requestUrl && pageNumber < MAX_PAGES; pageNumber++) {
    const response = await fetch(requestUrl, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(8_000),
    })

    if (!response.ok) {
      throw new Error(`UptimeRobot request failed with ${response.status}`)
    }

    const page = monitorPageSchema.parse(await response.json())
    monitors.push(...page.data)
    requestUrl = page.nextLink ? nextMonitorUrl(page.nextLink) : null
  }

  return monitors
}

export async function loadUptimeRobotMonitors(): Promise<UptimeRobotResult> {
  const apiKey = process.env.UPTIMEROBOT_READ_ONLY_API_KEY?.trim()

  if (!apiKey) {
    return { source: "unconfigured", monitors: [], retrievedAt: null }
  }

  const now = Date.now()
  if (cache && cache.expiresAt > now) {
    return {
      source: "live",
      monitors: cache.monitors,
      retrievedAt: cache.retrievedAt,
    }
  }

  try {
    const monitors = await requestMonitors(apiKey)
    const retrievedAt = new Date().toISOString()
    cache = {
      monitors,
      retrievedAt,
      expiresAt: now + CACHE_TTL_MS,
    }

    return { source: "live", monitors, retrievedAt }
  } catch {
    if (cache) {
      return {
        source: "stale",
        monitors: cache.monitors,
        retrievedAt: cache.retrievedAt,
      }
    }

    return { source: "unavailable", monitors: [], retrievedAt: null }
  }
}
