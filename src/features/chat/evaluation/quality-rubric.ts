import { z } from "zod"

import type { AiCompletionRequest } from "@/features/chat/application/ports/ai-provider"
import type { ChatEvaluationCase } from "@/features/chat/evaluation/evaluation-corpus"
import type { PortfolioChatReply } from "@/features/chat/domain/portfolio-chat"
import type { CompiledPortfolioKnowledge } from "@/features/chat/knowledge/portfolio-knowledge-types"

export const qualityScoreFloor = 3 as const

export const qualityDimensions = [
  "factualSupport",
  "directRelevance",
  "evidenceSelection",
  "audienceUsefulness",
  "professionalTone",
  "citationQuality",
] as const

export type QualityDimension = (typeof qualityDimensions)[number]

export const qualityHardFailureCodes = [
  "handoff",
  "not-dynamic",
  "missing-citation",
  "unknown-evidence",
  "expected-evidence-missing",
  "indirect-citation",
  "first-person-voice",
  "disguised-handoff",
  "uncalibrated-endorsement",
  "answer-length",
  "unsupported-claim",
  "reference-contradiction",
  "irrelevant-answer",
  "poor-evidence-selection",
  "low-audience-usefulness",
  "tone-violation",
  "judge-not-independent",
  "evaluation-error",
  "invalid-judgment",
] as const

export type QualityHardFailure = (typeof qualityHardFailureCodes)[number]

export type QualityScores = Readonly<Record<QualityDimension, number>>

export type QualityEvaluationResult =
  | {
      readonly status: "passed"
      readonly scores: QualityScores
      readonly hardFailures: readonly []
      readonly issues: readonly []
    }
  | {
      readonly status: "failed"
      readonly scores?: QualityScores
      readonly hardFailures: readonly QualityHardFailure[]
      readonly issues: readonly string[]
    }

export interface PreparedQualityEvaluation {
  readonly hardFailures: readonly QualityHardFailure[]
  readonly providerRequest?: AiCompletionRequest
  readonly evaluate: (modelOutput?: string) => QualityEvaluationResult
}

export interface QualityEvaluationInput {
  readonly evaluationCase: ChatEvaluationCase
  readonly reply: PortfolioChatReply
  readonly knowledge: CompiledPortfolioKnowledge
  readonly signal?: AbortSignal
}

const hardFailureSchema = z.enum(qualityHardFailureCodes)
const qualityScoresSchema = z.strictObject({
  factualSupport: z.number().int().min(1).max(4),
  directRelevance: z.number().int().min(1).max(4),
  evidenceSelection: z.number().int().min(1).max(4),
  audienceUsefulness: z.number().int().min(1).max(4),
  professionalTone: z.number().int().min(1).max(4),
  citationQuality: z.number().int().min(1).max(4),
})
const qualityJudgmentSchema = z.strictObject({
  verdict: z.enum(["pass", "fail"]),
  scores: qualityScoresSchema,
  hardFailures: z.array(hardFailureSchema).max(12),
  issues: z.array(z.string().trim().min(1).max(400)).max(10),
})

/**
 * Creates the complete quality gate for one candidate answer. Cheap structural
 * failures stop here; only structurally viable answers receive a judge request.
 */
export function prepareQualityEvaluation(
  input: QualityEvaluationInput
): PreparedQualityEvaluation {
  const hardFailures = deterministicHardFailures(input)
  if (hardFailures.length > 0) {
    return {
      hardFailures,
      evaluate: () => ({
        status: "failed",
        hardFailures,
        issues: hardFailures.map(hardFailureDescription),
      }),
    }
  }

  const providerRequest = buildJudgeRequest(input)
  return {
    hardFailures,
    providerRequest,
    evaluate(modelOutput) {
      return evaluateJudgment(modelOutput)
    },
  }
}

