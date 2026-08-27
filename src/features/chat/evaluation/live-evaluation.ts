import { createPortfolioChat } from "@/features/chat/application/portfolio-chat"
import type { PortfolioChatDependencies } from "@/features/chat/application/portfolio-chat"
import type { AiProviderAdapter } from "@/features/chat/application/ports/ai-provider"
import type {
  PortfolioChat,
  PortfolioChatReply,
} from "@/features/chat/domain/portfolio-chat"
import { buildEvaluationCorpus } from "@/features/chat/evaluation/evaluation-corpus"
import type { ChatEvaluationCase } from "@/features/chat/evaluation/evaluation-corpus"
import { prepareQualityEvaluation } from "@/features/chat/evaluation/quality-rubric"
import type {
  QualityEvaluationResult,
  QualityHardFailure,
} from "@/features/chat/evaluation/quality-rubric"
import {
  EvaluationFatalProviderError,
  isEvaluationFatalProviderError,
} from "@/features/chat/evaluation/evaluation-provider-budget"
import type {
  EvaluationProviderTelemetry,
  EvaluationProviderUsageReport,
} from "@/features/chat/evaluation/evaluation-provider-budget"
import type { ExactAnswerCatalog } from "@/features/chat/knowledge/exact-answer-catalog"
import type { CompiledPortfolioKnowledge } from "@/features/chat/knowledge/portfolio-knowledge-types"
import type { ChatProviderName } from "@/features/chat/domain/chat"

export interface ForcedDynamicEvaluationTarget {
  readonly mode: "forced-dynamic"
  readonly answer: PortfolioChat["answer"]
}

export interface LiveEvaluationControls {
  readonly concurrency: number
  readonly caseStartsPerMinute: number
}

export interface EvaluationClock {
  readonly now: () => number
  readonly sleep: (milliseconds: number, signal?: AbortSignal) => Promise<void>
}

export interface LiveEvaluationCaseResult {
  readonly id: string
  readonly category: ChatEvaluationCase["category"]
  readonly audience: ChatEvaluationCase["audience"]
  readonly question: string
  readonly referenceAnswerId: string
  readonly referenceAnswer: string
  readonly expectedFactIds: readonly string[]
  readonly supportingExcerpts: readonly string[]
  readonly evidenceRequirement: ChatEvaluationCase["evidenceRequirement"]
  readonly durationMs: number
  readonly reply?: PortfolioChatReply
  readonly judge?: LiveEvaluationJudgeTrace
  readonly evaluation: QualityEvaluationResult
  readonly error?: string
}

export interface LiveEvaluationJudgeTrace {
  readonly provider: ChatProviderName
  readonly requestedModel: string
  readonly servedModel?: string
  readonly inputTokens?: number
  readonly outputTokens?: number
  readonly totalTokens?: number
  readonly costUsd?: number
}

export interface LiveEvaluationCategorySummary {
  readonly total: number
  readonly passed: number
  readonly failed: number
}

export interface LiveEvaluationReport {
  readonly schemaVersion: "portfolio-chat-evaluation/v1"
  readonly runId: string
  readonly knowledgeHash: string
  readonly startedAt: string
  readonly completedAt: string
  readonly controls: LiveEvaluationControls
  readonly providerUsage: EvaluationProviderUsageReport
  readonly summary: {
    readonly total: number
    readonly passed: number
    readonly failed: number
    readonly passRate: number
    readonly byCategory: Readonly<
      Partial<
        Record<ChatEvaluationCase["category"], LiveEvaluationCategorySummary>
      >
    >
    readonly hardFailures: Readonly<Partial<Record<QualityHardFailure, number>>>
  }
  readonly cases: readonly LiveEvaluationCaseResult[]
}

export interface RunLiveEvaluationInput {
  readonly target: ForcedDynamicEvaluationTarget
  readonly judges: readonly AiProviderAdapter[]
  readonly providerTelemetry?: EvaluationProviderTelemetry
  readonly knowledge: CompiledPortfolioKnowledge
  readonly cases?: readonly ChatEvaluationCase[]
  readonly controls?: Partial<LiveEvaluationControls>
  readonly runId?: string
  readonly clock?: EvaluationClock
  readonly signal?: AbortSignal
  readonly onCaseComplete?: (
    result: LiveEvaluationCaseResult,
    completed: number,
    total: number
  ) => void | Promise<void>
}

const defaultControls: LiveEvaluationControls = {
  concurrency: 1,
  caseStartsPerMinute: 18,
}

