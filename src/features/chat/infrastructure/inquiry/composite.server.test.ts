import { describe, expect, it, vi } from "vitest"

import type { InquiryDelivery } from "@/features/chat/application/ports/inquiry-delivery"
import type { InquirySubmission } from "@/features/chat/domain/inquiry"
import { CompositeInquiryDelivery } from "@/features/chat/infrastructure/inquiry/composite.server"

const inquiry: InquirySubmission = {
  type: "hire",
  name: "Tanim",
  email: "tanim@example.com",
  role: "Senior Frontend Engineer",
  arrangement: "Remote",
}

describe("CompositeInquiryDelivery", () => {
  it("delivers an inquiry to every configured destination", async () => {
    const first = vi.fn()
    const second = vi.fn()
    const deliveries: InquiryDelivery[] = [
      { deliver: first },
      { deliver: second },
    ]

    await new CompositeInquiryDelivery(deliveries).deliver(inquiry)

    expect(first).toHaveBeenCalledWith(inquiry)
    expect(second).toHaveBeenCalledWith(inquiry)
  })
})
