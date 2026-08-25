import { runInquiryWithDeadline } from "@/features/chat/application/inquiry-deadline.server"
import type { InquirySubjectHasher } from "@/features/chat/application/ports/portfolio-inquiry"
import { PortfolioInquiry } from "@/features/chat/application/portfolio-inquiry.server"
import { DatabaseInquiryRepository } from "@/features/chat/infrastructure/inquiry/database.server"
import { GoogleSheetsInquiryDelivery } from "@/features/chat/infrastructure/inquiry/google-sheets.server"
import {
  NeonInquiryRateLimiter,
  createInquirySubjectHasher,
} from "@/features/chat/infrastructure/inquiry/rate-limit.server"
import {
  ResendAcknowledgementInquiryDelivery,
  ResendOwnerInquiryDelivery,
} from "@/features/chat/infrastructure/inquiry/resend.server"
import { requirePermanentEmail } from "@/features/email-verification/infrastructure/disposable-email.server"

export function createDefaultPortfolioInquiry(
  subjectHasher: InquirySubjectHasher = createInquirySubjectHasher()
) {
  return new PortfolioInquiry({
    repository: new DatabaseInquiryRepository(),
    rateLimiter: new NeonInquiryRateLimiter(subjectHasher),
    emailPolicy: { requirePermanent: requirePermanentEmail },
    emailHasher: subjectHasher,
    destinations: [
      new ResendOwnerInquiryDelivery(),
      new ResendAcknowledgementInquiryDelivery(),
      new GoogleSheetsInquiryDelivery(),
    ],
  })
}

/** Server-owned entry point for a scheduler or authenticated operator action. */
export async function retryPendingPortfolioInquiry(inquiryId: string) {
  return runInquiryWithDeadline(
    (signal) => createDefaultPortfolioInquiry().retryPending(inquiryId, signal),
    25_000
  )
}

export async function retryPendingPortfolioInquiries({
  limit = 4,
  timeoutMs = 25_000,
}: {
  limit?: number
  timeoutMs?: number
} = {}) {
  const portfolioInquiry = createDefaultPortfolioInquiry()
  return runInquiryWithDeadline(
    (signal) => portfolioInquiry.retryPendingBatch({ limit, signal }),
    timeoutMs
  )
}
