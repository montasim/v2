import { and, asc, eq, isNull, lte, or, sql } from "drizzle-orm"
import type { AnyPgColumn } from "drizzle-orm/pg-core"

import { getDatabase } from "@/db/client.server"
import { portfolioInquiries } from "@/db/schema"
import type {
  AcceptedInquiry,
  InquiryDeliveryChannel,
  InquiryRepository,
  PendingInquiryDelivery,
} from "@/features/chat/application/ports/portfolio-inquiry"
import { inquirySubmissionSchema } from "@/features/chat/domain/inquiry"
import type { InquirySubmission } from "@/features/chat/domain/inquiry"

export const INQUIRY_DELIVERY_LEASE_MS = 2 * 60 * 1_000

export class DatabaseInquiryRepository implements InquiryRepository {
  async findAccepted(inquiry: InquirySubmission) {
    const storedRows = await getDatabase()
      .select()
      .from(portfolioInquiries)
      .where(eq(portfolioInquiries.id, inquiry.id))
      .limit(1)
    const stored = storedRows.at(0)
    return stored ? acceptedInquiryFor(stored, inquiry, new Date()) : null
  }

  async findPending(inquiryId: string) {
    const storedRows = await getDatabase()
      .select()
      .from(portfolioInquiries)
      .where(eq(portfolioInquiries.id, inquiryId))
      .limit(1)
    const stored = storedRows.at(0)
    return stored ? acceptedStoredInquiry(stored, new Date()) : null
  }

  async listPendingIds({
    now,
    limit,
  }: Parameters<InquiryRepository["listPendingIds"]>[0]) {
    const staleBefore = new Date(now.getTime() - INQUIRY_DELIVERY_LEASE_MS)
    const finiteLimit = Number.isFinite(limit) ? Math.trunc(limit) : 1
    const oldestClaimableAttempt = sql<Date>`least(
      ${deliveryAttemptOrder(
        portfolioInquiries.resendOwnerState,
        portfolioInquiries.resendOwnerUpdatedAt,
        staleBefore
      )},
      ${deliveryAttemptOrder(
        portfolioInquiries.resendAcknowledgementState,
        portfolioInquiries.resendAcknowledgementUpdatedAt,
        staleBefore
      )},
      ${deliveryAttemptOrder(
        portfolioInquiries.sheetsState,
        portfolioInquiries.sheetsUpdatedAt,
        staleBefore
      )}
    )`
    const rows = await getDatabase()
      .select({ id: portfolioInquiries.id })
      .from(portfolioInquiries)
      .where(
        or(
          or(
            eq(portfolioInquiries.resendOwnerState, "pending"),
            and(
              eq(portfolioInquiries.resendOwnerState, "sending"),
              or(
                isNull(portfolioInquiries.resendOwnerUpdatedAt),
                lte(portfolioInquiries.resendOwnerUpdatedAt, staleBefore)
              )
            )
          ),
          or(
            eq(portfolioInquiries.resendAcknowledgementState, "pending"),
            and(
              eq(portfolioInquiries.resendAcknowledgementState, "sending"),
              or(
                isNull(portfolioInquiries.resendAcknowledgementUpdatedAt),
                lte(
                  portfolioInquiries.resendAcknowledgementUpdatedAt,
                  staleBefore
                )
              )
            )
          ),
          or(
            eq(portfolioInquiries.sheetsState, "pending"),
            and(
              eq(portfolioInquiries.sheetsState, "sending"),
              or(
                isNull(portfolioInquiries.sheetsUpdatedAt),
                lte(portfolioInquiries.sheetsUpdatedAt, staleBefore)
              )
            )
          )
        )
      )
      .orderBy(
        asc(oldestClaimableAttempt),
        asc(portfolioInquiries.createdAt),
        asc(portfolioInquiries.id)
      )
      .limit(Math.min(100, Math.max(1, finiteLimit)))

    return rows.map(({ id }) => id)
  }

  async accept({
    inquiry,
    visitorHash,
    emailHash,
  }: Parameters<InquiryRepository["accept"]>[0]) {
    const database = getDatabase()
    const details = inquiryDetails(inquiry)

    const inserted = await database
      .insert(portfolioInquiries)
      .values({
        id: inquiry.id,
        type: inquiry.type,
        name: inquiry.name,
        email: inquiry.email,
        visitorHash,
        emailHash,
        context: inquiry.context ?? null,
        ...details,
      })
      .onConflictDoNothing({ target: portfolioInquiries.id })
      .returning()

    const stored =
      inserted.at(0) ??
      (
        await database
          .select()
          .from(portfolioInquiries)
          .where(eq(portfolioInquiries.id, inquiry.id))
          .limit(1)
      ).at(0)
    if (stored === undefined)
      throw new Error("The inquiry could not be stored.")

    return acceptedInquiryFor(stored, inquiry, new Date())
  }

