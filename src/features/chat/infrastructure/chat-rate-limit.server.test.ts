import { afterEach, describe, expect, it, vi } from "vitest"

import {
  createOpenRouterGlobalRateLimitRequests,
  createVisitorDynamicRateLimitRequests,
} from "@/features/chat/application/chat-rate-limit-policy"
import {
  getChatVisitorHash,
  InMemoryChatRequestLimiter,
} from "@/features/chat/infrastructure/chat-rate-limit.server"

afterEach(() => vi.unstubAllEnvs())

describe("chat request limiter", () => {
  it("applies a shared atomic-style window and resets at its boundary", async () => {
    const limiter = new InMemoryChatRequestLimiter()
    const request = {
      scope: "visitor-dynamic-10m" as const,
      subjectHash: "visitor",
      limit: 2,
      windowMs: 1_000,
      now: new Date("2026-08-23T00:00:00Z"),
    }

    expect(await limiter.consume(request)).toMatchObject({ allowed: true })
    expect(await limiter.consume(request)).toMatchObject({ allowed: true })
    expect(await limiter.consume(request)).toMatchObject({
      allowed: false,
      remaining: 0,
    })
    expect(
      await limiter.consume({
        ...request,
        now: new Date("2026-08-23T00:00:01Z"),
      })
    ).toMatchObject({ allowed: true, remaining: 1 })
  })

  it("defines the quality runtime's visitor dynamic limits exactly", () => {
    expect(
      createVisitorDynamicRateLimitRequests(
        "visitor-hash",
        new Date("2026-08-24T00:00:00.000Z")
      )
    ).toEqual([
      {
        scope: "visitor-dynamic-10m",
        subjectHash: "visitor-hash",
        limit: 180,
        windowMs: 10 * 60 * 1_000,
        now: new Date("2026-08-24T00:00:00.000Z"),
      },
      {
        scope: "visitor-dynamic-day",
        subjectHash: "visitor-hash",
        limit: 900,
        windowMs: 24 * 60 * 60 * 1_000,
        now: new Date("2026-08-24T00:00:00.000Z"),
      },
    ])
  })

  it("defines shared OpenRouter free-tier safety limits independently of visitors", () => {
    const now = new Date("2026-08-24T00:00:00.000Z")

    expect(createOpenRouterGlobalRateLimitRequests(now)).toEqual([
      {
        scope: "openrouter-global-minute",
        subjectHash: "openrouter-free-tier-global",
        limit: 18,
        windowMs: 60 * 1_000,
        now,
      },
      {
        scope: "openrouter-global-day",
        subjectHash: "openrouter-free-tier-global",
        limit: 900,
        windowMs: 24 * 60 * 60 * 1_000,
        now,
      },
    ])
  })

  it("uses Netlify's authoritative address ahead of forwarded headers", () => {
    vi.stubEnv("CHAT_RATE_LIMIT_SECRET", "s".repeat(32))
    const first = new Request("https://montasim.dev/api/chat", {
      headers: {
        "x-nf-client-connection-ip": "203.0.113.10",
        "x-forwarded-for": "198.51.100.20",
      },
    })
    const spoofed = new Request("https://montasim.dev/api/chat", {
      headers: {
        "x-nf-client-connection-ip": "203.0.113.10",
        "x-forwarded-for": "192.0.2.30",
      },
    })

    expect(getChatVisitorHash(first)).toBe(getChatVisitorHash(spoofed))
  })

  it("fails closed without a strong production secret", () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("CHAT_RATE_LIMIT_SECRET", "")

    expect(() =>
      getChatVisitorHash(
        new Request("https://montasim.dev/api/chat", {
          headers: { "x-nf-client-connection-ip": "203.0.113.10" },
        })
      )
    ).toThrow("Chat request protection is not configured.")
  })
})
