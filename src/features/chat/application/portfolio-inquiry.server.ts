import {
  EMAIL_VERIFICATION_UNAVAILABLE_ERROR,
  getEmailVerificationError,
} from "@/features/email-verification/domain/email-verification"
import type {
  InquiryDestination,
  InquiryEmailPolicy,
  InquiryRateLimiter,
  InquiryRepository,
  InquirySubjectHasher,
  PendingInquiryDelivery,
} from "@/features/chat/application/ports/portfolio-inquiry"
import {
  inquiryIdSchema,
  inquirySubmissionSchema,
} from "@/features/chat/domain/inquiry"
import type { InquirySubmission } from "@/features/chat/domain/inquiry"
import { logger } from "@/lib/logger.server"

export const DEFAULT_INQUIRY_DELIVERY_TIMEOUT_MS = 12_000
const DELIVERY_CLAIM_TIMEOUT_MS = 5_000
const DELIVERY_STATE_TIMEOUT_MS = 2_500
const RETRY_LIMIT_TIMEOUT_MS = 2_500

export interface PortfolioInquirySubmission {
  inquiry: InquirySubmission
  visitorHash: string
  website?: string
  signal?: AbortSignal
}

interface PortfolioInquiryDependencies {
  repository: InquiryRepository
  rateLimiter: InquiryRateLimiter
  emailPolicy: InquiryEmailPolicy
  emailHasher: InquirySubjectHasher
  destinations: readonly InquiryDestination[]
  now?: () => Date
  deliveryTimeoutMs?: number
  deliveryClaimTimeoutMs?: number
  deliveryStateTimeoutMs?: number
  retryLimitTimeoutMs?: number
}

/**
 * The server-owned inquiry Module. Callers submit once; validation, abuse
 * controls, authoritative storage and fail-soft secondary delivery remain
 * local to this implementation.
 */
export class PortfolioInquiry {
  private readonly destinations: ReadonlyMap<
    InquiryDestination["channel"],
    InquiryDestination
  >
  private readonly now: () => Date
  private readonly deliveryTimeoutMs: number
  private readonly deliveryClaimTimeoutMs: number
  private readonly deliveryStateTimeoutMs: number
  private readonly retryLimitTimeoutMs: number

  constructor(private readonly dependencies: PortfolioInquiryDependencies) {
    this.destinations = new Map(
      dependencies.destinations.map((destination) => [
        destination.channel,
        destination,
      ])
    )
    if (this.destinations.size !== dependencies.destinations.length) {
      throw new Error("Each inquiry destination must have a unique channel.")
    }
    this.now = dependencies.now ?? (() => new Date())
    this.deliveryTimeoutMs = Math.max(
      1,
      dependencies.deliveryTimeoutMs ?? DEFAULT_INQUIRY_DELIVERY_TIMEOUT_MS
    )
    this.deliveryClaimTimeoutMs = Math.max(
      1,
      dependencies.deliveryClaimTimeoutMs ?? DELIVERY_CLAIM_TIMEOUT_MS
    )
    this.deliveryStateTimeoutMs = Math.max(
      1,
      dependencies.deliveryStateTimeoutMs ?? DELIVERY_STATE_TIMEOUT_MS
    )
    this.retryLimitTimeoutMs = Math.max(
      1,
      dependencies.retryLimitTimeoutMs ?? RETRY_LIMIT_TIMEOUT_MS
    )
  }

  async submit(input: PortfolioInquirySubmission) {
    const inquiry = inquirySubmissionSchema.parse(input.inquiry)

    // Preserve the public form's honeypot contract without spending remote
    // verification or database capacity on obvious automation.
    if (input.website?.trim()) return { delivered: true as const }

    const existing = await this.dependencies.repository.findAccepted(inquiry)
    if (existing) {
      if (
        existing.pendingDeliveries.length > 0 &&
        (await this.allowPublicRetry(input.visitorHash, inquiry.id))
      ) {
        await this.deliverAccepted(
          existing.inquiry,
          existing.pendingDeliveries,
          input.signal
        )
      }
      return { delivered: true as const }
    }

    await this.dependencies.rateLimiter.consumeVisitorAttempt(
      input.visitorHash,
      this.now()
    )
    await this.requireAcceptedEmail(inquiry.email)

    const emailHash = this.dependencies.emailHasher.hash(inquiry.email)
    await this.dependencies.rateLimiter.reserveAcceptedEmail({
      emailHash,
      inquiryId: inquiry.id,
      now: this.now(),
    })

    const accepted = await this.dependencies.repository.accept({
      inquiry,
      visitorHash: input.visitorHash,
      emailHash,
    })

    await this.deliverAccepted(
      accepted.inquiry,
      accepted.pendingDeliveries,
      input.signal
    )

    return { delivered: true as const }
  }

