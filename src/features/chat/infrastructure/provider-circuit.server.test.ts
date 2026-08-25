import { describe, expect, it } from "vitest"

import { InMemoryProviderCircuitStore } from "@/features/chat/infrastructure/provider-circuit.server"

describe("provider circuit", () => {
  it("keeps a zero-spend policy violation disabled until an operator resets it", async () => {
    const circuit = new InMemoryProviderCircuitStore()
    const observedAt = new Date("2026-08-23T00:00:00.000Z")

    await circuit.recordFailure(
      "openrouter",
      { reason: "policy-violation" },
      observedAt
    )
    await circuit.recordSuccess("openrouter")
    await circuit.recordFailure(
      "openrouter",
      { reason: "rate-limited", retryAfterSeconds: 1 },
      new Date("2026-08-23T00:01:00.000Z")
    )

    await expect(
      circuit.canAttempt("openrouter", new Date("2036-08-23T00:00:00.000Z"))
    ).resolves.toBe(false)
  })

  it("reopens an ordinary availability cooldown after its deadline", async () => {
    const circuit = new InMemoryProviderCircuitStore()
    const observedAt = new Date("2026-08-23T00:00:00.000Z")

    await circuit.recordFailure(
      "gemini",
      { reason: "rate-limited", retryAfterSeconds: 30 },
      observedAt
    )

    await expect(
      circuit.canAttempt("gemini", new Date("2026-08-23T00:00:31.000Z"))
    ).resolves.toBe(true)
  })
})
