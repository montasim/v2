import type { ModelMessage } from "ai"

import type { ChatProviderName } from "@/features/chat/domain/chat"

export interface AiCompletionRequest {
  system: string
  messages: ModelMessage[]
  signal?: AbortSignal
}

export interface AiCompletionUsage {
  inputTokens?: number
  outputTokens?: number
  totalTokens?: number
  costUsd?: number
}

export interface AiCompletionResult {
  text: string
  requestedModelId: string
  servedModelId?: string
  finishReason?: string
  generationId?: string
  usage?: AiCompletionUsage
}

export interface AiProviderRoute {
  readonly provider: ChatProviderName
  readonly modelId: string
}

export interface AiProviderAdapter extends AiProviderRoute {
  /** False when this configured provider can review but cannot accept the full knowledge packet. */
  readonly supportsFullContextGeneration?: boolean
  complete: (request: AiCompletionRequest) => Promise<AiCompletionResult>
}
