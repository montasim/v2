import { and, eq, sql } from "drizzle-orm"

import type { ProviderCircuitStore } from "@/features/chat/application/ports/provider-circuit"
import type { AiProviderRoute } from "@/features/chat/application/ports/ai-provider"
import { assistantProviderStates } from "@/db/schema"
import { getDatabase } from "@/db/client.server"

const DEFAULT_COOLDOWN_SECONDS = 5 * 60
const POLICY_COOLDOWN_SECONDS = 365 * 24 * 60 * 60

export class DatabaseProviderCircuitStore implements ProviderCircuitStore {
  async canAttempt(route: AiProviderRoute, now = new Date()) {
    const rows = await getDatabase()
      .select({
        disabledUntil: assistantProviderStates.disabledUntil,
        reason: assistantProviderStates.reason,
      })
      .from(assistantProviderStates)
      .where(
        and(
          eq(assistantProviderStates.provider, route.provider),
          eq(assistantProviderStates.model, route.modelId)
        )
      )
      .limit(1)
    const state = rows.at(0)
    if (state?.reason === "policy-violation") return false
    return !state?.disabledUntil || state.disabledUntil <= now
  }

  async recordSuccess(route: AiProviderRoute) {
    await getDatabase()
      .insert(assistantProviderStates)
      .values({
        provider: route.provider,
        model: route.modelId,
        disabledUntil: null,
        reason: null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [
          assistantProviderStates.provider,
          assistantProviderStates.model,
        ],
        set: { disabledUntil: null, reason: null, updatedAt: new Date() },
        setWhere: sql`${assistantProviderStates.reason} is distinct from 'policy-violation'`,
      })
  }

  async recordFailure(
    route: AiProviderRoute,
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
        provider: route.provider,
        model: route.modelId,
        disabledUntil,
        reason: failure.reason,
        lastCostUsd:
          failure.costUsd === undefined ? null : String(failure.costUsd),
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [
          assistantProviderStates.provider,
          assistantProviderStates.model,
        ],
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
    string,
    { disabledUntil: Date; reason: string }
  >()

  async canAttempt(route: AiProviderRoute, now = new Date()) {
    const state = this.states.get(routeKey(route))
    if (state?.reason === "policy-violation") return false
    return !state || state.disabledUntil <= now
  }

  async recordSuccess(route: AiProviderRoute) {
    const key = routeKey(route)
    if (this.states.get(key)?.reason === "policy-violation") return
    this.states.delete(key)
  }

  async recordFailure(
    route: AiProviderRoute,
    failure: { reason: string; retryAfterSeconds?: number },
    now = new Date()
  ) {
    if (
      this.states.get(routeKey(route))?.reason === "policy-violation" &&
      failure.reason !== "policy-violation"
    ) {
      return
    }
    const duration =
      failure.reason === "policy-violation"
        ? POLICY_COOLDOWN_SECONDS
        : Math.max(1, failure.retryAfterSeconds ?? DEFAULT_COOLDOWN_SECONDS)
    this.states.set(routeKey(route), {
      disabledUntil: new Date(now.getTime() + duration * 1_000),
      reason: failure.reason,
    })
  }
}

function routeKey(route: AiProviderRoute) {
  return `${route.provider}:${route.modelId}`
}