const systemClock: EvaluationClock = {
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

/**
 * Builds a real PortfolioChat target while replacing the exact-match adapter
 * with an empty one. The same questions therefore exercise generation,
 * validation, provider fallback, and citations rather than the static path.
 */
export function createForcedDynamicEvaluationTarget(
  dependencies: Omit<PortfolioChatDependencies, "exactAnswers">
): ForcedDynamicEvaluationTarget {
  const emptyExactCatalog: ExactAnswerCatalog = Object.freeze({
    records: Object.freeze([]),
    find: () => undefined,
  })
  const chat = createPortfolioChat({
    ...dependencies,
    exactAnswers: Object.freeze({
      knowledgeHash: dependencies.knowledge.hash,
      find: emptyExactCatalog.find,
    }),
  })
  return Object.freeze({ mode: "forced-dynamic" as const, answer: chat.answer })
}

/** Runs the selected corpus without stopping after a provider or judge error. */
export async function runLiveEvaluation(
  input: RunLiveEvaluationInput
): Promise<LiveEvaluationReport> {
  const cases = input.cases ?? buildEvaluationCorpus()
  const controls = validateControls({
    ...defaultControls,
    ...input.controls,
  })
  const clock = input.clock ?? systemClock
  const runId = input.runId ?? crypto.randomUUID()
  const startedAtMs = clock.now()
  const acquireStartSlot = createStartPacer(
    controls.caseStartsPerMinute,
    clock,
    input.signal
  )
  const results = new Array<LiveEvaluationCaseResult>(cases.length)
  let nextCaseIndex = 0
  let completed = 0

  async function worker() {
    while (nextCaseIndex < cases.length) {
      const caseIndex = nextCaseIndex
      nextCaseIndex += 1
      const evaluationCase = cases[caseIndex]

      await acquireStartSlot()
      const result = await evaluateCase({
        evaluationCase,
        caseIndex,
        runId,
        target: input.target,
        judges: input.judges,
        providerTelemetry: input.providerTelemetry,
        knowledge: input.knowledge,
        clock,
        signal: input.signal,
      })
      results[caseIndex] = result
      completed += 1
      await input.onCaseComplete?.(result, completed, cases.length)
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(controls.concurrency, Math.max(1, cases.length)) },
      () => worker()
    )
  )

  const completeResults = results.filter(
    (result): result is LiveEvaluationCaseResult => Boolean(result)
  )
  return {
    schemaVersion: "portfolio-chat-evaluation/v1",
    runId,
    knowledgeHash: input.knowledge.hash,
    startedAt: new Date(startedAtMs).toISOString(),
    completedAt: new Date(clock.now()).toISOString(),
    controls,
    providerUsage:
      input.providerTelemetry?.snapshot() ??
      summarizeProviderUsage(completeResults),
    summary: summarize(completeResults),
    cases: completeResults,
  }
}

export function serializeEvaluationReport(report: LiveEvaluationReport) {
  return `${JSON.stringify(report, null, 2)}\n`
}