  async claimDelivery({
    inquiryId,
    channel,
    now,
  }: Parameters<InquiryRepository["claimDelivery"]>[0]) {
    const staleBefore = new Date(now.getTime() - INQUIRY_DELIVERY_LEASE_MS)
    const database = getDatabase()

    switch (channel) {
      case "resend-owner": {
        const claimed = await database
          .update(portfolioInquiries)
          .set({
            resendOwnerState: "sending",
            resendOwnerLastError: null,
            resendOwnerUpdatedAt: now,
          })
          .where(
            and(
              eq(portfolioInquiries.id, inquiryId),
              or(
                eq(portfolioInquiries.resendOwnerState, "pending"),
                and(
                  eq(portfolioInquiries.resendOwnerState, "sending"),
                  or(
                    isNull(portfolioInquiries.resendOwnerUpdatedAt),
                    lte(portfolioInquiries.resendOwnerUpdatedAt, staleBefore)
                  )
                )
              )
            )
          )
          .returning({
            leaseStartedAt: portfolioInquiries.resendOwnerUpdatedAt,
          })
        const leaseStartedAt = claimed.at(0)?.leaseStartedAt
        return leaseStartedAt ? { leaseStartedAt } : null
      }
      case "resend-acknowledgement": {
        const claimed = await database
          .update(portfolioInquiries)
          .set({
            resendAcknowledgementState: "sending",
            resendAcknowledgementLastError: null,
            resendAcknowledgementUpdatedAt: now,
          })
          .where(
            and(
              eq(portfolioInquiries.id, inquiryId),
              or(
                eq(portfolioInquiries.resendAcknowledgementState, "pending"),
                and(
                  eq(portfolioInquiries.resendAcknowledgementState, "sending"),
                  or(
                    isNull(portfolioInquiries.resendAcknowledgementUpdatedAt),
                    lte(
                      portfolioInquiries.resendAcknowledgementUpdatedAt,
                      staleBefore
                    )
                  )
                )
              )
            )
          )
          .returning({
            leaseStartedAt: portfolioInquiries.resendAcknowledgementUpdatedAt,
          })
        const leaseStartedAt = claimed.at(0)?.leaseStartedAt
        return leaseStartedAt ? { leaseStartedAt } : null
      }
      case "google-sheets": {
        const claimed = await database
          .update(portfolioInquiries)
          .set({
            sheetsState: "sending",
            sheetsLastError: null,
            sheetsUpdatedAt: now,
          })
          .where(
            and(
              eq(portfolioInquiries.id, inquiryId),
              or(
                eq(portfolioInquiries.sheetsState, "pending"),
                and(
                  eq(portfolioInquiries.sheetsState, "sending"),
                  or(
                    isNull(portfolioInquiries.sheetsUpdatedAt),
                    lte(portfolioInquiries.sheetsUpdatedAt, staleBefore)
                  )
                )
              )
            )
          )
          .returning({ leaseStartedAt: portfolioInquiries.sheetsUpdatedAt })
        const leaseStartedAt = claimed.at(0)?.leaseStartedAt
        return leaseStartedAt ? { leaseStartedAt } : null
      }
    }
  }

  async recordDelivery({
    inquiryId,
    channel,
    leaseStartedAt,
    outcome,
  }: Parameters<InquiryRepository["recordDelivery"]>[0]) {
    const attemptedAt = new Date()
    const state = outcome.status === "sent" ? "sent" : "pending"
    const error = outcome.status === "sent" ? null : outcome.error
    const database = getDatabase()

    switch (channel) {
      case "resend-owner":
        await database
          .update(portfolioInquiries)
          .set({
            resendOwnerState: state,
            resendOwnerLastError: error,
            resendOwnerUpdatedAt: attemptedAt,
          })
          .where(
            and(
              eq(portfolioInquiries.id, inquiryId),
              eq(portfolioInquiries.resendOwnerState, "sending"),
              eq(portfolioInquiries.resendOwnerUpdatedAt, leaseStartedAt)
            )
          )
        return
      case "resend-acknowledgement":
        await database
          .update(portfolioInquiries)
          .set({
            resendAcknowledgementState: state,
            resendAcknowledgementLastError: error,
            resendAcknowledgementUpdatedAt: attemptedAt,
          })
          .where(
            and(
              eq(portfolioInquiries.id, inquiryId),
              eq(portfolioInquiries.resendAcknowledgementState, "sending"),
              eq(
                portfolioInquiries.resendAcknowledgementUpdatedAt,
                leaseStartedAt
              )
            )
          )
        return
      case "google-sheets":
        await database
          .update(portfolioInquiries)
          .set({
            sheetsState: state,
            sheetsLastError: error,
            sheetsUpdatedAt: attemptedAt,
          })
          .where(
            and(
              eq(portfolioInquiries.id, inquiryId),
              eq(portfolioInquiries.sheetsState, "sending"),
              eq(portfolioInquiries.sheetsUpdatedAt, leaseStartedAt)
            )
          )
    }
  }
}

