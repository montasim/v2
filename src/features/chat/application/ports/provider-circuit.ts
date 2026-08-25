import type { ChatProviderName } from "@/features/chat/domain/chat"

export interface ProviderCircuitStore {
  canAttempt: (provider: ChatProviderName, now?: Date) => Promise<boolean>
  recordSuccess: (provider: ChatProviderName) => Promise<void>
  recordFailure: (
    provider: ChatProviderName,
    failure: { reason: string; retryAfterSeconds?: number; costUsd?: number },
    now?: Date
  ) => Promise<void>
}
