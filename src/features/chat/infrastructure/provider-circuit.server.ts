import { eq, sql } from "drizzle-orm"

import type { ProviderCircuitStore } from "@/features/chat/application/ports/provider-circuit"
import type { ChatProviderName } from "@/features/chat/domain/chat"
import { assistantProviderStates } from "@/db/schema"
import { getDatabase } from "@/db/client.server"

const DEFAULT_COOLDOWN_SECONDS = 5 * 60
const POLICY_COOLDOWN_SECONDS = 365 * 24 * 60 * 60

export class DatabaseProviderCircuitStore implements ProviderCircuitStore {
  async canAttempt(provider: ChatProviderName, now = new Date()) {
    const rows = await getDatabase()
      .select({
        disabledUntil: assistantProviderStates.disabledUntil,
        reason: assistantProviderStates.reason,
      })
      .from(assistantProviderStates)
      .where(eq(assistantProviderStates.provider, provider))
      .limit(1)
    const state = rows.at(0)
    if (state?.reason === "policy-violation") return false
    return !state?.disabledUntil || state.disabledUntil <= now
  }

  async recordSuccess(provider: ChatProviderName) {
    await getDatabase()
      .insert(assistantProviderStates)
      .values({
        provider,
        disabledUntil: null,
        reason: null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: assistantProviderStates.provider,
        set: { disabledUntil: null, reason: null, updatedAt: new Date() },
        setWhere: sql`${assistantProviderStates.reason} is distinct from 'policy-violation'`,
      })
  }

  async recordFailure(
    provider: ChatProviderName,
    failure: { reason: string; retryAfterSeconds?: number; costUsd?: number },
    now = new Date()
  ) {
    const duration =
      failure.reason === "policy-violation"
        ? POLICY_COOLDOWN_SECONDS
        : Math.max(1, failure.retryAfterSeconds ?? DEFAULT_COOLDOWN_SECONDS)
    const disabledUntil = new Date(now.getTime() + duration * 1_000)
    await getDatabase()
      .insert(assistantProviderStates)
      .values({
        provider,
        disabledUntil,
        reason: failure.reason,
        lastCostUsd:
          failure.costUsd === undefined ? null : String(failure.costUsd),
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: assistantProviderStates.provider,
        set: {
          disabledUntil,
          reason: failure.reason,
          lastCostUsd:
            failure.costUsd === undefined ? null : String(failure.costUsd),
          updatedAt: now,
        },
        ...(failure.reason === "policy-violation"
          ? {}
          : {
              setWhere: sql`${assistantProviderStates.reason} is distinct from 'policy-violation'`,
            }),
      })
  }
}

export class InMemoryProviderCircuitStore implements ProviderCircuitStore {
  private readonly states = new Map<
    ChatProviderName,
    { disabledUntil: Date; reason: string }
  >()

  async canAttempt(provider: ChatProviderName, now = new Date()) {
    const state = this.states.get(provider)
    if (state?.reason === "policy-violation") return false
    return !state || state.disabledUntil <= now
  }

  async recordSuccess(provider: ChatProviderName) {
    if (this.states.get(provider)?.reason === "policy-violation") return
    this.states.delete(provider)
  }

  async recordFailure(
    provider: ChatProviderName,
    failure: { reason: string; retryAfterSeconds?: number },
    now = new Date()
  ) {
    if (
      this.states.get(provider)?.reason === "policy-violation" &&
      failure.reason !== "policy-violation"
    ) {
      return
    }
    const duration =
      failure.reason === "policy-violation"
        ? POLICY_COOLDOWN_SECONDS
        : Math.max(1, failure.retryAfterSeconds ?? DEFAULT_COOLDOWN_SECONDS)
    this.states.set(provider, {
      disabledUntil: new Date(now.getTime() + duration * 1_000),
      reason: failure.reason,
    })
  }
}
