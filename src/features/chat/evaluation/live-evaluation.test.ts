import { beforeAll, describe, expect, it, vi } from "vitest"

import type { AiProviderAdapter } from "@/features/chat/application/ports/ai-provider"
import { EvaluationFatalProviderError } from "@/features/chat/evaluation/evaluation-provider-budget"
import {
  createForcedDynamicEvaluationTarget,
  runLiveEvaluation,
  serializeEvaluationReport,
} from "@/features/chat/evaluation/live-evaluation"
import { buildEvaluationCorpus } from "@/features/chat/evaluation/evaluation-corpus"
import type { ChatEvaluationCase } from "@/features/chat/evaluation/evaluation-corpus"
import type { PortfolioChatReply } from "@/features/chat/domain/portfolio-chat"
import { InMemoryProviderCircuitStore } from "@/features/chat/infrastructure/provider-circuit.server"
import { getCompiledPortfolioKnowledge } from "@/features/chat/knowledge/portfolio-knowledge.server"
import type { CompiledPortfolioKnowledge } from "@/features/chat/knowledge/portfolio-knowledge.server"

const passingJudgment = JSON.stringify({
  verdict: "pass",
  scores: {
    factualSupport: 4,
    directRelevance: 4,
    evidenceSelection: 4,
    audienceUsefulness: 4,
    professionalTone: 4,
    citationQuality: 4,
  },
  hardFailures: [],
  issues: [],
})

let knowledge: CompiledPortfolioKnowledge

beforeAll(() => {
  knowledge = getCompiledPortfolioKnowledge()
})

function replyFor(evaluationCase: ChatEvaluationCase): PortfolioChatReply {
  const factId = evaluationCase.expectedFactIds[0]
  const fact = knowledge.findFact(factId)
  const citation = fact ? knowledge.findCitation(fact.citationId) : undefined
  if (!citation) throw new Error(`Missing citation for ${factId}`)
  return {
    kind: "generated",
    messageId: `reply:${evaluationCase.id}`,
    text: `Montasim's portfolio gives a concrete, documented answer to this question through the cited professional record. The evidence shows the relevant work, its scope, and the outcome without adding claims beyond the source, which gives a hiring manager or client a useful basis for a focused follow-up discussion.`,
    source: citation.label,
    evidenceIds: [factId],
    citations: [{ label: citation.label, href: citation.href, kind: "page" }],
    provider: "openrouter",
    requestedModel: "z-ai/glm-5.2:free",
    servedModel: "z-ai/glm-5.2:free",
    fallbackDepth: 0,
    attempts: [],
  }
}

function judge(
  provider: AiProviderAdapter["provider"] = "groq",
  costUsd?: number
): AiProviderAdapter {
  return {
    provider,
    modelId: `${provider}-quality-judge`,
    complete: vi.fn(async () => ({
      text: passingJudgment,
      requestedModelId: `${provider}-quality-judge`,
      servedModelId: `${provider}-quality-judge-served`,
      usage: {
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
        ...(costUsd === undefined ? {} : { costUsd }),
      },
    })),
  }
}

