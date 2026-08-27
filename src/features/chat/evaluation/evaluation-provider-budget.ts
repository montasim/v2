import type {
  AiCompletionResult,
  AiCompletionUsage,
  AiProviderAdapter,
} from "@/features/chat/application/ports/ai-provider"
import type { ChatProviderName } from "@/features/chat/domain/chat"

export interface EvaluationProviderLimits {
  readonly requestsPerMinute: number
  readonly requestsPerDay: number
}

export interface EvaluationProviderClock {
  readonly now: () => number
  readonly sleep: (milliseconds: number, signal?: AbortSignal) => Promise<void>
}

export interface EvaluationProviderUsage {
  readonly calls: number
  readonly succeeded: number
  readonly failed: number
  readonly inputTokens: number
  readonly outputTokens: number
  readonly totalTokens: number
  readonly costUsd: number
}

export interface EvaluationProviderUsageReport {
  readonly totalCalls: number
  readonly succeeded: number
  readonly failed: number
  readonly inputTokens: number
  readonly outputTokens: number
  readonly totalTokens: number
  readonly costUsd: number
  readonly openRouterZeroCostVerified: boolean
  readonly byProvider: Readonly<
    Partial<Record<ChatProviderName, EvaluationProviderUsage>>
  >
}

export interface EvaluationProviderTelemetry {
  readonly snapshot: () => EvaluationProviderUsageReport
  readonly assertSafe: () => void
}

export interface EvaluationProviderHarness {
  readonly providers: readonly AiProviderAdapter[]
  readonly telemetry: EvaluationProviderTelemetry
}

const defaultLimits: EvaluationProviderLimits = {
  requestsPerMinute: 18,
  requestsPerDay: 900,
}

const systemClock: EvaluationProviderClock = {
  now: Date.now,
  sleep(milliseconds, signal) {
    if (milliseconds <= 0) return Promise.resolve()
    if (signal?.aborted) return Promise.reject(signal.reason)
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        signal?.removeEventListener("abort", onAbort)
        resolve()
      }, milliseconds)
      const onAbort = () => {
        clearTimeout(timeout)
        reject(signal?.reason)
      }
      signal?.addEventListener("abort", onAbort, { once: true })
    })
  },
}

export class EvaluationFatalProviderError extends Error {
  readonly fatalEvaluationError = true

  constructor(message: string) {
    super(message)
    this.name = "EvaluationFatalProviderError"
  }
}

export function isEvaluationFatalProviderError(
  error: unknown
): error is EvaluationFatalProviderError {
  return (
    error instanceof EvaluationFatalProviderError ||
    (typeof error === "object" &&
      error !== null &&
      "fatalEvaluationError" in error &&
      error.fatalEvaluationError === true)
  )
}

/**
 * Wraps every evaluation provider once so generation and the independent
 * judge share the same request pacing and accounting ledger.
 */
export function createEvaluationProviderHarness(input: {
  readonly providers: readonly AiProviderAdapter[]
  readonly limits?: Partial<EvaluationProviderLimits>
  readonly clock?: EvaluationProviderClock
  readonly beforeCall?: (
    provider: ChatProviderName,
    signal?: AbortSignal
  ) => Promise<void>
}): EvaluationProviderHarness {
  const limits = validateLimits({ ...defaultLimits, ...input.limits })
  const clock = input.clock ?? systemClock
  const ledger = createLedger()
  const pacers = new Map<ChatProviderName, ReturnType<typeof createPacer>>()

  const providers = input.providers.map((provider) => {
    let pacer = pacers.get(provider.provider)
    if (!pacer) {
      pacer = createPacer(limits, clock, ledger)
      pacers.set(provider.provider, pacer)
    }
    const providerPacer = pacer

    return Object.freeze({
      provider: provider.provider,
      modelId: provider.modelId,
      ...(provider.supportsFullContextGeneration === undefined
        ? {}
        : {
            supportsFullContextGeneration:
              provider.supportsFullContextGeneration,
          }),
      async complete(request) {
        await providerPacer.acquire(request.signal)
        try {
          await input.beforeCall?.(provider.provider, request.signal)
        } catch (error) {
          if (isEvaluationFatalProviderError(error)) {
            throw ledger.fail(error.message)
          }
          throw error
        }
        let completion: AiCompletionResult
        try {
          completion = await provider.complete(request)
        } catch (error) {
          const costUsd = readNumber(error, "costUsd")
          ledger.recordFailure(provider.provider, costUsd)
          if (
            provider.provider === "openrouter" &&
            (readString(error, "code") === "policy-violation" ||
              Boolean(costUsd))
          ) {
            throw ledger.fail(
              "OpenRouter evaluation stopped because zero cost was not proven."
            )
          }
          throw error
        }

        const costUsd = completion.usage?.costUsd
        if (
          provider.provider === "openrouter" &&
          (costUsd === undefined || costUsd !== 0)
        ) {
          ledger.recordFailure(provider.provider, costUsd)
          throw ledger.fail(
            costUsd === undefined
              ? "OpenRouter evaluation stopped because zero cost was not reported."
              : "OpenRouter evaluation stopped after reporting a nonzero cost."
          )
        }
        ledger.recordSuccess(provider.provider, completion.usage)
        return completion
      },
    } satisfies AiProviderAdapter)
  })

  return Object.freeze({
    providers: Object.freeze(providers),
    telemetry: ledger.telemetry,
  })
}