function deterministicHardFailures(
  input: QualityEvaluationInput
): readonly QualityHardFailure[] {
  const failures = new Set<QualityHardFailure>()
  const { reply, evaluationCase, knowledge } = input

  if (reply.kind === "handoff") failures.add("handoff")
  if (reply.kind !== "generated") failures.add("not-dynamic")
  if (reply.citations.length === 0) failures.add("missing-citation")

  if (
    evaluationCase.evidenceRequirement === "reference-overlap-required" &&
    !reply.evidenceIds.some((factId) =>
      evaluationCase.expectedFactIds.includes(factId)
    )
  ) {
    failures.add("expected-evidence-missing")
  }

  for (const factId of reply.evidenceIds) {
    const fact = knowledge.findFact(factId)
    if (!fact) {
      failures.add("unknown-evidence")
      continue
    }
    const expectedCitation = knowledge.findCitation(fact.citationId)
    if (
      !expectedCitation ||
      !reply.citations.some(
        (citation) =>
          citation.href === expectedCitation.href &&
          citation.label === expectedCitation.label
      )
    ) {
      failures.add("indirect-citation")
    }
  }

  const unquotedAnswer = reply.text.replace(/(?:"|“)[^"”]{1,240}(?:"|”)/gu, "")
  if (
    /\b(?:I\s+(?:am|believe|built|can(?:not|'t)?|created|designed|developed|have|implemented|led|recommend|think|will|worked|would)|me|mine|my|our|ours|us|we)\b/iu.test(
      unquotedAnswer
    )
  ) {
    failures.add("first-person-voice")
  }
  if (
    /\b(?:contact (?:him|me|montasim)|reach out (?:to him|to me|directly)|cannot (?:answer|establish|verify)|not enough (?:information|evidence)|does not document that detail)\b/iu.test(
      reply.text
    )
  ) {
    failures.add("disguised-handoff")
  }
  if (
    /\b(?:world[- ]class|guaranteed|perfect (?:candidate|fit|hire)|must[- ]hire|without question the best)\b/iu.test(
      reply.text
    )
  ) {
    failures.add("uncalibrated-endorsement")
  }

  const words = reply.text.trim().split(/\s+/u).filter(Boolean).length
  if (words < 10 || words > 220) failures.add("answer-length")

  return [...failures]
}

function buildJudgeRequest(input: QualityEvaluationInput): AiCompletionRequest {
  const referenceEvidence = evidenceForFacts(
    input.evaluationCase.expectedFactIds,
    input.knowledge
  )
  const candidateEvidence = evidenceForFacts(
    input.reply.evidenceIds,
    input.knowledge
  )

  return {
    system: `You are the strict independent evaluator for a public professional portfolio assistant.

Compare the candidate answer with the visitor question and the reviewed reference answer. The reference answer and reference evidence are quality guidance, not wording or a single evidence path the candidate must copy. Judge every candidate claim against candidateEvidence; it contains the complete facts cited by the candidate. Do not add facts or rewrite the candidate.

Score every dimension from 1 to 4:
- factualSupport: every material claim follows from candidateEvidence; no invented value, date, metric, role, endorsement, or causal claim.
- directRelevance: the candidate answers the actual question and its stated audience angle without drifting.
- evidenceSelection: cited facts are strong relevant records and their role supports the claim being made. A supported alternative to the reference evidence is valid.
- audienceUsefulness: the answer gives a hiring manager, potential client, interviewer, or engineer decision-useful insight rather than a catalog dump.
- professionalTone: third-person, positive, specific, calibrated, and free from false endorsement, ranking, negativity, or sales hype.
- citationQuality: direct citations link to the records supporting the answer and match the evidence IDs.

Any unsupported claim, contradiction, irrelevant answer, poor evidence choice, disguised contact handoff, first-person voice, uncalibrated endorsement, or missing/indirect citation is a hard failure. A pass requires every score to be at least ${qualityScoreFloor}, no hard failures, and no issues.

Return exactly one JSON object with this shape and no additional keys:
{"verdict":"pass|fail","scores":{"factualSupport":1,"directRelevance":1,"evidenceSelection":1,"audienceUsefulness":1,"professionalTone":1,"citationQuality":1},"hardFailures":["unsupported-claim"],"issues":["concise evidence-based issue"]}

Allowed hard failure values: ${qualityHardFailureCodes.join(", ")}.
Use verdict "pass" only when every requirement is satisfied, with hardFailures and issues both empty.`,
    messages: [
      {
        role: "user",
        content: JSON.stringify({
          evaluationId: input.evaluationCase.id,
          category: input.evaluationCase.category,
          audience: input.evaluationCase.audience,
          question: input.evaluationCase.question,
          reference: {
            question: input.evaluationCase.referenceQuestion,
            answer: input.evaluationCase.referenceAnswer,
            evidenceRequirement: input.evaluationCase.evidenceRequirement,
            expectedFactIds: input.evaluationCase.expectedFactIds,
            supportingExcerpts: input.evaluationCase.supportingExcerpts,
          },
          referenceEvidence,
          candidateEvidence,
          candidate: {
            answer: input.reply.text,
            kind: input.reply.kind,
            source: input.reply.source,
            evidenceIds: input.reply.evidenceIds,
            citations: input.reply.citations,
          },
        }),
      },
    ],
    signal: input.signal,
  }
}

function evidenceForFacts(
  factIds: readonly string[],
  knowledge: CompiledPortfolioKnowledge
) {
  return factIds.flatMap((factId) => {
    const fact = knowledge.findFact(factId)
    if (!fact) return []
    const citation = knowledge.findCitation(fact.citationId)
    return [
      {
        factId: fact.id,
        label: fact.label,
        evidenceRole: fact.evidenceRole,
        content: fact.data,
        citation: citation
          ? { label: citation.label, href: citation.href }
          : null,
      },
    ]
  })
}

function evaluateJudgment(modelOutput?: string): QualityEvaluationResult {
  if (!modelOutput)
    return invalidJudgment("The quality judge returned no output.")

  let candidate: unknown
  try {
    candidate = JSON.parse(modelOutput.trim()) as unknown
  } catch {
    return invalidJudgment("The quality judge did not return one JSON object.")
  }

  const parsed = qualityJudgmentSchema.safeParse(candidate)
  if (!parsed.success) {
    return invalidJudgment(
      parsed.error.issues
        .map(
          (issue) => `${issue.path.join(".") || "judgment"}: ${issue.message}`
        )
        .join("; ")
    )
  }

  const scores: QualityScores = parsed.data.scores
  const belowFloor = qualityDimensions.some(
    (dimension) => scores[dimension] < qualityScoreFloor
  )
  if (
    parsed.data.verdict !== "pass" ||
    belowFloor ||
    parsed.data.hardFailures.length > 0 ||
    parsed.data.issues.length > 0
  ) {
    return {
      status: "failed",
      scores,
      hardFailures: parsed.data.hardFailures,
      issues:
        parsed.data.issues.length > 0
          ? parsed.data.issues
          : ["The candidate did not meet every quality threshold."],
    }
  }

  return { status: "passed", scores, hardFailures: [], issues: [] }
}

function invalidJudgment(issue: string): QualityEvaluationResult {
  return {
    status: "failed",
    hardFailures: ["invalid-judgment"],
    issues: [issue],
  }
}

function hardFailureDescription(failure: QualityHardFailure) {
  const descriptions: Readonly<Record<QualityHardFailure, string>> = {
    handoff: "The assistant returned a handoff instead of a supported answer.",
    "not-dynamic":
      "The forced-dynamic evaluation did not return a generated answer.",
    "missing-citation": "The answer has no direct citation.",
    "unknown-evidence": "The answer references an unknown portfolio fact.",
    "expected-evidence-missing":
      "The answer does not cite any fact expected by its reference case.",
    "indirect-citation":
      "A citation does not directly match the cited portfolio fact.",
    "first-person-voice": "The answer is not consistently third-person.",
    "disguised-handoff":
      "The answer uses contact or inability language instead of answering.",
    "uncalibrated-endorsement":
      "The answer uses an unsupported endorsement or guarantee.",
    "answer-length": "The answer is outside the 10–220 word quality range.",
    "unsupported-claim": "The answer contains a claim unsupported by evidence.",
    "reference-contradiction": "The answer contradicts the reviewed reference.",
    "irrelevant-answer": "The answer does not directly address the question.",
    "poor-evidence-selection": "The answer selects weak or unrelated evidence.",
    "low-audience-usefulness":
      "The answer is not decision-useful for its intended audience.",
    "tone-violation":
      "The answer does not meet the calibrated professional tone.",
    "judge-not-independent":
      "No judge independent from the generator was available.",
    "evaluation-error": "The live evaluation case could not be completed.",
    "invalid-judgment": "The quality judge output is invalid.",
  }
  return descriptions[failure]
}
