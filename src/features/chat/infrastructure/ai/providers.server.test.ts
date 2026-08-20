import { describe, expect, it } from "vitest"

import { GEMINI_LANGUAGE_MODEL_OPTIONS } from "@/features/chat/infrastructure/ai/providers.server"

describe("Gemini provider configuration", () => {
  it("uses minimal thinking without returning internal thoughts", () => {
    expect(GEMINI_LANGUAGE_MODEL_OPTIONS).toEqual({
      thinkingConfig: {
        thinkingLevel: "minimal",
        includeThoughts: false,
      },
    })
  })
})