describe("live portfolio chat evaluation", () => {
  it("forces an exact catalog question through the dynamic path", async () => {
    const target = createForcedDynamicEvaluationTarget({
      knowledge,
      providers: [],
      recorder: { record: vi.fn(async () => undefined) },
      providerCircuit: new InMemoryProviderCircuitStore(),
      createId: () => "forced-dynamic",
    })

    expect(target.mode).toBe("forced-dynamic")
    await expect(
      target.answer(
        {
          conversationId: "forced-dynamic-test",
          question: "What is Montasim's current role?",
        },
        {}
      )
    ).resolves.toMatchObject({
      kind: "handoff",
      reason: "provider-unavailable",
    })
  })

  it("evaluates every selected case and produces a deterministic JSON report", async () => {
    const cases = buildEvaluationCorpus().slice(0, 3)
    const answer = vi.fn(async ({ question }: { question: string }) => {
      const evaluationCase = cases.find((entry) => entry.question === question)
      if (!evaluationCase) throw new Error("Unknown evaluation question")
      return replyFor(evaluationCase)
    })
    const target = { mode: "forced-dynamic" as const, answer }

    const report = await runLiveEvaluation({
      target,
      judges: [judge()],
      knowledge,
      cases,
      controls: { concurrency: 2, caseStartsPerMinute: 600 },
      runId: "quality-run",
      clock: {
        now: () => 1_000,
        sleep: async () => undefined,
      },
    })

    expect(answer).toHaveBeenCalledTimes(3)
    expect(report).toMatchObject({
      schemaVersion: "portfolio-chat-evaluation/v1",
      runId: "quality-run",
      knowledgeHash: knowledge.hash,
      summary: { total: 3, passed: 3, failed: 0, passRate: 1 },
      providerUsage: {
        totalCalls: 3,
        inputTokens: 300,
        outputTokens: 150,
        totalTokens: 450,
      },
    })
    expect(report.cases).toHaveLength(3)
    expect(report.cases[0]).toMatchObject({
      referenceAnswer: cases[0]?.referenceAnswer,
      expectedFactIds: cases[0]?.expectedFactIds,
      evaluation: { status: "passed" },
      judge: {
        provider: "groq",
        requestedModel: "groq-quality-judge",
        servedModel: "groq-quality-judge-served",
      },
    })
    expect(JSON.parse(serializeEvaluationReport(report))).toEqual(report)
  })

  it("enforces global case-start pacing without exceeding worker concurrency", async () => {
    const cases = buildEvaluationCorpus().slice(0, 4)
    let now = 0
    let active = 0
    let maxActive = 0
    const starts: number[] = []
    const sleeps: number[] = []
    const target = {
      mode: "forced-dynamic" as const,
      async answer({ question }: { question: string }) {
        const evaluationCase = cases.find(
          (entry) => entry.question === question
        )
        if (!evaluationCase) throw new Error("Unknown evaluation question")
        starts.push(now)
        active += 1
        maxActive = Math.max(maxActive, active)
        await Promise.resolve()
        active -= 1
        return replyFor(evaluationCase)
      },
    }

    await runLiveEvaluation({
      target,
      judges: [judge()],
      knowledge,
      cases,
      controls: { concurrency: 2, caseStartsPerMinute: 60 },
      runId: "paced-run",
      clock: {
        now: () => now,
        async sleep(milliseconds) {
          sleeps.push(milliseconds)
          await Promise.resolve()
          now += milliseconds
        },
      },
    })

    expect(maxActive).toBeLessThanOrEqual(2)
    expect(starts).toEqual([0, 1_000, 2_000, 3_000])
    expect(sleeps).toEqual([1_000, 1_000, 1_000])
  })

  it("records one case failure without abandoning the remaining run", async () => {
    const cases = buildEvaluationCorpus().slice(0, 2)
    const target = {
      mode: "forced-dynamic" as const,
      async answer({ question }: { question: string }) {
        const evaluationCase = cases.find(
          (entry) => entry.question === question
        )
        if (!evaluationCase) throw new Error("Unknown evaluation question")
        if (evaluationCase === cases[0]) throw new Error("provider offline")
        return replyFor(evaluationCase)
      },
    }

    const report = await runLiveEvaluation({
      target,
      judges: [judge()],
      knowledge,
      cases,
      controls: { concurrency: 1, caseStartsPerMinute: 600 },
      runId: "partial-run",
      clock: { now: () => 0, sleep: async () => undefined },
    })

    expect(report.summary).toMatchObject({ total: 2, passed: 1, failed: 1 })
    expect(report.cases[0]).toMatchObject({
      evaluation: { status: "failed" },
      error: "provider offline",
    })
    expect(report.cases[1]?.evaluation.status).toBe("passed")
  })

  it("selects a judge independent from the accepted generator and runtime reviewer", async () => {
    const evaluationCase = buildEvaluationCorpus()[0]
    const generated = replyFor(evaluationCase)
    if (generated.kind !== "generated") throw new Error("Expected generation")
    const reply: PortfolioChatReply = {
      ...generated,
      provider: "openrouter",
      attempts: [
        {
          stage: "generation",
          provider: "openrouter",
          requestedModel: "generator",
          outcome: "accepted",
          latencyMs: 1,
        },
        {
          stage: "review",
          provider: "gemini",
          requestedModel: "reviewer",
          outcome: "accepted",
          latencyMs: 1,
        },
      ],
    }
    const openrouter = judge("openrouter", 0)
    const gemini = judge("gemini")
    const groq = judge("groq")

    const report = await runLiveEvaluation({
      target: { mode: "forced-dynamic", answer: async () => reply },
      judges: [openrouter, gemini, groq],
      knowledge,
      cases: [evaluationCase],
      controls: { concurrency: 1, caseStartsPerMinute: 600 },
      runId: "independent-judge",
      clock: { now: () => 0, sleep: async () => undefined },
    })

    expect(openrouter.complete).not.toHaveBeenCalled()
    expect(gemini.complete).not.toHaveBeenCalled()
    expect(groq.complete).toHaveBeenCalledOnce()
    expect(report.cases[0]?.judge?.provider).toBe("groq")
  })

  it("fails the case when no independent judge is configured", async () => {
    const evaluationCase = buildEvaluationCorpus()[0]
    const reply = replyFor(evaluationCase)

    const report = await runLiveEvaluation({
      target: { mode: "forced-dynamic", answer: async () => reply },
      judges: [judge("openrouter", 0)],
      knowledge,
      cases: [evaluationCase],
      controls: { concurrency: 1, caseStartsPerMinute: 600 },
      runId: "no-independent-judge",
      clock: { now: () => 0, sleep: async () => undefined },
    })

    expect(report.cases[0]?.evaluation).toMatchObject({
      status: "failed",
      hardFailures: ["judge-not-independent"],
    })
  })

  it("stops the run when an OpenRouter judge cannot prove zero cost", async () => {
    const evaluationCase = buildEvaluationCorpus()[0]
    const generated = replyFor(evaluationCase)
    if (generated.kind !== "generated") throw new Error("Expected generation")
    const reply: PortfolioChatReply = { ...generated, provider: "gemini" }

    await expect(
      runLiveEvaluation({
        target: { mode: "forced-dynamic", answer: async () => reply },
        judges: [judge("openrouter", 0.001)],
        knowledge,
        cases: [evaluationCase],
        controls: { concurrency: 1, caseStartsPerMinute: 600 },
        runId: "nonzero-judge-cost",
        clock: { now: () => 0, sleep: async () => undefined },
      })
    ).rejects.toBeInstanceOf(EvaluationFatalProviderError)
  })
})
