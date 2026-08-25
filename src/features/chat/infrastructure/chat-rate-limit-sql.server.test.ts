import type { SQL } from "drizzle-orm"
import { PgDialect } from "drizzle-orm/pg-core"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { DatabaseChatRequestLimiter } from "@/features/chat/infrastructure/chat-rate-limit.server"

const database = vi.hoisted(() => {
  const returning = vi.fn()
  const onConflictDoUpdate = vi.fn((_config: unknown) => ({ returning }))
  const values = vi.fn((_values: unknown) => ({ onConflictDoUpdate }))
  const insert = vi.fn((_table: unknown) => ({ values }))

  return { insert, values, onConflictDoUpdate, returning }
})

vi.mock("@/db/client.server", () => ({
  getDatabase: () => database,
}))

describe("database chat limiter SQL", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    database.returning.mockResolvedValue([
      {
        windowStartedAt: new Date("2026-08-23T00:00:00.000Z"),
        requestCount: 1,
      },
    ])
  })

  it("compares against a precomputed timestamp instead of untyped interval arithmetic", async () => {
    const now = new Date("2026-08-23T00:10:00.000Z")

    await new DatabaseChatRequestLimiter().consume({
      scope: "all-10m",
      subjectHash: "v".repeat(64),
      limit: 30,
      windowMs: 10 * 60 * 1_000,
      now,
    })

    const conflict = database.onConflictDoUpdate.mock.calls[0]?.[0] as
      { set?: { windowStartedAt?: SQL; requestCount?: SQL } } | undefined
    const dialect = new PgDialect()
    const windowSql = dialect.sqlToQuery(conflict!.set!.windowStartedAt!)
    const countSql = dialect.sqlToQuery(conflict!.set!.requestCount!)

    expect(windowSql.sql).not.toContain("interval")
    expect(countSql.sql).not.toContain("interval")
    expect(windowSql.params[0]).toEqual(new Date("2026-08-23T00:00:00.000Z"))
    expect(countSql.params[0]).toEqual(new Date("2026-08-23T00:00:00.000Z"))
  })
})
