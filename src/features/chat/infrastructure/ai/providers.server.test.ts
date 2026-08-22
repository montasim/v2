import type { UIMessageChunk } from "ai"
import type * as AiSdk from "ai"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  createAiProviders,
  GEMINI_LANGUAGE_MODEL_OPTIONS,
  GROQ_LANGUAGE_MODEL_OPTIONS,
  GROQ_MAX_OUTPUT_TOKENS,
} from "@/features/chat/infrastructure/ai/providers.server"

const { streamTextMock } = vi.hoisted(() => ({ streamTextMock: vi.fn() }))

vi.mock("ai", async (importOriginal) => ({
  ...(await importOriginal<typeof AiSdk>()),
  streamText: streamTextMock,
}))

afterEach(() => {
  vi.unstubAllEnvs()
  streamTextMock.mockReset()
})

describe("Gemini provider configuration", () => {
  it("uses minimal thinking without returning internal thoughts", () => {
    expect(GEMINI_LANGUAGE_MODEL_OPTIONS).toEqual({
      thinkingConfig: {
        thinkingLevel: "minimal",
        includeThoughts: false,
      },
    })
  })

  it("keeps Groq reasoning concise and reserves enough room to finish", () => {
    expect(GROQ_LANGUAGE_MODEL_OPTIONS).toEqual({
      reasoningEffort: "low",
      reasoningFormat: "hidden",
    })
    expect(GROQ_MAX_OUTPUT_TOKENS).toBe(700)
  })

  it("preserves a provider error delivered through the UI message stream", async () => {
    const providerError = Object.assign(new Error("quota exhausted"), {
      statusCode: 429,
      data: {
        error: {
          details: [
            {
              "@type": "type.googleapis.com/google.rpc.RetryInfo",
              retryDelay: "42s",
            },
          ],
        },
      },
    })
    streamTextMock.mockReturnValue({
      toUIMessageStream: ({
        onError = () => "An error occurred.",
      }: {
        onError?: (error: unknown) => string
      }) =>
        new ReadableStream<UIMessageChunk>({
          start(controller) {
            controller.enqueue({
              type: "error",
              errorText: onError(providerError),
            })
            controller.close()
          },
        }),
    })
    vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "test-key")
    const [gemini] = createAiProviders()
    const stream = await gemini.stream({ system: "Evidence", messages: [] })
    const reader = stream.getReader()

    await expect(reader.read()).rejects.toBe(providerError)
  })
})
