export interface CoordinatedChatRequest<T> {
  conversationId: string
  clientMessageId: string
  signal?: AbortSignal
  findCompleted: () => Promise<T | null>
  work: () => Promise<T>
}

/**
 * Runs one durably published chat request per client message key.
 *
 * `work` must not resolve until its result can be returned by `findCompleted`.
 * This lets another process observe the accepted result if the lease owner exits
 * after publishing it but before marking the lease complete.
 */
export interface ChatRequestCoordinator {
  run: <T>(request: CoordinatedChatRequest<T>) => Promise<T>
}

export class ChatRequestPendingError extends Error {
  readonly code = "chat-request-pending"

  constructor() {
    super("The matching chat request is still being processed.")
    this.name = "ChatRequestPendingError"
  }
}
