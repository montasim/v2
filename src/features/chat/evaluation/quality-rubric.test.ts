import { beforeAll, describe, expect, it } from "vitest"

import { buildEvaluationCorpus } from "@/features/chat/evaluation/evaluation-corpus"
import {
  prepareQualityEvaluation,
  qualityScoreFloor,
} from "@/features/chat/evaluation/quality-rubric"
import type { PortfolioChatReply } from "@/features/chat/domain/portfolio-chat"
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

function supportedReply(
  text?: string,
  evaluationCase = buildEvaluationCorpus()[0],
  selectedFactId = evaluationCase.expectedFactIds[0]
): PortfolioChatReply {
  const factId = selectedFactId
  const fact = knowledge.findFact(factId)
  const citation = fact ? knowledge.findCitation(fact.citationId) : undefined
  if (!citation) throw new Error(`Missing citation for ${factId}`)

  return {
    kind: "generated",
    messageId: "generated-evaluation-answer",
    text:
      text ??
      "Montasim's documented portfolio connects this work to concrete engineering delivery, with the cited record providing the implementation context and outcome. That evidence gives a hiring manager a grounded basis for discussing his contribution, technical judgment, and fit in a follow-up interview.",
    source: citation.label,
    evidenceIds: [factId],
    citations: [
      {
        label: citation.label,
        href: citation.href,
        kind: "page",
      },
    ],
    provider: "openrouter",
    requestedModel: "z-ai/glm-5.2:free",
    servedModel: "z-ai/glm-5.2:free",
    fallbackDepth: 0,
    attempts: [],
  }
}

