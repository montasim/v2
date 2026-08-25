import { describe, expect, it } from "vitest"

import { redactChatText } from "@/features/chat/domain/chat-redaction"

describe("chat redaction", () => {
  it("removes contact details and common API-key shapes before AI or storage", () => {
    const redacted = redactChatText(
      "Email recruiter@example.com, call +880 1712-345678, key or-v1-abcdefghijklmnopqrstuvwxyz."
    )
    expect(redacted).toBe(
      "Email [email redacted], call [phone redacted], key [secret redacted]."
    )
  })

  it("does not mistake a year range for a phone number", () => {
    expect(redactChatText("What did he build in 2023-2024?")).toBe(
      "What did he build in 2023-2024?"
    )
  })
})
