import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"

import type { InquiryDelivery } from "@/features/chat/application/ports/inquiry-delivery"
import { inquirySubmissionSchema } from "@/features/chat/domain/inquiry"
import type { InquirySubmission } from "@/features/chat/domain/inquiry"
import { CompositeInquiryDelivery } from "@/features/chat/infrastructure/inquiry/composite.server"
import { DatabaseInquiryDelivery } from "@/features/chat/infrastructure/inquiry/database.server"
import { GoogleSheetsInquiryDelivery } from "@/features/chat/infrastructure/inquiry/google-sheets.server"
import { ResendInquiryDelivery } from "@/features/chat/infrastructure/inquiry/resend.server"
import { checkInquiryRateLimit } from "@/features/chat/infrastructure/inquiry/rate-limit.server"
import { requirePermanentEmail } from "@/features/email-verification/infrastructure/disposable-email.server"

export const inquiryRequestSchema = z.object({
  inquiry: inquirySubmissionSchema,
  website: z.string().trim().max(200).default(""),
})

export async function submitInquiryWith(
  delivery: InquiryDelivery,
  inquiry: InquirySubmission
) {
  await delivery.deliver(inquiry)
  return { delivered: true as const }
}

export const submitInquiry = createServerFn({ method: "POST" })
  .validator((input: unknown) => inquiryRequestSchema.parse(input))
  .handler(async ({ data }) => {
    if (data.website) return { delivered: true as const }

    await requirePermanentEmail(data.inquiry.email)
    checkInquiryRateLimit(data.inquiry.email)
    return submitInquiryWith(
      new CompositeInquiryDelivery(new DatabaseInquiryDelivery(), [
        new GoogleSheetsInquiryDelivery(),
        new ResendInquiryDelivery(),
      ]),
      data.inquiry
    )
  })
