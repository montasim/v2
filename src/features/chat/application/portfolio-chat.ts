import type {
  AiCompletionResult,
  AiProviderAdapter,
  AiProviderRoute,
} from "@/features/chat/application/ports/ai-provider"
import {
  createOpenRouterGlobalRateLimitRequests,
  createVisitorDynamicRateLimitRequests,
} from "@/features/chat/application/chat-rate-limit-policy"
import type {
  ChatExchangeRecorder,
  ChatKnowledgeScope,
} from "@/features/chat/application/ports/chat-exchange-recorder"
import type { ChatRequestCoordinator } from "@/features/chat/application/ports/chat-request-coordinator"
import type { ChatRequestLimiter } from "@/features/chat/application/ports/chat-request-limiter"
import type { ProviderCircuitStore } from "@/features/chat/application/ports/provider-circuit"
import { prepareFocusedContextGeneration } from "@/features/chat/application/full-context-generation"
import type { AcceptedGeneratedAnswer } from "@/features/chat/application/full-context-generation"
import { selectPortfolioEvidence } from "@/features/chat/application/portfolio-evidence-selection"
import type { PortfolioEvidenceSelection } from "@/features/chat/application/portfolio-evidence-selection"
import { redactChatText } from "@/features/chat/domain/chat-redaction"
import { inferConversationAction } from "@/features/chat/domain/conversation-action"
import type { ChatProviderName } from "@/features/chat/domain/chat"
import type { PortfolioCitation } from "@/features/chat/domain/portfolio-citations"
import { PORTFOLIO_CHAT_UNAVAILABLE_MESSAGE } from "@/features/chat/domain/portfolio-chat"
import type {
  PortfolioChat,
  PortfolioChatInput,
  PortfolioChatReply,
  PortfolioHandoffReply,
  ProviderAttemptTrace,
  SupportedPortfolioReply,
} from "@/features/chat/domain/portfolio-chat"
import { createPortfolioChatKnowledgeScope } from "@/features/chat/domain/portfolio-chat-policy"
import {
  isLikelyNoisyInput,
  isPromptInjectionAttempt,
} from "@/features/chat/domain/question-safety"
import type {
  ExactAnswer,
  PortfolioExactAnswerCatalog,
} from "@/features/chat/knowledge/exact-answer-catalog"
import type {
  CompiledPortfolioKnowledge,
  PortfolioKnowledgeCitation,
  PortfolioKnowledgeFact,
} from "@/features/chat/knowledge/portfolio-knowledge.server"
import { logger } from "@/lib/logger.server"

export const CHAT_GENERATION_DEADLINE_MS = 50_000
export const OPENROUTER_GENERATION_ATTEMPT_MS = 12_000
export const GEMINI_GENERATION_ATTEMPT_MS = 22_000
export const GROQ_GENERATION_ATTEMPT_MS = 10_000
/** @deprecated Use the provider-specific generation timeout. */
export const DIRECT_GENERATION_ATTEMPT_MS = GEMINI_GENERATION_ATTEMPT_MS
/** @deprecated Runtime semantic review was removed. */
export const REVIEW_ATTEMPT_MS = 10_000

type ProviderAttemptStage = "generation" | "review"

export interface PortfolioChatDependencies {
  readonly knowledge: CompiledPortfolioKnowledge
  readonly exactAnswers: PortfolioExactAnswerCatalog
  readonly providers: readonly AiProviderAdapter[]
  readonly recorder: ChatExchangeRecorder
  readonly providerCircuit: ProviderCircuitStore
  readonly requestCoordinator?: ChatRequestCoordinator
  readonly requestLimiter?: ChatRequestLimiter
  readonly createId?: () => string
  readonly now?: () => Date
  readonly attemptTimeoutMs?: (
    stage: ProviderAttemptStage,
    provider: ChatProviderName
  ) => number
}

export class ChatDynamicRateLimitError extends Error {
  readonly code = "chat-dynamic-rate-limit"

  constructor(readonly retryAfterSeconds: number) {
    super("The dynamic portfolio assistant rate limit was reached.")
    this.name = "ChatDynamicRateLimitError"
  }
}

