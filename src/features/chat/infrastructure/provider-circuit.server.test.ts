import { describe, expect, it } from "vitest"

import { InMemoryProviderCircuitStore } from "@/features/chat/infrastructure/provider-circuit.server"

describe("provider circuit", () => {
  it("keeps a zero-spend policy violation disabled until an operator resets it", async () => {
    const circuit = new InMemoryProviderCircuitStore()
    const observedAt = new Date("2026-08-23T00:00:00.000Z")
    const route = {
      provider: "openrouter" as const,
      modelId: "z-ai/glm-5.2:free",
    }

    await circuit.recordFailure(
      route,
      { reason: "policy-violation" },
      observedAt
    )
    await circuit.recordSuccess(route)
    await circuit.recordFailure(
      route,
      { reason: "rate-limited", retryAfterSeconds: 1 },
      new Date("2026-08-23T00:01:00.000Z")
    )

    await expect(
      circuit.canAttempt(route, new Date("2036-08-23T00:00:00.000Z"))
    ).resolves.toBe(false)
  })

  it("reopens an ordinary availability cooldown after its deadline", async () => {
    const circuit = new InMemoryProviderCircuitStore()
    const observedAt = new Date("2026-08-23T00:00:00.000Z")
    const route = {
      provider: "gemini" as const,
      modelId: "gemini-3.5-flash",
    }

    await circuit.recordFailure(
      route,
      { reason: "rate-limited", retryAfterSeconds: 30 },
      observedAt
    )

    await expect(
      circuit.canAttempt(route, new Date("2026-08-23T00:00:31.000Z"))
    ).resolves.toBe(true)
  })

  it("uses a five-minute cooldown when the provider omits Retry-After", async () => {
    const circuit = new InMemoryProviderCircuitStore()
    const observedAt = new Date("2026-08-23T00:00:00.000Z")
    const route = {
      provider: "openrouter" as const,
      modelId: "z-ai/glm-5.2:free",
    }

    await circuit.recordFailure(route, { reason: "rate-limited" }, observedAt)

    await expect(
      circuit.canAttempt(route, new Date("2026-08-23T00:04:59.000Z"))
    ).resolves.toBe(false)
    await expect(
      circuit.canAttempt(route, new Date("2026-08-23T00:05:00.000Z"))
    ).resolves.toBe(true)
  })

  it("isolates cooldowns by model within one provider", async () => {
    const circuit = new InMemoryProviderCircuitStore()
    const observedAt = new Date("2026-08-23T00:00:00.000Z")
    const congested = {
      provider: "openrouter" as const,
      modelId: "z-ai/glm-5.2:free",
    }
    const available = {
      provider: "openrouter" as const,
      modelId: "nvidia/nemotron-3-super-120b-a12b:free",
    }

    await circuit.recordFailure(
      congested,
      { reason: "rate-limited", retryAfterSeconds: 30 },
      observedAt
    )

    await expect(circuit.canAttempt(congested, observedAt)).resolves.toBe(false)
    await expect(circuit.canAttempt(available, observedAt)).resolves.toBe(true)
  })
})
