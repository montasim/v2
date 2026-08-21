import { describe, expect, it } from "vitest"

import type { InquiryDelivery } from "@/features/chat/application/ports/inquiry-delivery"
import { submitInquiryWith } from "@/features/chat/application/submit-inquiry"
import type { InquirySubmission } from "@/features/chat/domain/inquiry"

describe("submitInquiryWith", () => {
  it("delivers a validated inquiry through the configured port", async () => {
    const delivered: InquirySubmission[] = []
    const delivery: InquiryDelivery = {
      async deliver(inquiry) {
        delivered.push(inquiry)
      },
    }
    const inquiry: InquirySubmission = {
      id: "inquiry-test-project",
      type: "project",
      name: "Amina Rahman",
      email: "amina@example.com",
      projectType: "SaaS platform",
      timeline: "Within 1-3 months",
    }

    await expect(submitInquiryWith(delivery, inquiry)).resolves.toEqual({
      delivered: true,
    })
    expect(delivered).toEqual([inquiry])
  })
})