  async retryPending(inquiryId: string, signal?: AbortSignal) {
    const accepted = await this.dependencies.repository.findPending(
      inquiryIdSchema.parse(inquiryId)
    )
    if (!accepted) return { retried: false as const }

    await this.deliverAccepted(
      accepted.inquiry,
      accepted.pendingDeliveries,
      signal
    )
    return { retried: true as const }
  }

  async retryPendingBatch(input: { limit: number; signal?: AbortSignal }) {
    const inquiryIds = await this.dependencies.repository.listPendingIds({
      now: this.now(),
      limit: input.limit,
    })
    const results = await Promise.allSettled(
      inquiryIds.map((inquiryId) => this.retryPending(inquiryId, input.signal))
    )
    results.forEach((result, index) => {
      if (result.status === "fulfilled") return
      logger.warn(
        {
          inquiryId: inquiryIds[index],
          error: errorMessage(result.reason),
        },
        "Scheduled inquiry recovery failed for one inquiry"
      )
    })

    return {
      selected: inquiryIds.length,
      retried: results.filter(
        (result) => result.status === "fulfilled" && result.value.retried
      ).length,
      failed: results.filter((result) => result.status === "rejected").length,
    }
  }

  private async deliverAccepted(
    inquiry: InquirySubmission,
    pendingDeliveries: readonly PendingInquiryDelivery[],
    signal?: AbortSignal
  ) {
    await Promise.all(
      pendingDeliveries.map((pending) =>
        this.deliverPending(inquiry, pending, signal)
      )
    )
  }

  private async requireAcceptedEmail(email: string) {
    try {
      await this.dependencies.emailPolicy.requirePermanent(email)
    } catch (error) {
      throw new Error(
        getEmailVerificationError(error) ?? EMAIL_VERIFICATION_UNAVAILABLE_ERROR
      )
    }
  }

  private async allowPublicRetry(visitorHash: string, inquiryId: string) {
    try {
      return await withTimeout(
        this.dependencies.rateLimiter.allowRetryAttempt({
          visitorHash,
          inquiryId,
          now: this.now(),
        }),
        this.retryLimitTimeoutMs,
        "Inquiry retry limiter timed out."
      )
    } catch (error) {
      logger.warn(
        { inquiryId, error: errorMessage(error) },
        "Inquiry retry limiter was unavailable"
      )
      return false
    }
  }

  private async deliverPending(
    inquiry: InquirySubmission,
    pending: PendingInquiryDelivery,
    signal?: AbortSignal
  ) {
    const claimOperation = this.dependencies.repository.claimDelivery({
      inquiryId: inquiry.id,
      channel: pending.channel,
      now: this.now(),
    })
    let claim
    try {
      claim = await withTimeout(
        claimOperation,
        this.deliveryClaimTimeoutMs,
        "Inquiry delivery claim timed out."
      )
    } catch (error) {
      if (error instanceof OperationTimeoutError) {
        this.releaseLateClaim(inquiry.id, pending, claimOperation)
      }
      logger.warn(
        {
          inquiryId: inquiry.id,
          channel: pending.channel,
          error: errorMessage(error),
        },
        "Pending inquiry delivery could not be claimed"
      )
      return
    }
    if (!claim) return

    const destination = this.destinations.get(pending.channel)
    if (!destination) {
      await this.recordPendingFailure(
        inquiry.id,
        pending,
        claim.leaseStartedAt,
        "Inquiry destination is not configured."
      )
      return
    }

    try {
      await deliverWithTimeout(
        destination,
        inquiry,
        pending,
        this.deliveryTimeoutMs,
        signal
      )
      await this.recordDeliveryState({
        inquiryId: inquiry.id,
        channel: pending.channel,
        leaseStartedAt: claim.leaseStartedAt,
        outcome: { status: "sent" },
      })
    } catch (error) {
      await this.recordPendingFailure(
        inquiry.id,
        pending,
        claim.leaseStartedAt,
        errorMessage(error)
      )
    }
  }

