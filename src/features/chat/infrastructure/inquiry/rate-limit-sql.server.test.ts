import { PgDialect } from "drizzle-orm/pg-core"
import type { SQL } from "drizzle-orm"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { NeonInquiryRateLimiter } from "@/features/chat/infrastructure/inquiry/rate-limit.server"

const database = vi.hoisted(() => ({
  execute: vi.fn(),
}))

vi.mock("@/db/client.server", () => ({
  getDatabase: () => database,
}))

describe("Neon inquiry rate-limit SQL", () => {
  beforeEach(() => {
    database.execute.mockReset()
  })

  it("uses unqualified columns in the accepted-email INSERT target list", async () => {
    database.execute.mockResolvedValue({
      rows: [{ already_reserved: false, reserved: true }],
    })
    const limiter = new NeonInquiryRateLimiter({ hash: (value) => value })

    await limiter.reserveAcceptedEmail({
      emailHash: "e".repeat(64),
      inquiryId: "11111111-1111-4111-8111-111111111111",
      now: new Date("2026-08-23T00:00:00.000Z"),
    })

    const query = database.execute.mock.calls[0]?.[0] as SQL | undefined
    expect(query).toBeDefined()
    const compiled = new PgDialect().sqlToQuery(query!)
    const normalizedSql = compiled.sql.replace(/\s+/g, " ").trim()

    const insertTargets = normalizedSql.match(
      /insert into "inquiry_rate_limit_acceptances" \(\s*(.*?)\s*\) select/
    )?.[1]
    expect(insertTargets).toBe(
      '"scope", "subject_hash", "inquiry_id", "accepted_at"'
    )
  })
})