async function evaluateCase(input: {
  readonly evaluationCase: ChatEvaluationCase
  readonly caseIndex: number
  readonly runId: string
  readonly target: ForcedDynamicEvaluationTarget
  readonly judges: readonly AiProviderAdapter[]
  readonly providerTelemetry?: EvaluationProviderTelemetry
  readonly knowledge: CompiledPortfolioKnowledge
  readonly clock: EvaluationClock
  readonly signal?: AbortSignal
}): Promise<LiveEvaluationCaseResult> {
  const startedAt = input.clock.now()
  let reply: PortfolioChatReply | undefined
  try {
    reply = await input.target.answer(
      {
        conversationId: `quality-eval:${input.runId}:${input.caseIndex}`,
        clientMessageId: `case-${input.caseIndex}`,
        question: input.evaluationCase.question,
      },
      {
        signal: input.signal,
      }
    )
    input.providerTelemetry?.assertSafe()
    const attempt = prepareQualityEvaluation({
      evaluationCase: input.evaluationCase,
      reply,
      knowledge: input.knowledge,
      signal: input.signal,
    })
    if (!attempt.providerRequest) {
      return caseResult({
        evaluationCase: input.evaluationCase,
        reply,
        evaluation: attempt.evaluate(),
        durationMs: Math.max(0, input.clock.now() - startedAt),
      })
    }

    const judge = selectIndependentJudge(input.judges, reply, input.caseIndex)
    if (!judge) {
      return caseResult({
        evaluationCase: input.evaluationCase,
        reply,
        evaluation: {
          status: "failed",
          hardFailures: ["judge-not-independent"],
          issues: [
            "No configured judge was independent from the accepted generator.",
          ],
        },
        durationMs: Math.max(0, input.clock.now() - startedAt),
      })
    }

    const completion = await judge.complete(attempt.providerRequest)
    if (judge.provider === "openrouter" && completion.usage?.costUsd !== 0) {
      throw new EvaluationFatalProviderError(
        "OpenRouter judge did not prove an exact zero cost."
      )
    }
    input.providerTelemetry?.assertSafe()
    const evaluation = attempt.evaluate(completion.text)

    return caseResult({
      evaluationCase: input.evaluationCase,
      reply,
      judge: {
        provider: judge.provider,
        requestedModel: completion.requestedModelId,
        ...(completion.servedModelId
          ? { servedModel: completion.servedModelId }
          : {}),
        ...(completion.usage?.inputTokens === undefined
          ? {}
          : { inputTokens: completion.usage.inputTokens }),
        ...(completion.usage?.outputTokens === undefined
          ? {}
          : { outputTokens: completion.usage.outputTokens }),
        ...(completion.usage?.totalTokens === undefined
          ? {}
          : { totalTokens: completion.usage.totalTokens }),
        ...(completion.usage?.costUsd === undefined
          ? {}
          : { costUsd: completion.usage.costUsd }),
      },
      evaluation,
      durationMs: Math.max(0, input.clock.now() - startedAt),
    })
  } catch (error) {
    if (isEvaluationFatalProviderError(error)) throw error
    const message =
      error instanceof Error ? error.message : "Unknown evaluation error"
    return caseResult({
      evaluationCase: input.evaluationCase,
      ...(reply ? { reply } : {}),
      evaluation: {
        status: "failed",
        hardFailures: ["evaluation-error"],
        issues: [message],
      },
      durationMs: Math.max(0, input.clock.now() - startedAt),
      error: message,
    })
  }
}

function caseResult(input: {
  readonly evaluationCase: ChatEvaluationCase
  readonly reply?: PortfolioChatReply
  readonly judge?: LiveEvaluationJudgeTrace
  readonly evaluation: QualityEvaluationResult
  readonly durationMs: number
  readonly error?: string
}): LiveEvaluationCaseResult {
  return {
    id: input.evaluationCase.id,
    category: input.evaluationCase.category,
    audience: input.evaluationCase.audience,
    question: input.evaluationCase.question,
    referenceAnswerId: input.evaluationCase.referenceAnswerId,
    referenceAnswer: input.evaluationCase.referenceAnswer,
    expectedFactIds: input.evaluationCase.expectedFactIds,
    supportingExcerpts: input.evaluationCase.supportingExcerpts,
    evidenceRequirement: input.evaluationCase.evidenceRequirement,
    durationMs: input.durationMs,
    ...(input.reply ? { reply: input.reply } : {}),
    ...(input.judge ? { judge: input.judge } : {}),
    evaluation: input.evaluation,
    ...(input.error ? { error: input.error } : {}),
  }
}

function selectIndependentJudge(
  judges: readonly AiProviderAdapter[],
  reply: PortfolioChatReply,
  caseIndex: number
) {
  const excluded = new Set<ChatProviderName>()
  const unavailable = new Set<ChatProviderName>()
  if (reply.kind === "generated" && reply.provider) {
    excluded.add(reply.provider)
  }
  for (const attempt of reply.attempts) {
    if (attempt.outcome === "accepted" && attempt.stage === "generation") {
      excluded.add(attempt.provider)
    }
    if (attempt.outcome === "failed" || attempt.outcome === "skipped") {
      unavailable.add(attempt.provider)
    }
  }
  const eligible = judges.filter((judge) => !excluded.has(judge.provider))
  if (eligible.length === 0) return undefined
  const preferred = eligible.filter((judge) => !unavailable.has(judge.provider))
  const pool = preferred.length > 0 ? preferred : eligible
  return pool[caseIndex % pool.length]
}