export class ChatGenerationUnavailableError extends Error {
  readonly code = "chat-generation-unavailable"

  constructor(readonly attempts: readonly ProviderAttemptTrace[]) {
    super("No provider produced a fully validated portfolio answer.")
    this.name = "ChatGenerationUnavailableError"
  }
}

export function createPortfolioChat({
  knowledge,
  exactAnswers,
  providers,
  recorder,
  providerCircuit,
  requestCoordinator,
  requestLimiter,
  createId = () => crypto.randomUUID(),
  now = () => new Date(),
  attemptTimeoutMs = defaultAttemptTimeoutMs,
}: PortfolioChatDependencies): PortfolioChat {
  if (exactAnswers.knowledgeHash !== knowledge.hash) {
    throw new Error(
      "The exact-answer artifact knowledge hash does not match the compiled portfolio knowledge hash."
    )
  }

  const knowledgeScope = createPortfolioChatKnowledgeScope(knowledge.hash)

  return {
    async answer(input, context) {
      const startedAt = now().getTime()
      const question = redactChatText(input.question).trim()
      const safeInput = { ...input, question }

      const answerOnce = async (requirePersistence: boolean) => {
        const existing = await findExistingReply(
          recorder,
          safeInput,
          knowledgeScope
        )
        if (existing) return existing

        const exact = exactAnswers.find(question)
        if (exact) {
          const reply = exactReply(exact, question, knowledge, createId())
          await recordReply({
            recorder,
            input: safeInput,
            reply,
            startedAt,
            now,
            knowledge,
            retrievalMetadata: { mode: "exact-answer" },
            requirePersistence,
          })
          return reply
        }

        const safetyHandoff = resolveSafetyHandoff(question, createId)
        if (safetyHandoff) {
          await recordReply({
            recorder,
            input: safeInput,
            reply: safetyHandoff,
            startedAt,
            now,
            knowledge,
            retrievalMetadata: { mode: "safety-policy" },
            requirePersistence,
          })
          return safetyHandoff
        }

        await enforceVisitorDynamicLimits(
          requestLimiter,
          context.visitorHash,
          context.signal
        )

        const trustedPrevious = await loadTrustedPrevious(
          recorder,
          input.conversationId,
          knowledgeScope
        )
        const evidence = selectPortfolioEvidence({
          question,
          ...(trustedPrevious
            ? { trustedPreviousExchange: trustedPrevious }
            : {}),
          knowledge,
        })
        const signal = deadlineSignal(context.signal)
        let reply: PortfolioChatReply
        try {
          reply = await generateValidatedReply({
            question,
            trustedPrevious,
            evidence,
            knowledge,
            providers,
            providerCircuit,
            requestLimiter,
            createId,
            now,
            attemptTimeoutMs,
            signal,
          })
        } catch (error) {
          if (!(error instanceof ChatGenerationUnavailableError)) throw error
          reply = providerUnavailableHandoff(
            question,
            createId(),
            error.attempts
          )
        }
        await recordReply({
          recorder,
          input: safeInput,
          reply,
          startedAt,
          now,
          knowledge,
          retrievalMetadata: {
            mode: "focused-evidence",
            factCount: evidence.facts.length,
            promptCharacters: evidence.prompt.length,
            strategies: evidence.strategies,
            semanticReview: false,
          },
          requirePersistence,
        })
        return reply
      }

      if (requestCoordinator && safeInput.clientMessageId) {
        return requestCoordinator.run({
          conversationId: safeInput.conversationId,
          clientMessageId: safeInput.clientMessageId,
          signal: context.signal,
          findCompleted: () =>
            findExistingReply(recorder, safeInput, knowledgeScope),
          work: () => answerOnce(true),
        })
      }

      return answerOnce(false)
    },
  }
}

interface GenerationInput {
  readonly question: string
  readonly trustedPrevious: {
    readonly question: string
    readonly answer: string
  } | null
  readonly knowledge: CompiledPortfolioKnowledge
  readonly evidence: PortfolioEvidenceSelection
  readonly providers: readonly AiProviderAdapter[]
  readonly providerCircuit: ProviderCircuitStore
  readonly requestLimiter?: ChatRequestLimiter
  readonly createId: () => string
  readonly now: () => Date
  readonly attemptTimeoutMs: (
    stage: ProviderAttemptStage,
    provider: ChatProviderName
  ) => number
  readonly signal: AbortSignal
}

