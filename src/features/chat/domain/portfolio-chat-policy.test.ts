import { describe, expect, it } from "vitest"

import {
  createPortfolioChatKnowledgeScope,
  PORTFOLIO_CHAT_POLICY_VERSION,
} from "@/features/chat/domain/portfolio-chat-policy"

describe("portfolio chat runtime policy", () => {
  it("binds focused-evidence replies to the compiled knowledge hash", () => {
    expect(PORTFOLIO_CHAT_POLICY_VERSION).toBe(
      "portfolio-chat/focused-evidence-v2"
    )
    expect(createPortfolioChatKnowledgeScope("a".repeat(64))).toEqual({
      policyVersion: "portfolio-chat/focused-evidence-v2",
      knowledgeHash: "a".repeat(64),
    })
  })

  it("rejects a value that cannot identify a compiled knowledge packet", () => {
    expect(() => createPortfolioChatKnowledgeScope("not-a-hash")).toThrow(
      "knowledge hash"
    )
  })
})
