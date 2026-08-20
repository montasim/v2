import { convertToModelMessages, createUIMessageStreamResponse } from "ai"
import type { UIMessageChunk } from "ai"

import type { AiProviderAdapter } from "@/features/chat/application/ports/ai-provider"
import { validateChatRequest } from "@/features/chat/domain/chat"
import type { PortfolioMessageMetadata } from "@/features/chat/domain/chat"
import {
  buildAssistantInstruction,
  selectPortfolioEvidence,
} from "@/features/chat/domain/portfolio-evidence"
import { createAiProviders } from "@/features/chat/infrastructure/ai/providers.server"
import { logger } from "@/lib/logger.server"

export async function createPortfolioAssistantResponse(
  input: unknown,
  signal?: AbortSignal,
  providers: readonly AiProviderAdapter[] = createAiProviders()
) {
  const { messages, question } = await validateChatRequest(input)
  const evidence = selectPortfolioEvidence(question)
  const modelMessages = await convertToModelMessages(messages)
  const request = {
    system: buildAssistantInstruction(evidence),
    messages: modelMessages,
    signal,
  }

  const stream = new ReadableStream<UIMessageChunk<PortfolioMessageMetadata>>({
    async start(controller) {
      for (const [index, provider] of providers.entries()) {
        try {
          const providerStream = await provider.stream(request)
          await pipeProviderStream(controller, providerStream, {
            source: evidence.source,
            citations: evidence.citations,
            provider: provider.provider,
            model: provider.modelId,
            usedFallback: index > 0,
          })
          logger.info(
            {
              provider: provider.provider,
              model: provider.modelId,
              usedFallback: index > 0,
            },
            "Portfolio assistant response completed"
          )
          controller.close()
          return
        } catch (error) {
          logger.warn(
            {
              provider: provider.provider,
              model: provider.modelId,
              errorType: getErrorType(error),
            },
            "Portfolio assistant provider failed"
          )
          if (index === providers.length - 1) {
            controller.enqueue({
              type: "error",
              errorText:
                "The assistant is temporarily unavailable. Please try again shortly.",
            })
            controller.close()
            return
          }
        }
      }
    },
  })

  return createUIMessageStreamResponse({ stream })
}

async function pipeProviderStream(
  controller: ReadableStreamDefaultController<
    UIMessageChunk<PortfolioMessageMetadata>
  >,
  stream: ReadableStream<UIMessageChunk<PortfolioMessageMetadata>>,
  metadata: PortfolioMessageMetadata
) {
  const reader = stream.getReader()
  let visibleText = false
  const buffered: UIMessageChunk<PortfolioMessageMetadata>[] = []

  try {
    let result = await reader.read()
    while (!result.done) {
      const chunk = withMetadata(result.value, metadata)
      const beginsText =
        chunk.type === "text-start" || chunk.type === "text-delta"
      if (!visibleText && !beginsText) {
        buffered.push(chunk)
        result = await reader.read()
        continue
      }
      if (!visibleText) {
        visibleText = true
        for (const pending of buffered) controller.enqueue(pending)
      }
      controller.enqueue(chunk)
      result = await reader.read()
    }

    if (!visibleText) throw new Error("The provider returned no answer.")
  } catch (error) {
    if (visibleText) {
      controller.enqueue({
        type: "error",
        errorText: "The response was interrupted. Please try again.",
      })
      return
    }
    throw error
  } finally {
    try {
      reader.releaseLock()
    } catch {
      // Some runtimes reject releasing a reader after its stream errors.
    }
  }
}

function withMetadata(
  chunk: UIMessageChunk<PortfolioMessageMetadata>,
  metadata: PortfolioMessageMetadata
): UIMessageChunk<PortfolioMessageMetadata> {
  if (chunk.type === "start") return { ...chunk, messageMetadata: metadata }
  if (chunk.type === "finish") return { ...chunk, messageMetadata: metadata }
  return chunk
}

function getErrorType(error: unknown) {
  return error instanceof Error ? error.name : "UnknownError"
}
