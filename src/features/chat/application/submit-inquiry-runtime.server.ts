import { getRequestHeader } from "@tanstack/react-start/server"

import { runInquiryWithDeadline } from "@/features/chat/application/inquiry-deadline.server"
import { resolveInquiryVisitorAddress } from "@/features/chat/application/inquiry-request-address.server"
import { createDefaultPortfolioInquiry } from "@/features/chat/application/portfolio-inquiry-runtime.server"
import type { InquirySubmission } from "@/features/chat/domain/inquiry"
import {
  getInquiryModerationError,
  INQUIRY_MODERATION_ERROR,
} from "@/features/chat/domain/inquiry-moderation"
import {
  EMAIL_RATE_LIMIT_ERROR,
  INQUIRY_SUBMISSION_UNAVAILABLE_ERROR,
  VISITOR_RATE_LIMIT_ERROR,
} from "@/features/chat/domain/inquiry-errors"
import { createInquirySubjectHasher } from "@/features/chat/infrastructure/inquiry/rate-limit.server"
import { getEmailVerificationError } from "@/features/email-verification/domain/email-verification"
import { logger } from "@/lib/logger.server"

export const INQUIRY_SERVER_FN_DEADLINE_MS = 40_000

export async function submitInquiryOnServer(data: {
  inquiry: InquirySubmission
  website: string
}) {
  if (data.website) return { delivered: true as const }

  return runInquiryServerOperation(
    async (signal) => {
      const moderationError = await getInquiryModerationError(data.inquiry)
      if (moderationError) throw new Error(moderationError)

      const subjectHasher = createInquirySubjectHasher()
      const portfolioInquiry = createDefaultPortfolioInquiry(subjectHasher)
      return portfolioInquiry.submit({
        inquiry: data.inquiry,
        website: data.website,
        signal,
        visitorHash: subjectHasher.hash(
          resolveInquiryVisitorAddress({
            get(name) {
              return getRequestHeader(name) ?? null
            },
          })
        ),
      })
    },
    INQUIRY_SERVER_FN_DEADLINE_MS,
    (error) =>
      logger.error(
        {
          inquiryId: data.inquiry.id,
          errorType:
            error instanceof Error ? error.constructor.name : typeof error,
        },
        "Portfolio inquiry submission failed"
      )
  )
}

export async function runInquiryServerOperation<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  timeoutMs = INQUIRY_SERVER_FN_DEADLINE_MS,
  onFailure?: (error: unknown) => void
) {
  try {
    return await runInquiryWithDeadline(operation, timeoutMs)
  } catch (error) {
    onFailure?.(error)
    throw sanitizeInquirySubmissionError(error)
  }
}

export function sanitizeInquirySubmissionError(error: unknown) {
  const verifiedEmailError = getEmailVerificationError(error)
  if (verifiedEmailError) return new Error(verifiedEmailError)

  if (
    error instanceof Error &&
    (error.message === VISITOR_RATE_LIMIT_ERROR ||
      error.message === EMAIL_RATE_LIMIT_ERROR ||
      error.message === INQUIRY_MODERATION_ERROR)
  ) {
    return new Error(error.message)
  }

  return new Error(INQUIRY_SUBMISSION_UNAVAILABLE_ERROR)
}
