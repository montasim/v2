import { createUIMessageStreamResponse } from "ai"
import type { UIMessageChunk } from "ai"

import type { ChatRequestLimiter } from "@/features/chat/application/ports/chat-request-limiter"
import type { ChatQuestionRecorder } from "@/features/chat/application/ports/chat-question-recorder"
import type { PortfolioChat } from "@/features/chat/domain/portfolio-chat"
import {
  ChatDynamicRateLimitError,
  createPortfolioChat,
} from "@/features/chat/application/portfolio-chat"
import {
  InvalidChatRequestError,
  validateChatRequest,
} from "@/features/chat/domain/chat"
import type { PortfolioMessageMetadata } from "@/features/chat/domain/chat"
import {
  CHAT_MODERATION_ERROR,
  getChatModerationError,
} from "@/features/chat/domain/chat-moderation"
import { createAiProviders } from "@/features/chat/infrastructure/ai/providers.server"
import {
  DatabaseChatRequestLimiter,
  getChatVisitorHash,
} from "@/features/chat/infrastructure/chat-rate-limit.server"
import { DatabaseChatExchangeRecorder } from "@/features/chat/infrastructure/chat-exchanges.server"
import { DatabaseChatQuestionRecorder } from "@/features/chat/infrastructure/chat-questions.server"
import { DatabaseChatRequestCoordinator } from "@/features/chat/infrastructure/chat-request-coordinator.server"
import { DatabaseProviderCircuitStore } from "@/features/chat/infrastructure/provider-circuit.server"
import { getPortfolioExactAnswerCatalog } from "@/features/chat/knowledge/exact-answer-catalog"
import { getCompiledPortfolioKnowledge } from "@/features/chat/knowledge/portfolio-knowledge.server"
import { redactChatText } from "@/features/chat/domain/chat-redaction"
import { logger } from "@/lib/logger.server"

const MAX_CHAT_BODY_BYTES = 16_000
// Netlify synchronous functions allow 60 seconds. Keep five seconds to persist,
// serialize, and deliver either the validated answer or a retryable failure.
export const CHAT_HTTP_DEADLINE_MS = 55_000
const TEN_MINUTES_MS = 10 * 60 * 1_000
const BROAD_REQUEST_LIMIT = 60

interface ChatHttpDependencies {
  chat?: PortfolioChat
  limiter?: ChatRequestLimiter
  questionRecorder?: ChatQuestionRecorder
  deadlineMs?: number
}

export async function handlePortfolioChatRequest(
  request: Request,
  dependencies: ChatHttpDependencies = {}
) {
  const signal = deadlineSignal(
    request.signal,
    dependencies.deadlineMs ?? CHAT_HTTP_DEADLINE_MS
  )
  if (!isSameOrigin(request)) {
    return errorResponse("Cross-site requests are not allowed.", 403)
  }
  if (!isJsonContentType(request.headers.get("content-type"))) {
    return errorResponse("The chat request must use JSON.", 415)
  }
  const declaredSize = Number(request.headers.get("content-length") ?? "0")
  if (Number.isFinite(declaredSize) && declaredSize > MAX_CHAT_BODY_BYTES) {
    return errorResponse("The chat request is too large.", 413)
  }

  try {
    const body = await readLimitedBody(request, MAX_CHAT_BODY_BYTES, signal)
    const validated = await validateChatRequest(JSON.parse(body) as unknown)
    const questionRecorder =
      dependencies.questionRecorder ?? new DatabaseChatQuestionRecorder()
    await withSignal(
      questionRecorder.recordQuestion({
        conversationId: validated.conversationId,
        clientMessageId: validated.clientMessageId,
        question: redactChatText(validated.question).trim(),
      }),
      signal
    )
    if (await getChatModerationError(validated.question)) {
      return errorResponse(CHAT_MODERATION_ERROR, 400)
    }
    const limiter = dependencies.limiter ?? new DatabaseChatRequestLimiter()
    const subjectHash = getChatVisitorHash(request)
    const broadLimit = await withSignal(
      limiter.consume({
        scope: "all-10m",
        subjectHash,
        limit: BROAD_REQUEST_LIMIT,
        windowMs: TEN_MINUTES_MS,
      }),
      signal
    )
    if (!broadLimit.allowed)
      return rateLimitResponse(broadLimit.retryAfterSeconds)

    const chat = dependencies.chat ?? createDefaultPortfolioChat()
    const reply = await withSignal(
      chat.answer(
        {
          conversationId: validated.conversationId,
          clientMessageId: validated.clientMessageId,
          question: validated.question,
        },
        {
          visitorHash: subjectHash,
          signal,
        }
      ),
      signal
    )
    return createReplyResponse(reply)
  } catch (error) {
    if (error instanceof ChatBodyTooLargeError) {
      return errorResponse("The chat request is too large.", 413)
    }
    if (error instanceof ChatDynamicRateLimitError) {
      return rateLimitResponse(error.retryAfterSeconds)
    }
    if (
      error instanceof InvalidChatRequestError ||
      error instanceof SyntaxError
    ) {
      return errorResponse("The chat request is invalid.", 400)
    }
    logger.error(
      { errorType: error instanceof Error ? error.name : "UnknownError" },
      "Portfolio chat request failed"
    )
    return errorResponse("The assistant is temporarily unavailable.", 503)
  }
}

