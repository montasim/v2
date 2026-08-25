import { describe, expect, it } from "vitest"

import {
  INQUIRY_DELIVERY_LEASE_MS,
  inquiryDeliveryIdempotencyKey,
  pendingDeliveriesFor,
} from "@/features/chat/infrastructure/inquiry/database.server"

describe("inquiry delivery identity", () => {
  it("is stable per inquiry and destination while separating destinations", () => {
    const owner = inquiryDeliveryIdempotencyKey(
      "inquiry-accepted-1",
      "resend-owner"
    )

    expect(owner).toBe(
      inquiryDeliveryIdempotencyKey("inquiry-accepted-1", "resend-owner")
    )
    expect(owner).not.toBe(
      inquiryDeliveryIdempotencyKey(
        "inquiry-accepted-1",
        "resend-acknowledgement"
      )
    )
    expect(owner).not.toBe(
      inquiryDeliveryIdempotencyKey("inquiry-accepted-2", "resend-owner")
    )
  })

  it("recovers an expired sending lease while leaving an active lease alone", () => {
    const now = new Date("2026-08-23T06:10:00.000Z")
    const expired = new Date(now.getTime() - INQUIRY_DELIVERY_LEASE_MS - 1)
    const active = new Date(now.getTime() - INQUIRY_DELIVERY_LEASE_MS + 1)

    expect(
      pendingDeliveriesFor(
        {
          id: "inquiry-recovery-1",
          resendOwnerState: "sending",
          resendOwnerUpdatedAt: expired,
          resendAcknowledgementState: "sending",
          resendAcknowledgementUpdatedAt: active,
          sheetsState: "pending",
          sheetsUpdatedAt: null,
        },
        now
      ).map(({ channel }) => channel)
    ).toEqual(["resend-owner", "google-sheets"])
  })
})
