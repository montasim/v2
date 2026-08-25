import type { InquirySubmission } from "@/features/chat/domain/inquiry"

export const inquiryDeliveryChannels = [
  "resend-owner",
  "resend-acknowledgement",
  "google-sheets",
] as const

export type InquiryDeliveryChannel = (typeof inquiryDeliveryChannels)[number]

export interface PendingInquiryDelivery {
  channel: InquiryDeliveryChannel
  idempotencyKey: string
}

export interface AcceptedInquiry {
  inquiry: InquirySubmission
  pendingDeliveries: readonly PendingInquiryDelivery[]
}

export interface InquiryDeliveryClaim {
  leaseStartedAt: Date
}

export interface InquiryRepository {
  findAccepted: (inquiry: InquirySubmission) => Promise<AcceptedInquiry | null>
  findPending: (inquiryId: string) => Promise<AcceptedInquiry | null>
  listPendingIds: (input: {
    now: Date
    limit: number
  }) => Promise<readonly string[]>
  accept: (input: {
    inquiry: InquirySubmission
    visitorHash: string
    emailHash: string
  }) => Promise<AcceptedInquiry>
  claimDelivery: (input: {
    inquiryId: string
    channel: InquiryDeliveryChannel
    now: Date
  }) => Promise<InquiryDeliveryClaim | null>
  recordDelivery: (input: {
    inquiryId: string
    channel: InquiryDeliveryChannel
    leaseStartedAt: Date
    outcome: { status: "sent" } | { status: "pending"; error: string }
  }) => Promise<void>
}

export interface InquiryRateLimiter {
  consumeVisitorAttempt: (visitorHash: string, now: Date) => Promise<void>
  allowRetryAttempt: (input: {
    visitorHash: string
    inquiryId: string
    now: Date
  }) => Promise<boolean>
  reserveAcceptedEmail: (input: {
    emailHash: string
    inquiryId: string
    now: Date
  }) => Promise<{ reserved: boolean }>
}

export interface InquiryEmailPolicy {
  requirePermanent: (email: string) => Promise<void>
}

export interface InquiryDestination {
  readonly channel: InquiryDeliveryChannel
  deliver: (input: {
    inquiry: InquirySubmission
    idempotencyKey: string
    signal?: AbortSignal
  }) => Promise<void>
}

export interface InquirySubjectHasher {
  hash: (value: string) => string
}
