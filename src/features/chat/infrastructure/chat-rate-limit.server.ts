import { createHmac } from "node:crypto"
import { isIP } from "node:net"

import { sql } from "drizzle-orm"

import type {
  ChatRateLimitRequest,
  ChatRequestLimiter,
} from "@/features/chat/application/ports/chat-request-limiter"
import { assistantRateLimits } from "@/db/schema"
import { getDatabase } from "@/db/client.server"

export class DatabaseChatRequestLimiter implements ChatRequestLimiter {
  async consume({
    scope,
    subjectHash,
    limit,
    windowMs,
    now = new Date(),
  }: ChatRateLimitRequest) {
    const expiredBefore = new Date(now.getTime() - windowMs)
    const rows = await getDatabase()
      .insert(assistantRateLimits)
      .values({
        scope,
        subjectHash,
        windowStartedAt: now,
        requestCount: 1,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [assistantRateLimits.scope, assistantRateLimits.subjectHash],
        set: {
          windowStartedAt: sql`case when ${assistantRateLimits.windowStartedAt} <= ${expiredBefore} then ${now} else ${assistantRateLimits.windowStartedAt} end`,
          requestCount: sql`case when ${assistantRateLimits.windowStartedAt} <= ${expiredBefore} then 1 else ${assistantRateLimits.requestCount} + 1 end`,
          updatedAt: now,
        },
      })
      .returning({
        windowStartedAt: assistantRateLimits.windowStartedAt,
        requestCount: assistantRateLimits.requestCount,
      })

    const bucket = rows.at(0)
    const requestCount = bucket?.requestCount ?? limit + 1
    const resetAt =
      (bucket?.windowStartedAt.getTime() ?? now.getTime()) + windowMs
    return {
      allowed: requestCount <= limit,
      remaining: Math.max(0, limit - requestCount),
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((resetAt - now.getTime()) / 1_000)
      ),
    }
  }
}

export class InMemoryChatRequestLimiter implements ChatRequestLimiter {
  private readonly buckets = new Map<
    string,
    { windowStartedAt: number; requestCount: number }
  >()

  async consume({
    scope,
    subjectHash,
    limit,
    windowMs,
    now = new Date(),
  }: ChatRateLimitRequest) {
    const key = `${scope}:${subjectHash}`
    const timestamp = now.getTime()
    let bucket = this.buckets.get(key)
    if (!bucket || bucket.windowStartedAt + windowMs <= timestamp) {
      bucket = { windowStartedAt: timestamp, requestCount: 0 }
      this.buckets.set(key, bucket)
    }
    bucket.requestCount += 1
    return {
      allowed: bucket.requestCount <= limit,
      remaining: Math.max(0, limit - bucket.requestCount),
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((bucket.windowStartedAt + windowMs - timestamp) / 1_000)
      ),
    }
  }
}

export function getChatVisitorHash(request: Request) {
  const candidate =
    request.headers.get("x-nf-client-connection-ip") ??
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  const address = isIP(candidate) ? candidate : "unknown"
  const configuredSecret = process.env.CHAT_RATE_LIMIT_SECRET
  if (
    process.env.NODE_ENV === "production" &&
    (!configuredSecret || configuredSecret.length < 32)
  ) {
    throw new Error("Chat request protection is not configured.")
  }
  const secret = configuredSecret ?? "development-only-chat-rate-limit-secret"
  return createHmac("sha256", secret).update(address).digest("hex")
}
