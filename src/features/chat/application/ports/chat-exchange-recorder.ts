import type { PortfolioChatReply } from "@/features/chat/domain/portfolio-chat"
import type { ChatKnowledgeScope } from "@/features/chat/domain/portfolio-chat-policy"

export type { ChatKnowledgeScope } from "@/features/chat/domain/portfolio-chat-policy"

export interface ChatExchange {
  conversationId: string
  clientMessageId?: string
  question: string
  reply: PortfolioChatReply
  latencyMs: number
  retrievalMetadata?: Record<string, unknown>
  policyVersion: string
  knowledgeHash: string
}

export interface TrustedChatExchange {
  question: string
  answer: string
}

export interface ChatReplyLookup {
  conversationId: string
  clientMessageId: string
  question: string
  scope: ChatKnowledgeScope
}

export interface ChatExchangeRecorder {
  record: (exchange: ChatExchange) => Promise<void>
  findLatest?: (
    conversationId: string,
    scope: ChatKnowledgeScope
  ) => Promise<TrustedChatExchange | null>
  findReply?: (lookup: ChatReplyLookup) => Promise<PortfolioChatReply | null>
}