async function generateValidatedReply(
  input: GenerationInput
): Promise<PortfolioChatReply> {
  const attempts: ProviderAttemptTrace[] = []

  const generation = prepareFocusedContextGeneration({
    question: input.question,
    ...(input.trustedPrevious
      ? { trustedPreviousExchange: input.trustedPrevious }
      : {}),
    knowledge: input.knowledge,
    evidence: input.evidence,
    signal: input.signal,
  })

  for (const [fallbackDepth, provider] of input.providers.entries()) {
    input.signal.throwIfAborted()
    if (!(await canAttempt(input.providerCircuit, provider))) {
      attempts.push({
        stage: "generation",
        provider: provider.provider,
        requestedModel: provider.modelId,
        outcome: "skipped",
        reason: "provider-circuit-open",
        latencyMs: 0,
      })
      continue
    }

    if (
      provider.provider === "openrouter" &&
      !(await canConsumeOpenRouterQuota(input.requestLimiter, input.signal))
    ) {
      attempts.push({
        stage: "generation",
        provider: provider.provider,
        requestedModel: provider.modelId,
        outcome: "skipped",
        reason: "openrouter-free-quota-reserved",
        latencyMs: 0,
      })
      continue
    }

    input.signal.throwIfAborted()
    const startedAt = input.now().getTime()
    try {
      const attemptSignal = attemptDeadlineSignal(
        input.signal,
        input.attemptTimeoutMs("generation", provider.provider)
      )
      const completion = await withSignal(
        provider.complete({
          ...generation.providerRequest,
          signal: attemptSignal,
        }),
        attemptSignal
      )
      const generationTrace = completionTrace(
        "generation",
        provider,
        completion,
        input.now().getTime() - startedAt
      )

      if (
        provider.provider === "openrouter" &&
        completion.usage?.costUsd !== 0
      ) {
        await safeCircuitFailure(input.providerCircuit, provider, {
          reason: "policy-violation",
          costUsd: completion.usage?.costUsd,
        })
        attempts.push({
          ...generationTrace,
          outcome: "rejected",
          reason: "openrouter-cost-not-proven-zero",
        })
        continue
      }

      await safeCircuitSuccess(input.providerCircuit, provider)
      const evaluated = generation.evaluate(completion.text)
      if (evaluated.status === "rejected") {
        logger.warn(
          {
            provider: provider.provider,
            model: provider.modelId,
            reasons: evaluated.reasons,
          },
          "Portfolio chat generation was rejected by deterministic validation"
        )
        attempts.push({
          ...generationTrace,
          outcome: "rejected",
          reason: evaluated.reasons.map((reason) => reason.code).join(","),
        })
        continue
      }

      if (evaluated.answer.mode === "handoff") {
        attempts.push({
          ...generationTrace,
          outcome: "rejected",
          reason: "model-reported-insufficient-public-evidence",
        })
        continue
      }

      if (!evaluated.answer.citations[0] || !evaluated.answer.evidenceIds[0]) {
        attempts.push({
          ...generationTrace,
          outcome: "rejected",
          reason: "validated-answer-without-citation",
        })
        continue
      }

      attempts.push({ ...generationTrace, outcome: "accepted" })
      return generatedReply({
        answer: evaluated.answer,
        provider,
        completion,
        fallbackDepth,
        attempts,
        knowledge: input.knowledge,
        messageId: input.createId(),
        question: input.question,
      })
    } catch (error) {
      const reason = errorCode(error)
      const costUsd = readCostUsd(error)
      attempts.push({
        stage: "generation",
        provider: provider.provider,
        requestedModel: provider.modelId,
        outcome: "failed",
        reason,
        latencyMs: input.now().getTime() - startedAt,
        costUsd,
      })
      if (isCircuitFailure(reason)) {
        await safeCircuitFailure(input.providerCircuit, provider, {
          reason,
          retryAfterSeconds: readRetryAfter(error),
          costUsd,
        })
      }
      logger.warn(
        { provider: provider.provider, model: provider.modelId, reason },
        "Portfolio chat generation attempt failed"
      )
    }
  }

  throw new ChatGenerationUnavailableError(attempts)
}

