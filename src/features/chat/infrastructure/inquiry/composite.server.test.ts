import { describe, expect, it, vi } from "vitest"

import type { InquiryDelivery } from "@/features/chat/application/ports/inquiry-delivery"
import type { InquirySubmission } from "@/features/chat/domain/inquiry"
import { CompositeInquiryDelivery } from "@/features/chat/infrastructure/inquiry/composite.server"

const inquiry: InquirySubmission = {
  id: "inquiry-test-role",
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

    await new CompositeInquiryDelivery(
      deliveries[0],
      deliveries.slice(1)
    ).deliver(inquiry)

    expect(first).toHaveBeenCalledWith(inquiry)
    expect(second).toHaveBeenCalledWith(inquiry)
  })

  it("succeeds after primary storage when a secondary notification fails", async () => {
    const primary = vi.fn().mockResolvedValue(undefined)
    const secondary = vi.fn().mockRejectedValue(new Error("Email unavailable"))

    await expect(
      new CompositeInquiryDelivery({ deliver: primary }, [
        { deliver: secondary },
      ]).deliver(inquiry)
    ).resolves.toBeUndefined()
    expect(primary).toHaveBeenCalledOnce()
    expect(secondary).toHaveBeenCalledOnce()
  })

  it("does not notify secondary destinations when primary storage fails", async () => {
    const primary = vi.fn().mockRejectedValue(new Error("Storage unavailable"))
    const secondary = vi.fn()

    await expect(
      new CompositeInquiryDelivery({ deliver: primary }, [
        { deliver: secondary },
      ]).deliver(inquiry)
    ).rejects.toThrow("Storage unavailable")
    expect(secondary).not.toHaveBeenCalled()
  })
})
