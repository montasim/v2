import { safeValidateUIMessages } from "ai"
import type { UIMessage } from "ai"
import { z } from "zod"
import type { PortfolioCitation } from "@/features/chat/domain/portfolio-citations"

export const MAX_CHAT_MESSAGES = 12
export const MAX_CHAT_MESSAGE_CHARACTERS = 500
export const MAX_CHAT_HISTORY_CHARACTERS = 6_000
export const MAX_CHAT_ID_CHARACTERS = 120

export type ChatProviderName = "openrouter" | "gemini" | "groq"

export interface PortfolioMessageMetadata {
  source?: string
  citations?: readonly PortfolioCitation[]
  provider?: ChatProviderName
  requestedModel?: string
  servedModel?: string
  /** @deprecated Prefer requestedModel and servedModel for precise provenance. */
  model?: string
  usedFallback?: boolean
  responseKind?: "exact" | "generated" | "handoff"
  fallbackDepth?: number
  contactAction?: PortfolioContactAction
}

export type PortfolioContactAction = "hire" | "project" | "funding" | "general"

export type PortfolioUIMessage = UIMessage<PortfolioMessageMetadata>

const chatEnvelopeSchema = z.object({
  id: z.string().trim().min(1).max(MAX_CHAT_ID_CHARACTERS).optional(),
  messages: z.unknown(),
  trigger: z.enum(["submit-message", "regenerate-message"]).optional(),
  messageId: z.string().trim().min(1).max(MAX_CHAT_ID_CHARACTERS).nullish(),
})

export class InvalidChatRequestError extends Error {}

export async function validateChatRequest(input: unknown): Promise<{
  conversationId: string
  messages: PortfolioUIMessage[]
  question: string
  clientMessageId?: string
}> {
  const envelope = chatEnvelopeSchema.safeParse(input)
  if (!envelope.success) {
    throw new InvalidChatRequestError("The chat request is invalid.")
  }

  const validated = await safeValidateUIMessages<PortfolioUIMessage>({
    messages: envelope.data.messages,
  })
  if (!validated.success) {
    throw new InvalidChatRequestError("The chat messages are invalid.")
  }

  const messages = validated.data
    .slice(-MAX_CHAT_MESSAGES)
    .flatMap((message) => {
      if (message.role === "system") {
        throw new InvalidChatRequestError("System messages are not accepted.")
      }
      // Assistant text supplied by a browser is presentation state, not trusted
      // conversation evidence. Only server-recorded answers can be trusted.
      if (message.role !== "user") return []
      const textParts = message.parts.filter((part) => part.type === "text")
      if (textParts.length !== message.parts.length) {
        throw new InvalidChatRequestError("Only text messages are accepted.")
      }
      if (!textParts.length) return []

      return [
        {
          id: message.id,
          role: "user" as const,
          parts: textParts.map((part) => ({
            type: "text" as const,
            text: part.text,
          })),
        },
      ]
    })

  let historyCharacters = messages.reduce(
    (total, message) =>
      total + message.parts.reduce((sum, part) => sum + part.text.length, 0),
    0
  )

  while (
    historyCharacters > MAX_CHAT_HISTORY_CHARACTERS &&
    messages.length > 1
  ) {
    const oldestMessage = messages.shift()
    if (!oldestMessage) break
    historyCharacters -= oldestMessage.parts.reduce(
      (sum, part) => sum + part.text.length,
      0
    )
  }

  const lastMessage = messages.at(-1)
  if (
    lastMessage?.id !== undefined &&
    (!lastMessage.id.trim() || lastMessage.id.length > MAX_CHAT_ID_CHARACTERS)
  ) {
    throw new InvalidChatRequestError("The client message ID is invalid.")
  }
  const question = lastMessage?.parts
    .map((part) => part.text)
    .join("")
    .trim()
  if (
    lastMessage?.role !== "user" ||
    !question ||
    question.length > MAX_CHAT_MESSAGE_CHARACTERS
  ) {
    throw new InvalidChatRequestError(
      `The latest question must be between 1 and ${MAX_CHAT_MESSAGE_CHARACTERS} characters.`
    )
  }

  return {
    conversationId: envelope.data.id ?? crypto.randomUUID(),
    messages,
    question,
    clientMessageId: lastMessage.id.trim(),
  }
}
