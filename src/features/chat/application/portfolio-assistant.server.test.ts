import type { UIMessageChunk } from "ai"
import { describe, expect, it, vi } from "vitest"

import type { AiProviderAdapter } from "@/features/chat/application/ports/ai-provider"
import { createPortfolioAssistantResponse } from "@/features/chat/application/portfolio-assistant.server"
import type { PortfolioMessageMetadata } from "@/features/chat/domain/chat"

function stream(...chunks: UIMessageChunk<PortfolioMessageMetadata>[]) {
  return new ReadableStream<UIMessageChunk<PortfolioMessageMetadata>>({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(chunk))
      controller.close()
    },
  })
}

function provider(
  name: "gemini" | "groq",
  result: () => Promise<
    ReadableStream<UIMessageChunk<PortfolioMessageMetadata>>
  >
): AiProviderAdapter {
  return { provider: name, modelId: `${name}-model`, stream: vi.fn(result) }
}

const request = {
  messages: [
    {
      id: "question",
      role: "user" as const,
      parts: [
        { type: "text" as const, text: "What are his strongest skills?" },
      ],
    },
  ],
}

describe("createPortfolioAssistantResponse", () => {
  it("falls back when the primary provider fails before visible text", async () => {
    const primary = provider("gemini", async () => {
      throw new Error("quota")
    })
    const fallback = provider("groq", async () =>
      stream(
        { type: "start", messageId: "answer" },
        { type: "text-start", id: "text" },
        { type: "text-delta", id: "text", delta: "A grounded answer." },
        { type: "text-end", id: "text" },
        { type: "finish" }
      )
    )

    const response = await createPortfolioAssistantResponse(
      request,
      undefined,
      [primary, fallback]
    )
    const body = await response.text()

    expect(primary.stream).toHaveBeenCalledOnce()
    expect(fallback.stream).toHaveBeenCalledOnce()
    expect(body).toContain("A grounded answer.")
    expect(body).toContain('"usedFallback":true')
    expect(body).toContain('"provider":"groq"')
  })

  it("does not call fallback after the primary emits visible text", async () => {
    const primary = provider("gemini", async () => {
      const chunks: UIMessageChunk<PortfolioMessageMetadata>[] = [
        { type: "start", messageId: "answer" },
        { type: "text-start", id: "text" },
        { type: "text-delta", id: "text", delta: "Partial" },
      ]
      let index = 0
      return new ReadableStream({
        pull(controller) {
          if (index < chunks.length) {
            controller.enqueue(chunks[index])
            index += 1
            return
          }
          controller.error(new Error("connection lost"))
        },
      })
    })
    const fallback = provider("groq", async () => stream())

    const response = await createPortfolioAssistantResponse(
      request,
      undefined,
      [primary, fallback]
    )
    const body = await response.text()

    expect(body).toContain("Partial")
    expect(body).toContain("The response was interrupted")
    expect(fallback.stream).not.toHaveBeenCalled()
  })
})