function createStartPacer(
  startsPerMinute: number,
  clock: EvaluationClock,
  signal?: AbortSignal
) {
  const intervalMs = 60_000 / startsPerMinute
  let nextStartAt = clock.now()
  let tail = Promise.resolve()

  return async () => {
    const slot = tail.then(async () => {
      const delay = Math.max(0, nextStartAt - clock.now())
      if (delay > 0) await clock.sleep(delay, signal)
      nextStartAt = Math.max(nextStartAt, clock.now()) + intervalMs
    })
    tail = slot.catch(() => undefined)
    await slot
  }
}

function validateControls(controls: LiveEvaluationControls) {
  if (
    !Number.isInteger(controls.concurrency) ||
    controls.concurrency < 1 ||
    controls.concurrency > 16
  ) {
    throw new Error("Evaluation concurrency must be an integer from 1 to 16")
  }
  if (
    !Number.isFinite(controls.caseStartsPerMinute) ||
    controls.caseStartsPerMinute <= 0 ||
    controls.caseStartsPerMinute > 600
  ) {
    throw new Error(
      "Evaluation caseStartsPerMinute must be greater than 0 and at most 600"
    )
  }
  return Object.freeze({ ...controls })
}

function summarize(results: readonly LiveEvaluationCaseResult[]) {
  const passed = results.filter(
    (result) => result.evaluation.status === "passed"
  ).length
  const byCategory: Partial<
    Record<ChatEvaluationCase["category"], LiveEvaluationCategorySummary>
  > = {}
  const hardFailures: Partial<Record<QualityHardFailure, number>> = {}

  for (const result of results) {
    const current = byCategory[result.category] ?? {
      total: 0,
      passed: 0,
      failed: 0,
    }
    const didPass = result.evaluation.status === "passed"
    byCategory[result.category] = {
      total: current.total + 1,
      passed: current.passed + (didPass ? 1 : 0),
      failed: current.failed + (didPass ? 0 : 1),
    }
    for (const failure of result.evaluation.hardFailures) {
      hardFailures[failure] = (hardFailures[failure] ?? 0) + 1
    }
  }

  return {
    total: results.length,
    passed,
    failed: results.length - passed,
    passRate: results.length === 0 ? 0 : passed / results.length,
    byCategory,
    hardFailures,
  }
}

function summarizeProviderUsage(
  results: readonly LiveEvaluationCaseResult[]
): EvaluationProviderUsageReport {
  const byProvider: Partial<
    Record<
      ChatProviderName,
      {
        calls: number
        succeeded: number
        failed: number
        inputTokens: number
        outputTokens: number
        totalTokens: number
        costUsd: number
      }
    >
  > = {}

  const record = (
    provider: ChatProviderName,
    usage: {
      inputTokens?: number
      outputTokens?: number
      totalTokens?: number
      costUsd?: number
    },
    succeeded: boolean
  ) => {
    const current = byProvider[provider] ?? {
      calls: 0,
      succeeded: 0,
      failed: 0,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      costUsd: 0,
    }
    current.calls += 1
    current.succeeded += succeeded ? 1 : 0
    current.failed += succeeded ? 0 : 1
    current.inputTokens += usage.inputTokens ?? 0
    current.outputTokens += usage.outputTokens ?? 0
    current.totalTokens +=
      usage.totalTokens ?? (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0)
    current.costUsd += usage.costUsd ?? 0
    byProvider[provider] = current
  }

  for (const result of results) {
    for (const attempt of result.reply?.attempts ?? []) {
      if (attempt.outcome === "skipped") continue
      record(
        attempt.provider,
        {
          inputTokens: attempt.inputTokens,
          outputTokens: attempt.outputTokens,
          costUsd: attempt.costUsd,
        },
        attempt.outcome === "accepted"
      )
    }
    if (result.judge) {
      record(result.judge.provider, result.judge, true)
    }
  }

  const values = Object.values(byProvider)
  const openrouter = byProvider.openrouter
  return {
    totalCalls: values.reduce((total, usage) => total + usage.calls, 0),
    succeeded: values.reduce((total, usage) => total + usage.succeeded, 0),
    failed: values.reduce((total, usage) => total + usage.failed, 0),
    inputTokens: values.reduce((total, usage) => total + usage.inputTokens, 0),
    outputTokens: values.reduce(
      (total, usage) => total + usage.outputTokens,
      0
    ),
    totalTokens: values.reduce((total, usage) => total + usage.totalTokens, 0),
    costUsd: values.reduce((total, usage) => total + usage.costUsd, 0),
    openRouterZeroCostVerified:
      !openrouter ||
      (openrouter.calls === openrouter.succeeded && openrouter.costUsd === 0),
    byProvider,
  }
}
