import type { ChatProviderName } from "@/features/chat/domain/chat"

export interface ProviderAvailability {
  canAttempt: (provider: ChatProviderName) => boolean
  recordFailure: (provider: ChatProviderName, error: unknown) => void
  recordSuccess: (provider: ChatProviderName) => void
}

const DEFAULT_RATE_LIMIT_COOLDOWN_MS = 60_000
const MAX_RATE_LIMIT_COOLDOWN_MS = 5 * 60_000

export function createProviderAvailability(
  now: () => number = Date.now
): ProviderAvailability {
  const blockedUntil = new Map<ChatProviderName, number>()

  return {
    canAttempt(provider) {
      return (blockedUntil.get(provider) ?? 0) <= now()
    },
    recordFailure(provider, error) {
      const cooldown = rateLimitCooldown(error)
      if (cooldown === undefined) return
      blockedUntil.set(provider, now() + cooldown)
    },
    recordSuccess(provider) {
      blockedUntil.delete(provider)
    },
  }
}

export const chatProviderAvailability = createProviderAvailability()

function rateLimitCooldown(error: unknown) {
  if (!isRecord(error) || error.statusCode !== 429) return undefined

  const retryAfter =
    readRetryAfter(error.responseHeaders) ?? readStructuredRetryDelay(error)
  if (retryAfter === undefined) return DEFAULT_RATE_LIMIT_COOLDOWN_MS
  return Math.min(Math.max(retryAfter, 1_000), MAX_RATE_LIMIT_COOLDOWN_MS)
}

function readStructuredRetryDelay(error: Record<string, unknown>) {
  const fromData = readRetryDetails(error.data)
  if (fromData !== undefined) return fromData
  if (typeof error.responseBody !== "string") return undefined

  try {
    return readRetryDetails(JSON.parse(error.responseBody))
  } catch {
    return undefined
  }
}

function readRetryDetails(payload: unknown) {
  if (!isRecord(payload)) return undefined
  const providerError = isRecord(payload.error) ? payload.error : payload
  if (!Array.isArray(providerError.details)) return undefined

  for (const detail of providerError.details) {
    if (isRecord(detail) && hasDailyQuota(detail)) {
      return MAX_RATE_LIMIT_COOLDOWN_MS
    }
  }
  for (const detail of providerError.details) {
    if (!isRecord(detail) || typeof detail.retryDelay !== "string") continue
    const duration = readDuration(detail.retryDelay)
    if (duration !== undefined) return duration
  }
  return undefined
}

function hasDailyQuota(detail: Record<string, unknown>) {
  if (!Array.isArray(detail.violations)) return false
  return detail.violations.some(
    (violation) =>
      isRecord(violation) &&
      typeof violation.quotaId === "string" &&
      violation.quotaId.toLowerCase().includes("perday")
  )
}

function readDuration(value: string) {
  const match = /^(\d+(?:\.\d+)?)s$/i.exec(value.trim())
  if (!match) return undefined
  const seconds = Number(match[1])
  return Number.isFinite(seconds) ? seconds * 1_000 : undefined
}

function readRetryAfter(headers: unknown) {
  if (!headers) return undefined

  let value: unknown
  if (headers instanceof Headers) value = headers.get("retry-after")
  else if (isRecord(headers)) {
    value = headers["retry-after"] ?? headers["Retry-After"]
  }
  if (typeof value !== "string") return undefined

  const seconds = Number(value)
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1_000

  const date = Date.parse(value)
  return Number.isNaN(date) ? undefined : Math.max(0, date - Date.now())
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}
