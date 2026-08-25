import type { ChatRateLimitRequest } from "@/features/chat/application/ports/chat-request-limiter"

const TEN_MINUTES_MS = 10 * 60 * 1_000
const ONE_MINUTE_MS = 60 * 1_000
const ONE_DAY_MS = 24 * 60 * 60 * 1_000
const OPENROUTER_GLOBAL_SUBJECT = "openrouter-free-tier-global"

export function createVisitorDynamicRateLimitRequests(
  subjectHash: string,
  now?: Date
): readonly ChatRateLimitRequest[] {
  return [
    {
      scope: "visitor-dynamic-10m",
      subjectHash,
      limit: 180,
      windowMs: TEN_MINUTES_MS,
      now,
    },
    {
      scope: "visitor-dynamic-day",
      subjectHash,
      limit: 900,
      windowMs: ONE_DAY_MS,
      now,
    },
  ]
}

export function createOpenRouterGlobalRateLimitRequests(
  now?: Date
): readonly ChatRateLimitRequest[] {
  return [
    {
      scope: "openrouter-global-minute",
      subjectHash: OPENROUTER_GLOBAL_SUBJECT,
      limit: 18,
      windowMs: ONE_MINUTE_MS,
      now,
    },
    {
      scope: "openrouter-global-day",
      subjectHash: OPENROUTER_GLOBAL_SUBJECT,
      limit: 900,
      windowMs: ONE_DAY_MS,
      now,
    },
  ]
}
