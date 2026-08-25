import { describe, expect, it, vi } from "vitest"

import type { AiProviderAdapter } from "@/features/chat/application/ports/ai-provider"
import {
  createEvaluationProviderHarness,
  EvaluationFatalProviderError,
} from "@/features/chat/evaluation/evaluation-provider-budget"

function adapter(
  provider: AiProviderAdapter["provider"],
  costUsd?: number
): AiProviderAdapter {
  return {
    provider,
    modelId: `${provider}-model`,
    complete: vi.fn(async () => ({
      text: "{}",
      requestedModelId: `${provider}-model`,
      servedModelId: `${provider}-served`,
      usage: {
        inputTokens: 100,
        outputTokens: 20,
        totalTokens: 120,
        ...(costUsd === undefined ? {} : { costUsd }),
      },
    })),
  }
}

describe("evaluation provider budget", () => {
  it("paces every call to a provider and accounts for tokens and verified cost", async () => {
    let now = 0
    const starts: number[] = []
    const openrouter = adapter("openrouter", 0)
    const originalComplete = openrouter.complete
    openrouter.complete = async (completionRequest) => {
      starts.push(now)
      return originalComplete(completionRequest)
    }
    const harness = createEvaluationProviderHarness({
      providers: [openrouter],
      limits: { requestsPerMinute: 18, requestsPerDay: 900 },
      clock: {
        now: () => now,
        async sleep(milliseconds) {
          now += milliseconds
        },
      },
    })

    await Promise.all(
      harness.providers.map((provider) => provider.complete(request()))
    )
    await harness.providers[0].complete(request())
    await harness.providers[0].complete(request())

    expect(starts).toEqual([0, 60_000 / 18, (2 * 60_000) / 18])
    expect(harness.telemetry.snapshot()).toMatchObject({
      totalCalls: 3,
      succeeded: 3,
      failed: 0,
      inputTokens: 300,
      outputTokens: 60,
      totalTokens: 360,
      costUsd: 0,
      openRouterZeroCostVerified: true,
      byProvider: {
        openrouter: { calls: 3, succeeded: 3, failed: 0, costUsd: 0 },
      },
    })
  })

  it("preserves whether a provider can receive the full knowledge packet", () => {
    const reviewOnly: AiProviderAdapter = {
      ...adapter("groq"),
      supportsFullContextGeneration: false,
    }
    const harness = createEvaluationProviderHarness({
      providers: [reviewOnly],
    })

    expect(harness.providers[0].supportsFullContextGeneration).toBe(false)
  })

  it("fails closed before exceeding the daily request budget", async () => {
    const openrouter = adapter("openrouter", 0)
    const harness = createEvaluationProviderHarness({
      providers: [openrouter],
      limits: { requestsPerMinute: 18, requestsPerDay: 2 },
      clock: { now: () => 0, sleep: async () => undefined },
    })

    await harness.providers[0].complete(request())
    await harness.providers[0].complete(request())
    await expect(
      harness.providers[0].complete(request())
    ).rejects.toBeInstanceOf(EvaluationFatalProviderError)
    expect(openrouter.complete).toHaveBeenCalledTimes(2)
  })

  it("marks any nonzero OpenRouter cost as fatal", async () => {
    const harness = createEvaluationProviderHarness({
      providers: [adapter("openrouter", 0.0001)],
      clock: { now: () => 0, sleep: async () => undefined },
    })

    await expect(harness.providers[0].complete(request())).rejects.toThrow(
      "nonzero cost"
    )
    expect(() => harness.telemetry.assertSafe()).toThrow(
      EvaluationFatalProviderError
    )
    expect(harness.telemetry.snapshot()).toMatchObject({
      totalCalls: 1,
      succeeded: 0,
      failed: 1,
      costUsd: 0.0001,
      openRouterZeroCostVerified: false,
    })
  })

  it("runs a shared quota gate before any provider request", async () => {
    const openrouter = adapter("openrouter", 0)
    const beforeCall = vi.fn(async () => {
      throw new EvaluationFatalProviderError("shared daily budget reached")
    })
    const harness = createEvaluationProviderHarness({
      providers: [openrouter],
      beforeCall,
      clock: { now: () => 0, sleep: async () => undefined },
    })

    await expect(harness.providers[0].complete(request())).rejects.toThrow(
      "shared daily budget reached"
    )
    expect(beforeCall).toHaveBeenCalledWith("openrouter", undefined)
    expect(openrouter.complete).not.toHaveBeenCalled()
    expect(() => harness.telemetry.assertSafe()).toThrow(
      "shared daily budget reached"
    )
  })
})

function request() {
  return { system: "test", messages: [] }
}