  private releaseLateClaim(
    inquiryId: string,
    pending: PendingInquiryDelivery,
    claimOperation: ReturnType<InquiryRepository["claimDelivery"]>
  ) {
    void claimOperation
      .then((lateClaim) => {
        if (!lateClaim) return
        return this.recordPendingFailure(
          inquiryId,
          pending,
          lateClaim.leaseStartedAt,
          "Inquiry delivery claim completed after its deadline."
        )
      })
      .catch((error: unknown) => {
        logger.warn(
          {
            inquiryId,
            channel: pending.channel,
            error: errorMessage(error),
          },
          "Late inquiry delivery claim could not be released"
        )
      })
  }

  private async recordPendingFailure(
    inquiryId: string,
    pending: PendingInquiryDelivery,
    leaseStartedAt: Date,
    error: string
  ) {
    logger.warn(
      { inquiryId, channel: pending.channel, error },
      "Secondary inquiry delivery remains pending"
    )
    await this.recordDeliveryState({
      inquiryId,
      channel: pending.channel,
      leaseStartedAt,
      outcome: { status: "pending", error },
    })
  }

  private async recordDeliveryState(
    update: Parameters<InquiryRepository["recordDelivery"]>[0]
  ) {
    await withTimeout(
      this.dependencies.repository.recordDelivery(update),
      this.deliveryStateTimeoutMs,
      "Inquiry delivery state update timed out."
    ).catch((recordError: unknown) => {
      logger.warn(
        {
          inquiryId: update.inquiryId,
          channel: update.channel,
          error: errorMessage(recordError),
        },
        "Secondary inquiry delivery state could not be recorded"
      )
    })
  }
}

async function deliverWithTimeout(
  destination: InquiryDestination,
  inquiry: InquirySubmission,
  pending: PendingInquiryDelivery,
  timeoutMs: number,
  parentSignal?: AbortSignal
) {
  const controller = new AbortController()
  let timeout: ReturnType<typeof setTimeout> | undefined
  const timeoutError = new Error(
    `Inquiry delivery timed out after ${timeoutMs}ms.`
  )
  const deadline = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      controller.abort(timeoutError)
      reject(timeoutError)
    }, timeoutMs)
  })
  const signal = parentSignal
    ? AbortSignal.any([parentSignal, controller.signal])
    : controller.signal
  const cancellation = abortRejection(signal)

  try {
    await Promise.race([
      Promise.resolve().then(() =>
        destination.deliver({
          inquiry,
          idempotencyKey: pending.idempotencyKey,
          signal,
        })
      ),
      deadline,
      cancellation.promise,
    ])
  } finally {
    if (timeout) clearTimeout(timeout)
    cancellation.dispose()
  }
}

function abortRejection(signal: AbortSignal) {
  let rejectCancellation: ((reason: unknown) => void) | undefined
  const promise = new Promise<never>((_, reject) => {
    rejectCancellation = reject
  })
  const reject = () => rejectCancellation?.(signal.reason)

  if (signal.aborted) reject()
  else signal.addEventListener("abort", reject, { once: true })

  return {
    promise,
    dispose() {
      signal.removeEventListener("abort", reject)
    },
  }
}

async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  message: string
) {
  let timeout: ReturnType<typeof setTimeout> | undefined
  const deadline = new Promise<never>((_, reject) => {
    timeout = setTimeout(
      () => reject(new OperationTimeoutError(message)),
      timeoutMs
    )
  })

  try {
    return await Promise.race([operation, deadline])
  } finally {
    if (timeout) clearTimeout(timeout)
  }
}

class OperationTimeoutError extends Error {}

function errorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error"
  return message.slice(0, 500)
}
