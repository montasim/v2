import type { ModelMessage } from "ai"
import { z } from "zod"

import type { AiCompletionRequest } from "@/features/chat/application/ports/ai-provider"
import type { AcceptedGeneratedAnswer } from "@/features/chat/application/full-context-generation"
import type { CompiledPortfolioKnowledge } from "@/features/chat/knowledge/portfolio-knowledge-types"

const qualityScoresSchema = z.strictObject({
  factualEntailment: z.number().int().min(1).max(4),
  questionRelevance: z.number().int().min(1).max(4),
  evidenceSelection: z.number().int().min(1).max(4),
  audienceUsefulness: z.number().int().min(1).max(4),
  professionalTone: z.number().int().min(1).max(4),
})

const qualityReviewSchema = z.strictObject({
  verdict: z.enum(["accept", "reject"]),
  scores: qualityScoresSchema,
  issues: z.array(z.string().trim().min(1).max(300)).max(8),
})

export type SemanticAnswerReviewResult =
  | { readonly status: "accepted" }
  | {
      readonly status: "rejected"
      readonly reason: "invalid-review" | "quality-threshold"
      readonly issues: readonly string[]
    }

export interface SemanticAnswerReviewAttempt {
  readonly providerRequest: AiCompletionRequest
  readonly evaluate: (modelOutput: string) => SemanticAnswerReviewResult
}

interface SemanticAnswerReviewInput {
  readonly question: string
  readonly answer: AcceptedGeneratedAnswer
  readonly knowledge: CompiledPortfolioKnowledge
  readonly signal?: AbortSignal
}

function reviewEvidence(
  answer: AcceptedGeneratedAnswer,
  knowledge: CompiledPortfolioKnowledge
) {
  return answer.evidenceIds.flatMap((factId) => {
    const fact = knowledge.findFact(factId)
    if (!fact) return []
    return [
      {
        factId: fact.id,
        label: fact.label,
        evidenceRole: fact.evidenceRole,
        content: fact.data,
      },
    ]
  })
}

function isReviewDirectoryFact(
  fact: CompiledPortfolioKnowledge["facts"][number]
) {
  if (fact.source === "casestudy") {
    return /^case-study:[^:]+$/.test(fact.id)
  }
  if (fact.source === "blog") {
    return /^blog:[^:]+$/.test(fact.id)
  }
  if (fact.source === "derived") {
    return (
      fact.id.startsWith("derived:") &&
      !fact.id.startsWith("derived:project-chronology:")
    )
  }
  return true
}

function reviewEvidenceDirectory(knowledge: CompiledPortfolioKnowledge) {
  const groups = new Map<string, string[]>()

  for (const fact of knowledge.facts) {
    if (!isReviewDirectoryFact(fact)) continue
    const group = `${fact.source}/${fact.evidenceRole}`
    const entries = groups.get(group) ?? []
    entries.push(`${fact.id}|${fact.label}`)
    groups.set(group, entries)
  }

  return [...groups.entries()]
    .map(([group, entries]) => `${group}\n${entries.join("\n")}`)
    .join("\n\n")
}

function reviewMessage(input: SemanticAnswerReviewInput): ModelMessage {
  return {
    role: "user",
    content: JSON.stringify({
      question: input.question,
      interpretation: input.answer.interpretation,
      answer: input.answer.text,
      claims: input.answer.claims,
      citedEvidence: reviewEvidence(input.answer, input.knowledge),
      availableEvidenceDirectory: reviewEvidenceDirectory(input.knowledge),
    }),
  }
}

function evaluateReview(modelOutput: string): SemanticAnswerReviewResult {
  let candidate: unknown
  try {
    candidate = JSON.parse(modelOutput.trim()) as unknown
  } catch {
    return {
      status: "rejected",
      reason: "invalid-review",
      issues: ["The reviewer did not return one valid JSON object."],
    }
  }

  const parsed = qualityReviewSchema.safeParse(candidate)
  if (!parsed.success) {
    return {
      status: "rejected",
      reason: "invalid-review",
      issues: parsed.error.issues.map(
        (issue) => `${issue.path.join(".") || "review"}: ${issue.message}`
      ),
    }
  }

  const belowFloor = Object.values(parsed.data.scores).some(
    (score) => score < 3
  )
  if (
    parsed.data.verdict !== "accept" ||
    belowFloor ||
    parsed.data.issues.length > 0
  ) {
    return {
      status: "rejected",
      reason: "quality-threshold",
      issues: parsed.data.issues.length
        ? parsed.data.issues
        : ["The answer did not meet every semantic quality threshold."],
    }
  }

  return { status: "accepted" }
}

export function prepareSemanticAnswerReview(
  input: SemanticAnswerReviewInput
): SemanticAnswerReviewAttempt {
  return {
    providerRequest: {
      system: `You are an independent quality gate for a public professional portfolio answer.

Review only the supplied question, answer, claim ledger, cited evidence, and compact directory of alternative portfolio evidence. Do not add facts or rewrite the answer. Directory entries contain identifiers and labels only: use them to assess whether a clearly more appropriate evidence record was ignored, never as factual support. Relevance is not authority: first-party portfolio evidence supports only what it documents; professional observations support only what the named person directly observed and do not independently verify unrelated metrics, implementation details, employment dates, team size, or catalog totals.

Score each dimension from 1 to 4:
- factualEntailment: every claim follows from its cited evidence without exaggeration.
- questionRelevance: the answer directly addresses the visitor's actual question.
- evidenceSelection: the cited evidence is appropriate and high-signal compared with the available evidence directory.
- audienceUsefulness: the answer gives a hiring manager, client, or engineer useful insight.
- professionalTone: positive, third-person, calibrated, and free of invented endorsement or negativity.

Return exactly one JSON object with this shape and no additional keys:
{"verdict":"accept|reject","scores":{"factualEntailment":1,"questionRelevance":1,"evidenceSelection":1,"audienceUsefulness":1,"professionalTone":1},"issues":["concise issue"]}

Use verdict "accept" only when every score is at least 3 and issues is empty.`,
      messages: [reviewMessage(input)],
      signal: input.signal,
    },
    evaluate: evaluateReview,
  }
}
