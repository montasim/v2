import { describe, expect, it } from "vitest"

import {
  getInquiryModerationError,
  getInquiryMessageModerationError,
  INQUIRY_MODERATION_ERROR,
} from "@/features/chat/domain/inquiry-moderation"

describe("inquiry moderation", () => {
  it("allows a constructive query", async () => {
    await expect(
      getInquiryMessageModerationError(
        "Could you review my architecture proposal?"
      )
    ).resolves.toBeNull()
  })

  it("blocks offensive language in a general query", async () => {
    await expect(
      getInquiryModerationError({
        id: "11111111-1111-4111-8111-111111111111",
        type: "general",
        name: "Nadia Ahmed",
        email: "nadia@example.com",
        context: "You are a fucking idiot.",
      })
    ).resolves.toBe(INQUIRY_MODERATION_ERROR)
  })

  it("blocks offensive language in identity and custom inquiry fields", async () => {
    await expect(
      getInquiryModerationError({
        id: "11111111-1111-4111-8111-111111111111",
        type: "hire",
        name: "Fucking idiot",
        email: "nadia@example.com",
        role: "Senior Frontend Engineer",
        arrangement: "Remote",
      })
    ).resolves.toBe(INQUIRY_MODERATION_ERROR)

    await expect(
      getInquiryModerationError({
        id: "11111111-1111-4111-8111-111111111111",
        type: "project",
        name: "Nadia Ahmed",
        email: "nadia@example.com",
        projectType: "Fucking awful application",
        timeline: "Flexible",
      })
    ).resolves.toBe(INQUIRY_MODERATION_ERROR)
  })
})