function createPacer(
  limits: EvaluationProviderLimits,
  clock: EvaluationProviderClock,
  ledger: ReturnType<typeof createLedger>
) {
  const intervalMs = 60_000 / limits.requestsPerMinute
  let nextStartAt = clock.now()
  let callsToday = 0
  let tail = Promise.resolve()

  return {
    async acquire(signal?: AbortSignal) {
      const slot = tail.then(async () => {
        ledger.telemetry.assertSafe()
        if (callsToday >= limits.requestsPerDay) {
          throw ledger.fail(
            `Evaluation stopped at the ${limits.requestsPerDay}-request daily provider budget.`
          )
        }
        const delay = Math.max(0, nextStartAt - clock.now())
        if (delay > 0) await clock.sleep(delay, signal)
        nextStartAt = Math.max(nextStartAt, clock.now()) + intervalMs
        callsToday += 1
      })
      tail = slot.catch(() => undefined)
      await slot
    },
  }
}

function createLedger() {
  const usageByProvider = new Map<ChatProviderName, MutableUsage>()
  let fatalReason: string | undefined

  const usageFor = (provider: ChatProviderName) => {
    let usage = usageByProvider.get(provider)
    if (!usage) {
      usage = emptyUsage()
      usageByProvider.set(provider, usage)
    }
    return usage
  }

  const recordUsage = (
    provider: ChatProviderName,
    status: "succeeded" | "failed",
    usage?: AiCompletionUsage,
    errorCostUsd?: number
  ) => {
    const target = usageFor(provider)
    target.calls += 1
    target[status] += 1
    target.inputTokens += usage?.inputTokens ?? 0
    target.outputTokens += usage?.outputTokens ?? 0
    target.totalTokens +=
      usage?.totalTokens ??
      (usage?.inputTokens ?? 0) + (usage?.outputTokens ?? 0)
    target.costUsd += usage?.costUsd ?? errorCostUsd ?? 0
  }

  const snapshot = (): EvaluationProviderUsageReport => {
    const byProvider: Partial<
      Record<ChatProviderName, EvaluationProviderUsage>
    > = {}
    const total = emptyUsage()
    for (const [provider, usage] of usageByProvider) {
      const immutable = Object.freeze({ ...usage })
      byProvider[provider] = immutable
      addUsage(total, usage)
    }
    const openrouter = usageByProvider.get("openrouter")
    return Object.freeze({
      totalCalls: total.calls,
      succeeded: total.succeeded,
      failed: total.failed,
      inputTokens: total.inputTokens,
      outputTokens: total.outputTokens,
      totalTokens: total.totalTokens,
      costUsd: total.costUsd,
      openRouterZeroCostVerified:
        !fatalReason &&
        (!openrouter ||
          (openrouter.calls === openrouter.succeeded &&
            openrouter.costUsd === 0)),
      byProvider: Object.freeze(byProvider),
    })
  }

  const telemetry: EvaluationProviderTelemetry = Object.freeze({
    snapshot,
    assertSafe() {
      if (fatalReason) throw new EvaluationFatalProviderError(fatalReason)
    },
  })

  return {
    telemetry,
    recordSuccess(provider: ChatProviderName, usage?: AiCompletionUsage) {
      recordUsage(provider, "succeeded", usage)
    },
    recordFailure(provider: ChatProviderName, costUsd?: number) {
      recordUsage(provider, "failed", undefined, costUsd)
    },
    fail(reason: string) {
      fatalReason = fatalReason ?? reason
      return new EvaluationFatalProviderError(fatalReason)
    },
  }
}

interface MutableUsage {
  calls: number
  succeeded: number
  failed: number
  inputTokens: number
  outputTokens: number
  totalTokens: number
  costUsd: number
}

function emptyUsage(): MutableUsage {
  return {
    calls: 0,
    succeeded: 0,
    failed: 0,
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    costUsd: 0,
  }
}

function addUsage(target: MutableUsage, source: MutableUsage) {
  target.calls += source.calls
  target.succeeded += source.succeeded
  target.failed += source.failed
  target.inputTokens += source.inputTokens
  target.outputTokens += source.outputTokens
  target.totalTokens += source.totalTokens
  target.costUsd += source.costUsd
}

function validateLimits(limits: EvaluationProviderLimits) {
  if (
    !Number.isFinite(limits.requestsPerMinute) ||
    limits.requestsPerMinute <= 0 ||
    limits.requestsPerMinute > 18
  ) {
    throw new Error(
      "Evaluation provider requests per minute must be greater than 0 and at most 18"
    )
  }
  if (
    !Number.isInteger(limits.requestsPerDay) ||
    limits.requestsPerDay < 1 ||
    limits.requestsPerDay > 900
  ) {
    throw new Error(
      "Evaluation provider requests per day must be an integer from 1 to 900"
    )
  }
  return Object.freeze({ ...limits })
}

function readNumber(value: unknown, key: string): number | undefined {
  const candidate = readProperty(value, key)
  return typeof candidate === "number" && Number.isFinite(candidate)
    ? candidate
    : undefined
}

function readString(value: unknown, key: string): string | undefined {
  const candidate = readProperty(value, key)
  return typeof candidate === "string" ? candidate : undefined
}

function readProperty(value: unknown, key: string): unknown {
  if (typeof value !== "object" || value === null || !(key in value)) {
    return undefined
  }
  return (value as Record<string, unknown>)[key]
}
