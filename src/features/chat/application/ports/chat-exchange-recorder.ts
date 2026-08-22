import type { ChatProviderName } from "@/features/chat/domain/chat"

export interface ChatExchange {
  conversationId: string
  question: string
  answer: string
  source: string
  provider: ChatProviderName
  model: string
  usedFallback: boolean
}

export interface ChatExchangeRecorder {
  record: (exchange: ChatExchange) => Promise<void>
}
