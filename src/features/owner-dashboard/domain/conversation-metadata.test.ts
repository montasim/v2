import { describe, expect, it } from "vitest"

import {
  formatConversationProviderRoute,
  formatConversationResponseMetadata,
} from "@/features/owner-dashboard/domain/conversation-metadata"

describe("formatConversationResponseMetadata", () => {
  it("shows the provider and the model that actually served a generated answer", () => {
    expect(
      formatConversationResponseMetadata({
        responseKind: "generated",
        provider: "openrouter",
        model: "z-ai/glm-5.2:free",
        servedModel: "z-ai/glm-5.2:free:exact",
        usedFallback: false,
        source: "Experience",
      })
    ).toBe("openrouter · z-ai/glm-5.2:free:exact · Experience")
  })

  it("falls back to the requested model and identifies a provider fallback", () => {
    expect(
      formatConversationResponseMetadata({
        responseKind: "generated",
        provider: "groq",
        model: "openai/gpt-oss-120b",
        servedModel: null,
        usedFallback: true,
        source: "Projects",
      })
    ).toBe("groq · openai/gpt-oss-120b · fallback · Projects")
  })

  it("labels reviewed answers without empty provider separators", () => {
    expect(
      formatConversationResponseMetadata({
        responseKind: "common",
        provider: null,
        model: null,
        servedModel: null,
        usedFallback: false,
        source: "Career impact",
      })
    ).toBe("Reviewed answer · Career impact")
  })

  it("labels new exact catalog answers without model provenance", () => {
    expect(
      formatConversationResponseMetadata({
        responseKind: "exact",
        provider: null,
        model: null,
        servedModel: null,
        usedFallback: false,
        source: "Professional experience",
      })
    ).toBe("Exact answer · Professional experience")
  })

  it.each([
    ["contact-intent", "Contact handoff (no model)"],
    ["insufficient-evidence", "Evidence handoff (no model)"],
    ["unsafe-question", "Safety response (no model)"],
    ["provider-unavailable", "Provider handoff (no accepted model)"],
  ])("labels a %s handoff clearly", (handoffReason, expectedLabel) => {
    expect(
      formatConversationResponseMetadata({
        responseKind: "handoff",
        handoffReason,
        provider: null,
        model: null,
        servedModel: null,
        usedFallback: false,
        source: "Portfolio contact",
      })
    ).toBe(`${expectedLabel} · Portfolio contact`)
  })

  it("handles legacy non-model response kinds without malformed separators", () => {
    expect(
      formatConversationResponseMetadata({
        responseKind: "noisy",
        provider: null,
        model: null,
        servedModel: null,
        usedFallback: false,
        source: "Question safety",
      })
    ).toBe("Filtered response (no model) · Question safety")
  })
})

describe("formatConversationProviderRoute", () => {
  it("shows every attempted provider in order with concise outcomes", () => {
    expect(
      formatConversationProviderRoute([
        {
          provider: "openrouter",
          requestedModel: "z-ai/glm-5.2:free",
          outcome: "failed",
          reason: "rate-limited",
        },
        {
          provider: "gemini",
          requestedModel: "gemini-3.5-flash",
          outcome: "skipped",
          reason: "provider-circuit-open",
        },
        {
          provider: "groq",
          requestedModel: "openai/gpt-oss-120b",
          servedModel: "openai/gpt-oss-120b",
          outcome: "accepted",
        },
      ])
    ).toBe(
      "Route: openrouter · z-ai/glm-5.2:free (rate limited) → gemini · gemini-3.5-flash (circuit open) → groq · openai/gpt-oss-120b (accepted)"
    )
  })

  it("shows a distinct served model without repeating an identical one", () => {
    expect(
      formatConversationProviderRoute([
        {
          provider: "openrouter",
          requestedModel: "google/gemma-4-31b-it:free",
          servedModel: "google/gemma-4-31b-it",
          outcome: "accepted",
        },
      ])
    ).toBe(
      "Route: openrouter · google/gemma-4-31b-it:free / google/gemma-4-31b-it (accepted)"
    )

    expect(
      formatConversationProviderRoute([
        {
          provider: "openrouter",
          requestedModel: "z-ai/glm-5.2:free",
          servedModel: "z-ai/glm-5.2:free",
          outcome: "accepted",
        },
      ])
    ).toBe("Route: openrouter · z-ai/glm-5.2:free (accepted)")
  })

  it("distinguishes answer generation from the independent quality review", () => {
    expect(
      formatConversationProviderRoute([
        {
          stage: "generation",
          provider: "openrouter",
          requestedModel: "z-ai/glm-5.2:free",
          outcome: "accepted",
        },
        {
          stage: "review",
          provider: "gemini",
          requestedModel: "gemini-3.5-flash",
          outcome: "accepted",
        },
      ])
    ).toBe(
      "Route: generation: openrouter · z-ai/glm-5.2:free (accepted) → review: gemini · gemini-3.5-flash (accepted)"
    )
  })

  it("parses saved JSON defensively and never renders empty separators", () => {
    expect(formatConversationProviderRoute(null)).toBeNull()
    expect(
      formatConversationProviderRoute({ provider: "openrouter" })
    ).toBeNull()
    expect(
      formatConversationProviderRoute([
        null,
        "bad row",
        { requestedModel: "model-without-provider", outcome: "failed" },
        { provider: "  ", outcome: "failed" },
      ])
    ).toBeNull()
  })

  it("humanizes validation and provider reasons without exposing raw codes", () => {
    expect(
      formatConversationProviderRoute([
        {
          provider: "openrouter",
          requestedModel: "free-model",
          outcome: "rejected",
          reason: "openrouter-cost-not-proven-zero",
        },
        {
          provider: "gemini",
          requestedModel: "flash-model",
          outcome: "rejected",
          reason: "unsupported-claim,invalid-citation",
        },
      ])
    ).toBe(
      "Route: openrouter · free-model (zero cost not verified) → gemini · flash-model (unsupported claim, invalid citation)"
    )
  })
})
