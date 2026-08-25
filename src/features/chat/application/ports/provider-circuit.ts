import type { AiProviderRoute } from "@/features/chat/application/ports/ai-provider"

export interface ProviderCircuitStore {
  canAttempt: (route: AiProviderRoute, now?: Date) => Promise<boolean>
  recordSuccess: (route: AiProviderRoute) => Promise<void>
  recordFailure: (
    route: AiProviderRoute,
    failure: { reason: string; retryAfterSeconds?: number; costUsd?: number },
    now?: Date
  ) => Promise<void>
}
