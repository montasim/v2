import { describe, expect, it } from "vitest"

import { formatChatResponseProvenance } from "@/features/chat/domain/chat-response-provenance"

describe("formatChatResponseProvenance", () => {
  it("shows the provider, model, fallback, and source for generated answers", () => {
    expect(
      formatChatResponseProvenance({
        responseKind: "generated",
        provider: "gemini",
        model: "gemini-3.5-flash",
        fallbackDepth: 1,
        source: "Experience",
      })
    ).toBe("gemini · gemini-3.5-flash · fallback · Experience")
  })

  it("keeps the requested free model visible when the served model differs", () => {
    expect(
      formatChatResponseProvenance({
        responseKind: "generated",
        provider: "openrouter",
        requestedModel: "z-ai/glm-5.2:free",
        servedModel: "z-ai/glm-5.2",
        source: "Experience",
      })
    ).toBe("openrouter · z-ai/glm-5.2:free / z-ai/glm-5.2 · Experience")
  })

  it("labels exact and handoff responses without empty model placeholders", () => {
    expect(
      formatChatResponseProvenance({
        responseKind: "exact",
        source: "Experience",
      })
    ).toBe("Exact answer · Experience")
    expect(
      formatChatResponseProvenance({
        responseKind: "handoff",
        source: "Portfolio contact",
      })
    ).toBe("No accepted model · Portfolio contact")
  })
})
