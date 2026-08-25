import { createHmac } from "node:crypto"

import { lt, lte, or, sql } from "drizzle-orm"

import { getDatabase } from "@/db/client.server"
import { inquiryRateLimitAcceptances, inquiryRateLimits } from "@/db/schema"
import type {
  InquiryRateLimiter,
  InquirySubjectHasher,
} from "@/features/chat/application/ports/portfolio-inquiry"
import {
  EMAIL_RATE_LIMIT_ERROR,
  VISITOR_RATE_LIMIT_ERROR,
} from "@/features/chat/domain/inquiry-errors"

export const INQUIRY_RATE_LIMIT_POLICY = {
  visitor: { limit: 3, windowMs: 15 * 60 * 1_000 },
  retryVisitor: { limit: 6, windowMs: 15 * 60 * 1_000 },
  retryInquiry: { limit: 1, windowMs: 5 * 60 * 1_000 },
  acceptedEmail: { limit: 3, windowMs: 24 * 60 * 60 * 1_000 },
} as const

export class NeonInquiryRateLimiter implements InquiryRateLimiter {
  constructor(
    private readonly subjectHasher: InquirySubjectHasher = createInquirySubjectHasher()
  ) {}

  async consumeVisitorAttempt(visitorHash: string, now: Date) {
    const allowed = await consumeFixedWindow(
      "visitor",
      visitorHash,
      now,
      INQUIRY_RATE_LIMIT_POLICY.visitor
    )
    if (!allowed) throw new Error(VISITOR_RATE_LIMIT_ERROR)
  }

  async allowRetryAttempt({
    visitorHash,
    inquiryId,
    now,
  }: Parameters<InquiryRateLimiter["allowRetryAttempt"]>[0]) {
    const visitorAllowed = await consumeFixedWindow(
      "retry-visitor",
      visitorHash,
      now,
      INQUIRY_RATE_LIMIT_POLICY.retryVisitor
    )
    if (!visitorAllowed) return false

    return consumeFixedWindow(
      "retry-inquiry",
      inquiryRetrySubject(this.subjectHasher, inquiryId),
      now,
      INQUIRY_RATE_LIMIT_POLICY.retryInquiry
    )
  }

  async reserveAcceptedEmail({
    emailHash,
    inquiryId,
    now,
  }: Parameters<InquiryRateLimiter["reserveAcceptedEmail"]>[0]) {
    const policy = INQUIRY_RATE_LIMIT_POLICY.acceptedEmail
    const acceptedAfter = new Date(now.getTime() - policy.windowMs)
    const lockKey = `portfolio-inquiry:accepted-email:${emailHash}`

    // A transaction-scoped advisory lock and all decisions live in one SQL
    // statement because drizzle's neon-http Adapter cannot run callback-based
    // transactions. Reusing an inquiry ID is idempotent and does not consume a
    // second daily allowance.
    const result = await getDatabase().execute<{
      already_reserved: boolean
      reserved: boolean
    }>(sql`
      with limiter_lock as (
        select pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))
      ), existing as (
        select 1
        from ${inquiryRateLimitAcceptances}, limiter_lock
        where ${inquiryRateLimitAcceptances.scope} = 'accepted-email'
          and ${inquiryRateLimitAcceptances.subjectHash} = ${emailHash}
          and ${inquiryRateLimitAcceptances.inquiryId} = ${inquiryId}
      ), recent as (
        select count(*)::integer as count
        from ${inquiryRateLimitAcceptances}, limiter_lock
        where ${inquiryRateLimitAcceptances.scope} = 'accepted-email'
          and ${inquiryRateLimitAcceptances.subjectHash} = ${emailHash}
          and ${inquiryRateLimitAcceptances.acceptedAt} > ${acceptedAfter}
      ), inserted as (
        insert into ${inquiryRateLimitAcceptances} (
          ${sql.identifier(inquiryRateLimitAcceptances.scope.name)},
          ${sql.identifier(inquiryRateLimitAcceptances.subjectHash.name)},
          ${sql.identifier(inquiryRateLimitAcceptances.inquiryId.name)},
          ${sql.identifier(inquiryRateLimitAcceptances.acceptedAt.name)}
        )
        select 'accepted-email', ${emailHash}, ${inquiryId}, ${now}
        where not exists (select 1 from existing)
          and (select count from recent) < ${policy.limit}
        on conflict do nothing
        returning 1
      )
      select
        exists(select 1 from existing) as already_reserved,
        exists(select 1 from inserted) as reserved
    `)

    const decision = result.rows.at(0)
    if (
      decision === undefined ||
      (!decision.already_reserved && !decision.reserved)
    ) {
      throw new Error(EMAIL_RATE_LIMIT_ERROR)
    }
    return { reserved: decision.reserved }
  }
}

export function inquiryRetrySubject(
  subjectHasher: InquirySubjectHasher,
  inquiryId: string
) {
  return subjectHasher.hash(`retry-inquiry\0${inquiryId}`)
}

async function consumeFixedWindow(
  scope: string,
  subjectHash: string,
  now: Date,
  policy: { limit: number; windowMs: number }
) {
  const expiredBefore = new Date(now.getTime() - policy.windowMs)
  const rows = await getDatabase()
    .insert(inquiryRateLimits)
    .values({
      scope,
      subjectHash,
      windowStartedAt: now,
      requestCount: 1,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [inquiryRateLimits.scope, inquiryRateLimits.subjectHash],
      set: {
        windowStartedAt: sql`case
            when ${inquiryRateLimits.windowStartedAt} <= ${expiredBefore}
            then ${now}
            else ${inquiryRateLimits.windowStartedAt}
          end`,
        requestCount: sql`case
            when ${inquiryRateLimits.windowStartedAt} <= ${expiredBefore}
            then 1
            else ${inquiryRateLimits.requestCount} + 1
          end`,
        updatedAt: now,
      },
      setWhere: or(
        lte(inquiryRateLimits.windowStartedAt, expiredBefore),
        lt(inquiryRateLimits.requestCount, policy.limit)
      ),
    })
    .returning({ count: inquiryRateLimits.requestCount })

  return rows.length > 0
}

export function createInquirySubjectHasher(
  secret = process.env.INQUIRY_RATE_LIMIT_SECRET
): InquirySubjectHasher {
  if (!secret || secret.length < 32) {
    throw new Error(
      "A rate-limit secret of at least 32 characters is required."
    )
  }

  return {
    hash(value) {
      return createHmac("sha256", secret)
        .update(value.trim().toLowerCase())
        .digest("hex")
    },
  }
}
