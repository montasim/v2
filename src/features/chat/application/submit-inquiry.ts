import { createServerFn } from "@tanstack/react-start"

import type { InquiryDelivery } from "@/features/chat/application/ports/inquiry-delivery"
import { inquirySubmissionSchema } from "@/features/chat/domain/inquiry"
import type { InquirySubmission } from "@/features/chat/domain/inquiry"
import { CompositeInquiryDelivery } from "@/features/chat/infrastructure/inquiry/composite.server"
import { GoogleSheetsInquiryDelivery } from "@/features/chat/infrastructure/inquiry/google-sheets.server"
import { ResendInquiryDelivery } from "@/features/chat/infrastructure/inquiry/resend.server"

export async function submitInquiryWith(
  delivery: InquiryDelivery,
  inquiry: InquirySubmission
) {
  await delivery.deliver(inquiry)
  return { delivered: true as const }
}

export const submitInquiry = createServerFn({ method: "POST" })
  .validator((input: unknown) => inquirySubmissionSchema.parse(input))
  .handler(async ({ data }) =>
    submitInquiryWith(
      new CompositeInquiryDelivery([
        new GoogleSheetsInquiryDelivery(),
        new ResendInquiryDelivery(),
      ]),
      data
    )
  )
