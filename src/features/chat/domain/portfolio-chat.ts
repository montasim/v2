import type { PortfolioCitation } from "@/features/chat/domain/portfolio-citations"
import type {
  ChatProviderName,
  PortfolioContactAction,
} from "@/features/chat/domain/chat"

export const PORTFOLIO_CHAT_POLICY_VERSION =
  "portfolio-chat/focused-evidence-v2" as const

export const PORTFOLIO_CHAT_UNAVAILABLE_MESSAGE =
  "I couldn't prepare a fully verified answer right now. Please try again shortly, explore Montasim's published portfolio, or contact him directly."

export type NonEmptyReadonlyArray<T> = readonly [T, ...T[]]

export interface PortfolioChatInput {
  conversationId: string
  clientMessageId?: string
  question: string
}

export interface ProviderAttemptTrace {
  stage?: "generation" | "review"
  provider: ChatProviderName
  requestedModel: string
  servedModel?: string
  outcome: "accepted" | "failed" | "rejected" | "skipped"
  reason?: string
  latencyMs: number
  inputTokens?: number
  outputTokens?: number
  costUsd?: number
  generationId?: string
  finishReason?: string
}

interface PortfolioReplyBase {
  messageId: string
  text: string
  source: string
  evidenceIds: readonly string[]
  citations: readonly PortfolioCitation[]
}

export interface SupportedPortfolioReply extends PortfolioReplyBase {
  kind: "exact" | "generated"
  citations: NonEmptyReadonlyArray<PortfolioCitation>
  evidenceIds: NonEmptyReadonlyArray<string>
  contactAction?: "hire" | "project" | "funding"
  provider?: ChatProviderName
  requestedModel?: string
  servedModel?: string
  fallbackDepth: number
  attempts: readonly ProviderAttemptTrace[]
}

export interface PortfolioHandoffReply extends PortfolioReplyBase {
  kind: "handoff"
  citations: readonly []
  evidenceIds: readonly []
  contactAction: PortfolioContactAction
  reason:
    | "contact-intent"
    | "insufficient-evidence"
    | "unsafe-question"
    | "provider-unavailable"
  fallbackDepth: number
  attempts: readonly ProviderAttemptTrace[]
}

export type PortfolioChatReply = SupportedPortfolioReply | PortfolioHandoffReply

export interface PortfolioChat {
  answer: (
    input: PortfolioChatInput,
    context: {
      visitorHash?: string
      signal?: AbortSignal
    }
  ) => Promise<PortfolioChatReply>
}