export function createDefaultPortfolioChat() {
  const knowledge = getCompiledPortfolioKnowledge()
  return createPortfolioChat({
    knowledge,
    exactAnswers: getPortfolioExactAnswerCatalog(),
    providers: createAiProviders(),
    recorder: new DatabaseChatExchangeRecorder(),
    requestCoordinator: new DatabaseChatRequestCoordinator(),
    requestLimiter: new DatabaseChatRequestLimiter(),
    providerCircuit: new DatabaseProviderCircuitStore(),
  })
}

function createReplyResponse(
  reply: Awaited<ReturnType<PortfolioChat["answer"]>>
) {
  const metadata = {
    source: reply.source,
    citations: reply.citations,
    provider: reply.kind === "generated" ? reply.provider : undefined,
    requestedModel:
      reply.kind === "generated" ? reply.requestedModel : undefined,
    servedModel: reply.kind === "generated" ? reply.servedModel : undefined,
    model:
      reply.kind === "generated"
        ? (reply.servedModel ?? reply.requestedModel)
        : undefined,
    usedFallback: reply.fallbackDepth > 0,
    fallbackDepth: reply.fallbackDepth,
    responseKind: reply.kind,
    contactAction: reply.contactAction,
  } satisfies PortfolioMessageMetadata
  const stream = new ReadableStream<UIMessageChunk<PortfolioMessageMetadata>>({
    start(controller) {
      controller.enqueue({
        type: "start",
        messageId: reply.messageId,
        messageMetadata: metadata,
      })
      controller.enqueue({ type: "text-start", id: "answer" })
      controller.enqueue({
        type: "text-delta",
        id: "answer",
        delta: reply.text,
      })
      controller.enqueue({ type: "text-end", id: "answer" })
      controller.enqueue({ type: "finish", messageMetadata: metadata })
      controller.close()
    },
  })
  const response = createUIMessageStreamResponse({ stream })
  response.headers.set("Cache-Control", "no-store")
  response.headers.set("X-Content-Type-Options", "nosniff")
  return response
}

function isSameOrigin(request: Request) {
  const fetchSite = request.headers.get("sec-fetch-site")
  if (fetchSite && !["same-origin", "same-site", "none"].includes(fetchSite))
    return false

  const origin = request.headers.get("origin")
  if (origin) return origin === new URL(request.url).origin
  return process.env.NODE_ENV !== "production" || fetchSite === "same-origin"
}

function errorResponse(error: string, status: number) {
  return Response.json(
    { error },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    }
  )
}

function rateLimitResponse(retryAfterSeconds: number) {
  return Response.json(
    { error: "Too many requests. Please try again shortly." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    }
  )
}

function deadlineSignal(parent: AbortSignal, timeoutMs: number) {
  return AbortSignal.any([parent, AbortSignal.timeout(timeoutMs)])
}

function withSignal<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) return Promise.reject(signal.reason)

  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(signal.reason)
    signal.addEventListener("abort", onAbort, { once: true })
    promise.then(
      (value) => {
        signal.removeEventListener("abort", onAbort)
        resolve(value)
      },
      (error: unknown) => {
        signal.removeEventListener("abort", onAbort)
        reject(error)
      }
    )
  })
}

function isJsonContentType(value: string | null) {
  return value?.split(";", 1)[0]?.trim().toLowerCase() === "application/json"
}

class ChatBodyTooLargeError extends Error {}

async function readLimitedBody(
  request: Request,
  maximumBytes: number,
  signal: AbortSignal
) {
  if (!request.body) return ""
  const reader = request.body.getReader()
  const decoder = new TextDecoder()
  let bytes = 0
  let body = ""

  try {
    for (;;) {
      const { done, value } = await withSignal(reader.read(), signal)
      if (done) break
      bytes += value.byteLength
      if (bytes > maximumBytes) {
        await reader.cancel("chat body too large")
        throw new ChatBodyTooLargeError()
      }
      body += decoder.decode(value, { stream: true })
    }
    return body + decoder.decode()
  } finally {
    reader.releaseLock()
  }
}
