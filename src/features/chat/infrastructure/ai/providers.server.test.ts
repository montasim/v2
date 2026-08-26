import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type * as AiSdk from "ai"

import type { AiCompletionRequest } from "@/features/chat/application/ports/ai-provider"
import {
  AiProviderError,
  createAiProviders,
  createGeminiAdapter,
  createGroqAdapter,
  createOpenRouterAdapter,
  GEMINI_LANGUAGE_MODEL_OPTIONS,
  GEMINI_MAX_OUTPUT_TOKENS,
  GEMINI_MODEL_ID,
  GEMINI_TEMPERATURE,
  GROQ_LANGUAGE_MODEL_OPTIONS,
  GROQ_MAX_OUTPUT_TOKENS,
  GROQ_MODEL_ID,
  GROQ_TEMPERATURE,
  OPENROUTER_FREE_MODEL_IDS,
  OPENROUTER_MAX_FALLBACK_MODELS,
  OPENROUTER_MAX_OUTPUT_TOKENS,
  OPENROUTER_MODEL_ID,
  OPENROUTER_PROVIDER_OPTIONS,
  OPENROUTER_TEMPERATURE,
  validateOpenRouterModelId,
} from "@/features/chat/infrastructure/ai/providers.server"

const mocks = vi.hoisted(() => ({
  createGoogle: vi.fn(),
  createGroq: vi.fn(),
  createOpenRouter: vi.fn(),
  generateText: vi.fn(),
}))

vi.mock("@ai-sdk/google", () => ({
  createGoogleGenerativeAI: mocks.createGoogle,
}))

vi.mock("@ai-sdk/groq", () => ({
  createGroq: mocks.createGroq,
}))

vi.mock("@openrouter/ai-sdk-provider", () => ({
  createOpenRouter: mocks.createOpenRouter,
}))

vi.mock("ai", async (importOriginal) => ({
  ...(await importOriginal<typeof AiSdk>()),
  generateText: mocks.generateText,
}))

const request: AiCompletionRequest = {
  system: "Use only the supplied evidence.",
  messages: [{ role: "user", content: "What are his strongest skills?" }],
  signal: new AbortController().signal,
}

function generated(overrides: Record<string, unknown> = {}) {
  return {
    text: "A grounded answer.",
    finishReason: "stop",
    usage: {
      inputTokens: 12,
      outputTokens: 7,
      totalTokens: 19,
    },
    response: {
      id: "generation-1",
      modelId: "served/model",
    },
    providerMetadata: undefined,
    ...overrides,
  }
}