describe("portfolio chat evaluation quality contract", () => {
  it("prepares a reference-grounded independent judge request and accepts only a clean high score", () => {
    const evaluationCase = buildEvaluationCorpus()[0]

    const attempt = prepareQualityEvaluation({
      evaluationCase,
      reply: supportedReply(),
      knowledge,
    })

    expect(qualityScoreFloor).toBe(3)
    expect(attempt.hardFailures).toEqual([])
    expect(attempt.providerRequest).toBeDefined()
    expect(attempt.providerRequest?.system).toContain("factualSupport")
    expect(attempt.providerRequest?.system).toContain("direct citations")
    expect(attempt.providerRequest?.system).not.toContain(knowledge.toon)
    expect(attempt.providerRequest?.messages[0]).toMatchObject({ role: "user" })
    const payload = JSON.parse(
      String(attempt.providerRequest?.messages[0]?.content)
    )
    expect(payload.referenceEvidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ factId: evaluationCase.expectedFactIds[0] }),
      ])
    )
    expect(payload.candidateEvidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ factId: evaluationCase.expectedFactIds[0] }),
      ])
    )
    expect(attempt.evaluate(passingJudgment)).toMatchObject({
      status: "passed",
      scores: JSON.parse(passingJudgment).scores,
    })
  })

  it("hard-fails a handoff before spending a judge request", () => {
    const evaluationCase = buildEvaluationCorpus()[0]
    const reply: PortfolioChatReply = {
      kind: "handoff",
      messageId: "handoff",
      text: "Please contact Montasim directly.",
      source: "Portfolio contact",
      evidenceIds: [],
      citations: [],
      contactAction: "general",
      reason: "insufficient-evidence",
      fallbackDepth: 0,
      attempts: [],
    }

    const attempt = prepareQualityEvaluation({
      evaluationCase,
      reply,
      knowledge,
    })

    expect(attempt.providerRequest).toBeUndefined()
    expect(attempt.evaluate()).toMatchObject({
      status: "failed",
      hardFailures: expect.arrayContaining(["handoff", "missing-citation"]),
    })
  })

  it("hard-fails irrelevant evidence, indirect citations, first-person voice, and disguised handoff language", () => {
    const evaluationCase = buildEvaluationCorpus().find(
      (entry) => entry.evidenceRequirement === "reference-overlap-required"
    )
    if (!evaluationCase) throw new Error("Missing direct evaluation case")
    const unrelatedFact = knowledge.facts.find(
      (fact) => !evaluationCase.expectedFactIds.includes(fact.id)
    )
    if (!unrelatedFact) throw new Error("Missing unrelated fact")
    const reply = supportedReply(
      "I cannot establish this from the portfolio, so please contact me directly for the real answer and more details about my background."
    )
    if (reply.kind !== "generated") throw new Error("Expected generated reply")
    const malformed: PortfolioChatReply = {
      ...reply,
      evidenceIds: [unrelatedFact.id],
      citations: [{ label: "Portfolio", href: "/projects", kind: "page" }],
    }

    const result = prepareQualityEvaluation({
      evaluationCase,
      reply: malformed,
      knowledge,
    }).evaluate()

    expect(result).toMatchObject({
      status: "failed",
      hardFailures: expect.arrayContaining([
        "expected-evidence-missing",
        "indirect-citation",
        "first-person-voice",
        "disguised-handoff",
      ]),
    })
  })

  it("allows a supported alternative evidence path for an open synthesis", () => {
    const evaluationCase = buildEvaluationCorpus().find(
      (entry) =>
        entry.referenceAnswerId === "project:project-postcraft:overview"
    )
    if (!evaluationCase) throw new Error("Missing synthesis evaluation case")
    const alternative = knowledge.findFact("case-study:postcraft")
    if (!alternative) throw new Error("Missing alternative evidence")

    const attempt = prepareQualityEvaluation({
      evaluationCase,
      reply: supportedReply(
        "Montasim's published work supplies another directly cited implementation example that can support a useful synthesis. The independent evaluator should inspect that candidate evidence on its own merits while using the reviewed answer only as a quality reference for the broader question.",
        evaluationCase,
        alternative.id
      ),
      knowledge,
    })

    expect(attempt.hardFailures).not.toContain("expected-evidence-missing")
    expect(attempt.providerRequest).toBeDefined()
    const payload = JSON.parse(
      String(attempt.providerRequest?.messages[0]?.content)
    )
    expect(payload.candidateEvidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ factId: alternative.id }),
      ])
    )
  })

  it("does not mistake a quoted first-person blog title for assistant voice", () => {
    const evaluationCase = buildEvaluationCorpus()[0]
    const attempt = prepareQualityEvaluation({
      evaluationCase,
      reply: supportedReply(
        `Montasim's article "How I Built the System" documents the relevant engineering decision through the cited portfolio record. The answer keeps the title intact while explaining his contribution in third person, giving a hiring manager concrete evidence to explore during a focused technical interview.`
      ),
      knowledge,
    })

    expect(attempt.hardFailures).not.toContain("first-person-voice")
    expect(attempt.providerRequest).toBeDefined()
  })

  it("allows concise answers for direct count and chronology questions", () => {
    const evaluationCase = buildEvaluationCorpus().find((entry) =>
      /\b(?:how many|latest|newest|total)\b/i.test(entry.question)
    )
    if (!evaluationCase) throw new Error("Missing direct-fact evaluation case")

    const attempt = prepareQualityEvaluation({
      evaluationCase,
      reply: supportedReply(
        "Montasim's portfolio documents the requested total directly, giving hiring managers a concise and traceable view of the published work represented in that catalog.",
        evaluationCase
      ),
      knowledge,
    })

    expect(attempt.hardFailures).not.toContain("answer-length")
    expect(attempt.providerRequest).toBeDefined()
  })

  it("rejects malformed judgments, any sub-floor score, issue, or semantic hard failure", () => {
    const evaluationCase = buildEvaluationCorpus()[0]
    const attempt = prepareQualityEvaluation({
      evaluationCase,
      reply: supportedReply(),
      knowledge,
    })

    expect(attempt.evaluate("not json")).toMatchObject({
      status: "failed",
      hardFailures: ["invalid-judgment"],
    })
    expect(
      attempt.evaluate(
        JSON.stringify({
          ...JSON.parse(passingJudgment),
          verdict: "fail",
          scores: {
            ...JSON.parse(passingJudgment).scores,
            audienceUsefulness: 2,
          },
          hardFailures: ["unsupported-claim"],
          issues: ["The answer adds an outcome absent from the evidence."],
        })
      )
    ).toMatchObject({
      status: "failed",
      hardFailures: ["unsupported-claim"],
      issues: ["The answer adds an outcome absent from the evidence."],
    })
  })
})
