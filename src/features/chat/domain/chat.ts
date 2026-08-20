import { safeValidateUIMessages } from "ai"
import type { UIMessage } from "ai"
import { z } from "zod"
import type { PortfolioCitation } from "@/features/chat/domain/portfolio-citations"

export const MAX_CHAT_MESSAGES = 12
export const MAX_CHAT_MESSAGE_CHARACTERS = 500
export const MAX_CHAT_HISTORY_CHARACTERS = 6_000

export type ChatProviderName = "gemini" | "groq"

export interface PortfolioMessageMetadata {
  source?: string
  citations?: readonly PortfolioCitation[]
  provider?: ChatProviderName
  model?: string
  usedFallback?: boolean
}

export type PortfolioUIMessage = UIMessage<PortfolioMessageMetadata>

const chatEnvelopeSchema = z.object({
  id: z.string().max(120).optional(),
  messages: z.unknown(),
  trigger: z.enum(["submit-message", "regenerate-message"]).optional(),
  messageId: z.string().max(120).nullish(),
})

export class InvalidChatRequestError extends Error {}

export async function validateChatRequest(
  input: unknown
): Promise<{ messages: PortfolioUIMessage[]; question: string }> {
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
      const textParts = message.parts.filter((part) => part.type === "text")
      if (
        message.role === "user" &&
        textParts.length !== message.parts.length
      ) {
        throw new InvalidChatRequestError("Only text messages are accepted.")
      }
      if (!textParts.length) return []

      return [
        {
          id: message.id,
          role: message.role,
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

  while (messages.length > 1 && messages[0]?.role === "assistant")
    messages.shift()

  const lastMessage = messages.at(-1)
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

  return { messages, question }
}