function completionTrace(
  stage: "generation" | "review",
  provider: AiProviderAdapter,
  completion: AiCompletionResult,
  latencyMs: number
): Omit<ProviderAttemptTrace, "outcome"> {
  return {
    stage,
    provider: provider.provider,
    requestedModel: completion.requestedModelId,
    servedModel: completion.servedModelId,
    latencyMs,
    inputTokens: completion.usage?.inputTokens,
    outputTokens: completion.usage?.outputTokens,
    costUsd: completion.usage?.costUsd,
    generationId: completion.generationId,
    finishReason: completion.finishReason,
  }
}

function generatedReply(input: {
  readonly answer: AcceptedGeneratedAnswer
  readonly provider: AiProviderAdapter
  readonly completion: AiCompletionResult
  readonly fallbackDepth: number
  readonly attempts: readonly ProviderAttemptTrace[]
  readonly knowledge: CompiledPortfolioKnowledge
  readonly messageId: string
  readonly question: string
}): SupportedPortfolioReply {
  const [firstCitation, ...remainingCitations] = input.answer.citations
  const [firstEvidenceId, ...remainingEvidenceIds] = input.answer.evidenceIds
  const contactAction = inferConversationAction(input.question)
  return {
    kind: "generated",
    messageId: input.messageId,
    text: input.answer.text,
    source: sourceLabel(input.answer.evidenceIds, input.knowledge),
    citations: [firstCitation, ...remainingCitations],
    evidenceIds: [firstEvidenceId, ...remainingEvidenceIds],
    provider: input.provider.provider,
    requestedModel: input.completion.requestedModelId,
    servedModel: input.completion.servedModelId,
    fallbackDepth: input.fallbackDepth,
    attempts: input.attempts,
    ...(contactAction ? { contactAction } : {}),
  }
}

function exactReply(
  answer: ExactAnswer,
  question: string,
  knowledge: CompiledPortfolioKnowledge,
  messageId: string
): SupportedPortfolioReply {
  const evidenceIds = Array.from(new Set(answer.factIds))
  const citations = citationsForFacts(evidenceIds, knowledge)
  const [firstEvidenceId, ...remainingEvidenceIds] = evidenceIds
  const [firstCitation, ...remainingCitations] = citations
  const contactAction = inferConversationAction(question)

  return {
    kind: "exact",
    messageId,
    text: answer.text,
    source: sourceLabel(evidenceIds, knowledge),
    evidenceIds: [firstEvidenceId, ...remainingEvidenceIds],
    citations: [firstCitation, ...remainingCitations],
    fallbackDepth: 0,
    attempts: [],
    ...(contactAction ? { contactAction } : {}),
  }
}

function citationsForFacts(
  factIds: readonly string[],
  knowledge: CompiledPortfolioKnowledge
) {
  const citations = new Map<string, PortfolioCitation>()
  for (const factId of factIds) {
    const fact = knowledge.findFact(factId)
    if (!fact) throw new Error(`Unknown portfolio fact: ${factId}`)
    const citation = knowledge.findCitation(fact.citationId)
    if (!citation)
      throw new Error(`Unknown portfolio citation: ${fact.citationId}`)
    if (!citations.has(citation.id)) {
      citations.set(citation.id, toPortfolioCitation(citation))
    }
  }
  return [...citations.values()]
}

function toPortfolioCitation(
  citation: PortfolioKnowledgeCitation
): PortfolioCitation {
  const kinds: Readonly<Record<string, PortfolioCitation["kind"]>> = {
    projects: "project",
    casestudy: "case-study",
    blog: "blog",
    experience: "experience",
    skills: "skill",
  }
  return {
    label: citation.label,
    href: citation.href,
    kind: kinds[citation.source] ?? "page",
  }
}

