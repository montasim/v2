import type { ModelMessage, UIMessageChunk } from "ai"

import type {
  ChatProviderName,
  PortfolioMessageMetadata,
} from "@/features/chat/domain/chat"

export interface AiStreamRequest {
  system: string
  messages: ModelMessage[]
  signal?: AbortSignal
}

export interface AiProviderAdapter {
  readonly provider: ChatProviderName
  readonly modelId: string
  stream: (
    request: AiStreamRequest
  ) => Promise<ReadableStream<UIMessageChunk<PortfolioMessageMetadata>>>
}