beforeEach(() => {
  mocks.generateText.mockReset()
  mocks.createGoogle.mockReset().mockImplementation(({ apiKey }) =>
    Object.assign((modelId: string) => ({ provider: "google", modelId }), {
      apiKey,
    })
  )
  mocks.createGroq.mockReset().mockImplementation(({ apiKey }) =>
    Object.assign((modelId: string) => ({ provider: "groq", modelId }), {
      apiKey,
    })
  )
  mocks.createOpenRouter.mockReset().mockImplementation(({ apiKey }) => ({
    apiKey,
    chat: (modelId: string, settings?: unknown) => ({
      provider: "openrouter",
      modelId,
      settings,
    }),
  }))
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe("provider discovery", () => {
  it("reserves enough output space for the answer and its evidence ledger", () => {
    expect(OPENROUTER_MAX_OUTPUT_TOKENS).toBeGreaterThanOrEqual(2_000)
    expect(GEMINI_MAX_OUTPUT_TOKENS).toBeGreaterThanOrEqual(2_000)
    expect(GROQ_MAX_OUTPUT_TOKENS).toBeGreaterThanOrEqual(2_000)
  })

  it("uses deterministic generation settings across the provider chain", () => {
    expect(OPENROUTER_TEMPERATURE).toBe(0)
    expect(GEMINI_TEMPERATURE).toBe(0)
    expect(GROQ_TEMPERATURE).toBe(0)
  })

  it("contains only the reviewed free OpenRouter model IDs", () => {
    expect(OPENROUTER_FREE_MODEL_IDS).toEqual([
      "z-ai/glm-5.2:free",
      "minimax/minimax-m3:free",
      "minimax/minimax-m2.7:free",
      "google/gemma-4-31b-it:free",
      "google/gemma-4-26b-a4b-it:free",
      "nvidia/nemotron-3-super-120b-a12b:free",
      "dots-studio/dots-3-note-preview:free",
    ])
    expect(OPENROUTER_MODEL_ID).toBe("z-ai/glm-5.2:free")
  })

  it("accepts every reviewed model and rejects arbitrary or paid IDs", () => {
    for (const modelId of OPENROUTER_FREE_MODEL_IDS) {
      expect(validateOpenRouterModelId(modelId)).toBe(modelId)
    }

    for (const modelId of [
      "openrouter/free",
      "z-ai/glm-5.2",
      " z-ai/glm-5.2:free",
      "nvidia/nemotron-3-ultra-550b-a55b:free",
      "anthropic/claude-sonnet-4",
    ]) {
      expect(() => validateOpenRouterModelId(modelId)).toThrow(
        expect.objectContaining({
          name: "AiProviderError",
          code: "invalid-model",
          provider: "openrouter",
          modelId,
        })
      )
    }
  })

  it("returns only configured adapters in failover order", () => {
    const providers = createAiProviders({
      GROQ_API_KEY: "groq-key",
      GOOGLE_GENERATIVE_AI_API_KEY: "gemini-key",
      OPENROUTER_API_KEY: "openrouter-key",
    })

    expect(providers.map(({ provider }) => provider)).toEqual([
      "openrouter",
      "gemini",
      "groq",
    ])
    expect(providers.map(({ modelId }) => modelId)).toEqual([
      OPENROUTER_MODEL_ID,
      GEMINI_MODEL_ID,
      GROQ_MODEL_ID,
    ])
    expect(
      providers.map(({ supportsFullContextGeneration }) =>
        Boolean(supportsFullContextGeneration)
      )
    ).toEqual([true, true, false])
  })

  it("omits every provider with a missing or blank key", () => {
    expect(createAiProviders({})).toEqual([])
    expect(
      createAiProviders({
        OPENROUTER_API_KEY: " ",
        GOOGLE_GENERATIVE_AI_API_KEY: "gemini-key",
        GROQ_API_KEY: "",
      }).map(({ provider }) => provider)
    ).toEqual(["gemini"])
  })

  it("accepts the existing OPENROUTER key name during migration", () => {
    expect(
      createAiProviders({ OPENROUTER: "existing-key" }).map(
        ({ provider }) => provider
      )
    ).toEqual(["openrouter"])
  })

  it("uses a comma-separated OpenRouter pool in configured failover order", () => {
    const providers = createAiProviders({
      OPENROUTER_API_KEY: "openrouter-key",
      OPENROUTER_FREE_MODELS:
        " google/gemma-4-31b-it:free, z-ai/glm-5.2:free,google/gemma-4-31b-it:free ",
    })

    expect(providers.map(({ modelId }) => modelId)).toEqual([
      "google/gemma-4-31b-it:free",
    ])
  })

  it("collapses the configured OpenRouter pool into one routed request", async () => {
    mocks.generateText.mockResolvedValue(
      generated({
        providerMetadata: {
          openrouter: { usage: { cost: 0 } },
        },
      })
    )
    const providers = createAiProviders({
      OPENROUTER_API_KEY: "openrouter-key",
      OPENROUTER_FREE_MODELS:
        "google/gemma-4-31b-it:free,z-ai/glm-5.2:free,minimax/minimax-m3:free",
    })

    expect(providers).toHaveLength(1)
    await providers[0]?.complete(request)
    expect(mocks.generateText).toHaveBeenCalledOnce()
    expect(mocks.generateText.mock.calls[0]?.[0]).toMatchObject({
      model: {
        provider: "openrouter",
        modelId: "google/gemma-4-31b-it:free",
        settings: {
          models: [
            "z-ai/glm-5.2:free",
            "minimax/minimax-m3:free",
            "openrouter/free",
          ],
        },
      },
    })
  })

  it("uses the automatic free router when only the primary model is configured", async () => {
    mocks.generateText.mockResolvedValue(
      generated({
        providerMetadata: {
          openrouter: { usage: { cost: 0 } },
        },
      })
    )
    const [provider] = createAiProviders({
      OPENROUTER_API_KEY: "openrouter-key",
      OPENROUTER_FREE_MODELS: "z-ai/glm-5.2:free",
    })

    await provider.complete(request)

    expect(mocks.generateText.mock.calls[0]?.[0]).toMatchObject({
      model: {
        provider: "openrouter",
        modelId: "z-ai/glm-5.2:free",
        settings: { models: ["openrouter/free"] },
      },
    })
  })

  it("keeps each routed fallback window within OpenRouter's three-model limit", async () => {
    mocks.generateText.mockResolvedValue(
      generated({
        providerMetadata: {
          openrouter: { usage: { cost: 0 } },
        },
      })
    )
    const fallbackModelIds = OPENROUTER_FREE_MODEL_IDS.slice(1)
    const [provider] = createAiProviders({
      OPENROUTER_API_KEY: "openrouter-key",
      OPENROUTER_FREE_MODELS: OPENROUTER_FREE_MODEL_IDS.join(","),
    })

    for (let index = 0; index < 32; index += 1) {
      await provider.complete({
        ...request,
        messages: [{ role: "user", content: `Question ${index}` }],
      })
    }

    const routedFallbacks = mocks.generateText.mock.calls.map(
      ([options]) => options.model.settings.models as string[]
    )
    expect(
      routedFallbacks.every(
        (modelIds) =>
          modelIds.length <= OPENROUTER_MAX_FALLBACK_MODELS &&
          modelIds.at(-1) === "openrouter/free" &&
          modelIds
            .slice(0, -1)
            .every((modelId) => modelId !== "openrouter/free")
      )
    ).toBe(true)
    expect(
      new Set(routedFallbacks.flat().filter((id) => id !== "openrouter/free"))
    ).toEqual(new Set(fallbackModelIds))
  })

  it("prefers the model pool over the legacy single-model override", () => {
    const providers = createAiProviders({
      OPENROUTER_API_KEY: "openrouter-key",
      OPENROUTER_FREE_MODELS:
        "nvidia/nemotron-3-super-120b-a12b:free,minimax/minimax-m3:free",
      OPENROUTER_FREE_MODEL: "google/gemma-4-31b-it:free",
    })

    expect(providers.map(({ modelId }) => modelId)).toEqual([
      "nvidia/nemotron-3-super-120b-a12b:free",
    ])
  })

  it("fails closed for malformed or unapproved model pools", () => {
    for (const modelIds of [
      "z-ai/glm-5.2:free,",
      " ",
      "z-ai/glm-5.2:free,anthropic/claude-sonnet-4",
    ]) {
      expect(() =>
        createAiProviders({
          OPENROUTER_API_KEY: "openrouter-key",
          OPENROUTER_FREE_MODELS: modelIds,
        })
      ).toThrow(
        expect.objectContaining({
          code: "invalid-model",
          provider: "openrouter",
        })
      )
    }
  })

  it("keeps the legacy single-model override and fails closed otherwise", () => {
    const [provider] = createAiProviders({
      OPENROUTER_API_KEY: "openrouter-key",
      OPENROUTER_FREE_MODEL: "google/gemma-4-31b-it:free",
    })
    expect(provider.modelId).toBe("google/gemma-4-31b-it:free")

    expect(() =>
      createAiProviders({
        OPENROUTER_API_KEY: "openrouter-key",
        OPENROUTER_FREE_MODEL: "google/gemma-4-31b-it",
      })
    ).toThrow(
      expect.objectContaining({
        code: "invalid-model",
        provider: "openrouter",
      })
    )
  })

  it("validates explicit adapter configuration without environment access", () => {
    expect(() => createOpenRouterAdapter({ apiKey: "" })).toThrow(
      expect.objectContaining({ code: "not-configured" })
    )
    expect(() => createGeminiAdapter({ apiKey: " " })).toThrow(
      expect.objectContaining({ code: "not-configured" })
    )
    expect(() => createGroqAdapter({ apiKey: "" })).toThrow(
      expect.objectContaining({ code: "not-configured" })
    )
  })
})

describe("OpenRouter adapter", () => {
  it("buffers generation and surfaces the served model, usage, cost, and ID", async () => {
    mocks.generateText.mockResolvedValue(
      generated({
        providerMetadata: {
          openrouter: {
            provider: "Nebius",
            usage: { cost: 0 },
          },
        },
      })
    )
    const adapter = createOpenRouterAdapter({ apiKey: "openrouter-key" })

    await expect(adapter.complete(request)).resolves.toEqual({
      text: "A grounded answer.",
      requestedModelId: OPENROUTER_MODEL_ID,
      servedModelId: "served/model",
      finishReason: "stop",
      generationId: "generation-1",
      usage: {
        inputTokens: 12,
        outputTokens: 7,
        totalTokens: 19,
        costUsd: 0,
      },
    })

    expect(mocks.createOpenRouter).toHaveBeenCalledWith({
      apiKey: "openrouter-key",
      compatibility: "strict",
      headers: { "X-OpenRouter-Metadata": "enabled" },
    })
    expect(mocks.generateText).toHaveBeenCalledOnce()
    const options = mocks.generateText.mock.calls[0]?.[0]
    expect(options).toMatchObject({
      model: { provider: "openrouter", modelId: OPENROUTER_MODEL_ID },
      system: request.system,
      messages: request.messages,
      abortSignal: request.signal,
      maxOutputTokens: OPENROUTER_MAX_OUTPUT_TOKENS,
      maxRetries: 0,
      temperature: OPENROUTER_TEMPERATURE,
      providerOptions: { openrouter: OPENROUTER_PROVIDER_OPTIONS },
    })
    expect(options.output).toMatchObject({ name: "json" })
    expect(options).not.toHaveProperty("tools")
    expect(options).not.toHaveProperty("toolChoice")
    expect(OPENROUTER_PROVIDER_OPTIONS).toEqual({
      plugins: [],
      usage: { include: true },
      provider: {
        allow_fallbacks: true,
        require_parameters: true,
        max_price: {
          prompt: 0,
          completion: 0,
          image: 0,
          audio: 0,
          request: 0,
        },
      },
    })
    expect(OPENROUTER_PROVIDER_OPTIONS.plugins).toEqual([])
    expect(OPENROUTER_PROVIDER_OPTIONS).not.toHaveProperty("web_search_options")
  })

  it("rejects a non-zero reported cost as a typed policy failure", async () => {
    mocks.generateText.mockResolvedValue(
      generated({
        providerMetadata: {
          openrouter: { usage: { cost: 0.000_001 } },
        },
      })
    )
    const adapter = createOpenRouterAdapter({ apiKey: "openrouter-key" })

    await expect(adapter.complete(request)).rejects.toMatchObject({
      name: "AiProviderError",
      code: "policy-violation",
      provider: "openrouter",
      modelId: OPENROUTER_MODEL_ID,
      costUsd: 0.000_001,
    })
  })

  it("rejects a response whose zero cost cannot be verified", async () => {
    mocks.generateText.mockResolvedValue(generated())
    const adapter = createOpenRouterAdapter({ apiKey: "openrouter-key" })

    await expect(adapter.complete(request)).rejects.toMatchObject({
      name: "AiProviderError",
      code: "policy-violation",
      provider: "openrouter",
      modelId: OPENROUTER_MODEL_ID,
      costUsd: undefined,
    })
  })
})

describe("direct provider adapters", () => {
  it("keeps Gemini thinking minimal and disables SDK retries", async () => {
    mocks.generateText.mockResolvedValue(generated())
    const adapter = createGeminiAdapter({ apiKey: "gemini-key" })

    await expect(adapter.complete(request)).resolves.toMatchObject({
      requestedModelId: GEMINI_MODEL_ID,
      servedModelId: "served/model",
      usage: { inputTokens: 12, outputTokens: 7, totalTokens: 19 },
    })
    expect(mocks.createGoogle).toHaveBeenCalledWith({ apiKey: "gemini-key" })
    const options = mocks.generateText.mock.calls[0]?.[0]
    expect(options).toMatchObject({
      model: { provider: "google", modelId: GEMINI_MODEL_ID },
      maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
      maxRetries: 0,
      temperature: GEMINI_TEMPERATURE,
      providerOptions: { google: GEMINI_LANGUAGE_MODEL_OPTIONS },
    })
    expect(options).not.toHaveProperty("tools")
    expect(options.output).toMatchObject({ name: "json" })
  })

  it("keeps Groq reasoning hidden and preserves the zero temperature change", async () => {
    mocks.generateText.mockResolvedValue(generated())
    const adapter = createGroqAdapter({ apiKey: "groq-key" })

    await expect(adapter.complete(request)).resolves.toMatchObject({
      requestedModelId: GROQ_MODEL_ID,
      servedModelId: "served/model",
      generationId: "generation-1",
    })
    expect(mocks.createGroq).toHaveBeenCalledWith({ apiKey: "groq-key" })
    const options = mocks.generateText.mock.calls[0]?.[0]
    expect(options).toMatchObject({
      model: { provider: "groq", modelId: GROQ_MODEL_ID },
      maxOutputTokens: GROQ_MAX_OUTPUT_TOKENS,
      maxRetries: 0,
      temperature: GROQ_TEMPERATURE,
      providerOptions: { groq: GROQ_LANGUAGE_MODEL_OPTIONS },
    })
    expect(GROQ_TEMPERATURE).toBe(0)
    expect(options).not.toHaveProperty("tools")
    expect(options.output).toMatchObject({ name: "json" })
  })
})

describe("provider errors", () => {
  it("normalizes provider failures while preserving cooldown metadata", async () => {
    const providerError = Object.assign(new Error("quota exhausted"), {
      statusCode: 429,
      responseHeaders: { "retry-after": "42" },
      data: { error: { code: "rate_limit" } },
      responseBody: '{"error":"rate_limit"}',
    })
    mocks.generateText.mockRejectedValue(providerError)
    const adapter = createGeminiAdapter({ apiKey: "gemini-key" })

    const error = await adapter.complete(request).catch((value) => value)
    expect(error).toBeInstanceOf(AiProviderError)
    expect(error).toMatchObject({
      name: "AiProviderError",
      code: "rate-limited",
      provider: "gemini",
      modelId: GEMINI_MODEL_ID,
      statusCode: 429,
      responseHeaders: { "retry-after": "42" },
      data: { error: { code: "rate_limit" } },
      responseBody: '{"error":"rate_limit"}',
      cause: providerError,
    })
  })

  it.each([
    [401, "authentication"],
    [403, "authentication"],
    [408, "provider-unavailable"],
    [503, "provider-unavailable"],
    [400, "request-failed"],
  ] as const)("maps HTTP %i to %s", async (statusCode, code) => {
    mocks.generateText.mockRejectedValue(
      Object.assign(new Error("request failed"), { statusCode })
    )
    const adapter = createGroqAdapter({ apiKey: "groq-key" })

    await expect(adapter.complete(request)).rejects.toMatchObject({
      code,
      statusCode,
      provider: "groq",
    })
  })

  it("recognizes a provider rate-limit code even when the HTTP status is 413", async () => {
    mocks.generateText.mockRejectedValue(
      Object.assign(new Error("tokens per minute exceeded"), {
        statusCode: 413,
        data: { error: { code: "rate_limit_exceeded" } },
      })
    )
    const adapter = createGroqAdapter({ apiKey: "groq-key" })

    await expect(adapter.complete(request)).rejects.toMatchObject({
      code: "rate-limited",
      statusCode: 413,
      provider: "groq",
    })
  })

  it("treats Groq's bare HTTP 413 quota response as rate limited", async () => {
    mocks.generateText.mockRejectedValue(
      Object.assign(new Error("tokens per minute exceeded"), {
        statusCode: 413,
      })
    )
    const adapter = createGroqAdapter({ apiKey: "groq-key" })

    await expect(adapter.complete(request)).rejects.toMatchObject({
      code: "rate-limited",
      statusCode: 413,
      provider: "groq",
    })
  })

  it("normalizes aborted requests", async () => {
    const controller = new AbortController()
    controller.abort()
    mocks.generateText.mockRejectedValue(new Error("cancelled"))
    const adapter = createGeminiAdapter({ apiKey: "gemini-key" })

    await expect(
      adapter.complete({ ...request, signal: controller.signal })
    ).rejects.toMatchObject({ code: "aborted", provider: "gemini" })
  })

  it("turns empty buffered output into a typed provider failure", async () => {
    mocks.generateText.mockResolvedValue(generated({ text: " \n " }))
    const adapter = createGroqAdapter({ apiKey: "groq-key" })

    await expect(adapter.complete(request)).rejects.toMatchObject({
      code: "empty-response",
      provider: "groq",
      modelId: GROQ_MODEL_ID,
    })
  })
})