function sourceLabel(
  factIds: readonly string[],
  knowledge: CompiledPortfolioKnowledge
) {
  const labels = Array.from(
    new Set(
      factIds.flatMap((id) => {
        const fact = knowledge.findFact(id)
        if (!fact) return []
        const citation = knowledge.findCitation(fact.citationId)
        return [humanSource(citation?.source ?? fact.source)]
      })
    )
  )
  if (labels.length === 0) return "Portfolio"
  if (labels.length === 1) return labels[0] ?? "Portfolio"
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`
  return `${labels.slice(0, -1).join(", ")}, and ${labels.at(-1)}`
}

function humanSource(source: PortfolioKnowledgeFact["source"] | string) {
  const labels: Readonly<Record<string, string>> = {
    profile: "Profile",
    experience: "Experience",
    projects: "Projects",
    casestudy: "Case studies",
    blog: "Blog",
    certifications: "Certifications",
    contributions: "GitHub contributions",
    education: "Education",
    organizations: "Organizations",
    recommendations: "Recommendations",
    skills: "Skills",
    volunteering: "Volunteering",
    derived: "Portfolio facts",
  }
  return labels[source] ?? "Portfolio"
}

function resolveSafetyHandoff(
  question: string,
  createId: () => string
): PortfolioHandoffReply | undefined {
  if (isPromptInjectionAttempt(question) || isLikelyNoisyInput(question)) {
    return {
      kind: "handoff",
      messageId: createId(),
      text: "I can help with Montasim's published work, skills, achievements, and professional fit. For private, unpublished, or unclear details, please contact Montasim directly.",
      source: "Portfolio contact",
      citations: [],
      evidenceIds: [],
      contactAction: "general",
      reason: "unsafe-question",
      fallbackDepth: 0,
      attempts: [],
    }
  }
  return undefined
}

function providerUnavailableHandoff(
  question: string,
  messageId: string,
  attempts: readonly ProviderAttemptTrace[]
): PortfolioHandoffReply {
  return {
    kind: "handoff",
    messageId,
    text: PORTFOLIO_CHAT_UNAVAILABLE_MESSAGE,
    source: "Portfolio contact",
    citations: [],
    evidenceIds: [],
    contactAction: inferConversationAction(question) ?? "general",
    reason: "provider-unavailable",
    fallbackDepth: 0,
    attempts,
  }
}

async function enforceVisitorDynamicLimits(
  limiter: ChatRequestLimiter | undefined,
  visitorHash: string | undefined,
  signal?: AbortSignal
) {
  if (!limiter || !visitorHash) return
  for (const request of createVisitorDynamicRateLimitRequests(visitorHash)) {
    const result = await withSignal(limiter.consume(request), signal)
    if (!result.allowed) {
      throw new ChatDynamicRateLimitError(result.retryAfterSeconds)
    }
  }
}

async function canConsumeOpenRouterQuota(
  limiter: ChatRequestLimiter | undefined,
  signal?: AbortSignal
) {
  if (!limiter) return true
  for (const request of createOpenRouterGlobalRateLimitRequests()) {
    const result = await withSignal(limiter.consume(request), signal)
    if (!result.allowed) return false
  }
  return true
}

async function findExistingReply(
  recorder: ChatExchangeRecorder,
  input: PortfolioChatInput,
  scope: ChatKnowledgeScope
) {
  if (!input.clientMessageId || !recorder.findReply) return null
  return recorder.findReply({
    conversationId: input.conversationId,
    clientMessageId: input.clientMessageId,
    question: input.question,
    scope,
  })
}

async function loadTrustedPrevious(
  recorder: ChatExchangeRecorder,
  conversationId: string,
  scope: ChatKnowledgeScope
) {
  if (!recorder.findLatest) return null
  try {
    return await recorder.findLatest(conversationId, scope)
  } catch (error) {
    logger.warn(
      { errorType: errorCode(error) },
      "Trusted chat history lookup failed"
    )
    return null
  }
}

async function recordReply(input: {
  readonly recorder: ChatExchangeRecorder
  readonly input: PortfolioChatInput
  readonly reply: PortfolioChatReply
  readonly startedAt: number
  readonly now: () => Date
  readonly knowledge: CompiledPortfolioKnowledge
  readonly retrievalMetadata: Record<string, unknown>
  readonly requirePersistence: boolean
}) {
  try {
    await input.recorder.record({
      conversationId: input.input.conversationId,
      clientMessageId: input.input.clientMessageId,
      question: input.input.question,
      reply: input.reply,
      latencyMs: Math.max(0, input.now().getTime() - input.startedAt),
      retrievalMetadata: input.retrievalMetadata,
      policyVersion: createPortfolioChatKnowledgeScope(input.knowledge.hash)
        .policyVersion,
      knowledgeHash: input.knowledge.hash,
    })
  } catch (error) {
    logger.warn(
      { errorType: errorCode(error), responseKind: input.reply.kind },
      "Portfolio chat trace could not be stored"
    )
    if (input.requirePersistence) throw error
  }
}

async function canAttempt(
  circuit: ProviderCircuitStore,
  route: AiProviderRoute
) {
  try {
    return await circuit.canAttempt(route)
  } catch {
    return true
  }
}

async function safeCircuitSuccess(
  circuit: ProviderCircuitStore,
  route: AiProviderRoute
) {
  try {
    await circuit.recordSuccess(route)
  } catch {
    // Provider-state telemetry must not hide a validated answer.
  }
}

async function safeCircuitFailure(
  circuit: ProviderCircuitStore,
  route: AiProviderRoute,
  failure: { reason: string; retryAfterSeconds?: number; costUsd?: number }
) {
  try {
    await circuit.recordFailure(route, failure)
  } catch {
    // A local request still falls through when shared state is unavailable.
  }
}

function isCircuitFailure(reason: string) {
  return (
    reason === "rate-limited" ||
    reason === "provider-unavailable" ||
    reason === "authentication" ||
    reason === "policy-violation"
  )
}

function deadlineSignal(signal?: AbortSignal) {
  const deadline = AbortSignal.timeout(CHAT_GENERATION_DEADLINE_MS)
  return signal ? AbortSignal.any([signal, deadline]) : deadline
}

function defaultAttemptTimeoutMs(
  stage: ProviderAttemptStage,
  provider: ChatProviderName
) {
  if (stage === "review") return REVIEW_ATTEMPT_MS
  if (provider === "openrouter") return OPENROUTER_GENERATION_ATTEMPT_MS
  if (provider === "gemini") return GEMINI_GENERATION_ATTEMPT_MS
  return GROQ_GENERATION_ATTEMPT_MS
}

function attemptDeadlineSignal(signal: AbortSignal, timeoutMs: number) {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new RangeError("Provider attempt timeout must be positive.")
  }
  return AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)])
}

function withSignal<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return promise
  if (signal.aborted) return Promise.reject(signal.reason)

  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(signal.reason)
    signal.addEventListener("abort", onAbort, { once: true })
    promise.then(
      (value) => {
        signal.removeEventListener("abort", onAbort)
        resolve(value)
      },
      (error: unknown) => {
        signal.removeEventListener("abort", onAbort)
        reject(error)
      }
    )
  })
}

function errorCode(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code
  }
  return error instanceof Error ? error.name : "unknown"
}

function readRetryAfter(error: unknown) {
  if (
    typeof error !== "object" ||
    error === null ||
    !("responseHeaders" in error)
  ) {
    return undefined
  }
  const headers = error.responseHeaders
  const value =
    headers instanceof Headers
      ? headers.get("retry-after")
      : typeof headers === "object" && headers !== null
        ? (headers as Record<string, unknown>)["retry-after"]
        : undefined
  const seconds = typeof value === "string" ? Number(value) : undefined
  return seconds !== undefined && Number.isFinite(seconds) && seconds > 0
    ? seconds
    : undefined
}

function readCostUsd(error: unknown) {
  if (typeof error !== "object" || error === null || !("costUsd" in error)) {
    return undefined
  }
  return typeof error.costUsd === "number" && Number.isFinite(error.costUsd)
    ? error.costUsd
    : undefined
}