function deliveryAttemptOrder(
  state: AnyPgColumn,
  updatedAt: AnyPgColumn,
  staleBefore: Date
) {
  return sql<Date>`case
    when ${state} = 'pending'
      then coalesce(${updatedAt}, ${portfolioInquiries.createdAt})
    when ${state} = 'sending'
      and (${updatedAt} is null or ${updatedAt} <= ${staleBefore})
      then coalesce(${updatedAt}, ${portfolioInquiries.createdAt})
    else 'infinity'::timestamptz
  end`
}

export function inquiryDeliveryIdempotencyKey(
  inquiryId: string,
  channel: InquiryDeliveryChannel
) {
  return `portfolio-inquiry-${inquiryId}-${channel}-v1`
}

export function pendingDeliveriesFor(
  stored: {
    id: string
    resendOwnerState: string
    resendOwnerUpdatedAt: Date | null
    resendAcknowledgementState: string
    resendAcknowledgementUpdatedAt: Date | null
    sheetsState: string
    sheetsUpdatedAt: Date | null
  },
  now = new Date()
): PendingInquiryDelivery[] {
  const staleBefore = now.getTime() - INQUIRY_DELIVERY_LEASE_MS
  const states: ReadonlyArray<{
    channel: InquiryDeliveryChannel
    state: string
    updatedAt: Date | null
  }> = [
    {
      channel: "resend-owner",
      state: stored.resendOwnerState,
      updatedAt: stored.resendOwnerUpdatedAt,
    },
    {
      channel: "resend-acknowledgement",
      state: stored.resendAcknowledgementState,
      updatedAt: stored.resendAcknowledgementUpdatedAt,
    },
    {
      channel: "google-sheets",
      state: stored.sheetsState,
      updatedAt: stored.sheetsUpdatedAt,
    },
  ]

  return states
    .filter(
      ({ state, updatedAt }) =>
        state === "pending" ||
        (state === "sending" &&
          (updatedAt === null || updatedAt.getTime() <= staleBefore))
    )
    .map(({ channel }) => ({
      channel,
      idempotencyKey: inquiryDeliveryIdempotencyKey(stored.id, channel),
    }))
}

function acceptedInquiryFor(
  stored: typeof portfolioInquiries.$inferSelect,
  inquiry: InquirySubmission,
  now: Date
): AcceptedInquiry {
  const accepted = acceptedStoredInquiry(stored, now)
  if (!sameInquiry(accepted.inquiry, inquiry)) {
    throw new Error("This inquiry identifier has already been used.")
  }
  return accepted
}

function acceptedStoredInquiry(
  stored: typeof portfolioInquiries.$inferSelect,
  now: Date
): AcceptedInquiry {
  const inquiry = inquirySubmissionSchema.parse({
    id: stored.id,
    type: stored.type,
    name: stored.name,
    email: stored.email,
    context: stored.context ?? undefined,
    role: stored.role ?? undefined,
    arrangement: stored.arrangement ?? undefined,
    projectType: stored.projectType ?? undefined,
    timeline: stored.timeline ?? undefined,
  })

  return {
    inquiry,
    pendingDeliveries: pendingDeliveriesFor(stored, now),
  }
}

function inquiryDetails(inquiry: InquirySubmission) {
  return inquiry.type === "hire"
    ? {
        role: inquiry.role,
        arrangement: inquiry.arrangement,
        projectType: null,
        timeline: null,
      }
    : {
        role: null,
        arrangement: null,
        projectType: inquiry.projectType,
        timeline: inquiry.timeline,
      }
}

function sameInquiry(first: InquirySubmission, second: InquirySubmission) {
  if (
    first.id !== second.id ||
    first.type !== second.type ||
    first.name !== second.name ||
    first.email !== second.email ||
    (first.context ?? "") !== (second.context ?? "")
  ) {
    return false
  }

  if (first.type === "hire" && second.type === "hire") {
    return (
      first.role === second.role && first.arrangement === second.arrangement
    )
  }
  if (first.type === "project" && second.type === "project") {
    return (
      first.projectType === second.projectType &&
      first.timeline === second.timeline
    )
  }
  return false
}
