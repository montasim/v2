import { describe, expect, it } from "vitest"

import { prepareSemanticAnswerReview } from "@/features/chat/application/semantic-answer-review"
import type { AcceptedGeneratedAnswer } from "@/features/chat/application/full-context-generation"
import type { CompiledPortfolioKnowledge } from "@/features/chat/knowledge/portfolio-knowledge-types"

const answer: AcceptedGeneratedAnswer = {
  mode: "answer",
  interpretation: "Explain a documented real-time engineering result.",
  text: "Montasim designed a deterministic biometric engine that reached 99.9% reliability during live AI analysis. This gives a hiring manager concrete evidence that he can replace unstable state behavior with an explicit architecture while preserving the responsiveness required by a real-time healthcare workflow.",
  claims: [
    {
      text: "Montasim designed a deterministic biometric engine that reached 99.9% reliability during live AI analysis. This gives a hiring manager concrete evidence that he can replace unstable state behavior with an explicit architecture while preserving the responsiveness required by a real-time healthcare workflow.",
      type: "synthesis",
      factIds: ["experience:senior"],
      supportingExcerpts: [
        "Architected an FSM-based biometric engine replacing unstable React hooks with deterministic state transitions for 99.9% reliability during AI analysis.",
      ],
    },
  ],
  evidenceIds: ["experience:senior"],
  citations: [
    {
      label: "Senior Software Engineer role",
      href: "/experience#senior",
      kind: "experience",
    },
  ],
}

function knowledge(): CompiledPortfolioKnowledge {
  const fact = {
    id: "experience:senior",
    source: "experience" as const,
    recordId: "senior",
    label: "Senior Software Engineer role",
    data: {
      description:
        "Architected an FSM-based biometric engine replacing unstable React hooks with deterministic state transitions for 99.9% reliability during AI analysis.",
    },
    evidenceRole: "first-party-portfolio" as const,
    citationId: "experience:senior",
  }
  const alternativeFact = {
    id: "project:postcraft",
    source: "projects" as const,
    recordId: "postcraft",
    label: "PostCraft",
    data: {
      description:
        "A multi-platform publishing product with durable scheduling.",
    },
    evidenceRole: "first-party-portfolio" as const,
    citationId: "project:postcraft",
  }
  const citation = {
    id: "experience:senior",
    source: "experience" as const,
    recordId: "senior",
    label: "Senior Software Engineer role",
    href: "/experience#senior",
  }
  return {
    schemaVersion: "portfolio-knowledge/v1",
    toon: "complete knowledge",
    hash: "knowledge-hash",
    sourceManifest: {
      schemaVersion: "portfolio-source-manifest/v1",
      sources: [],
    },
    facts: [fact, alternativeFact],
    citations: [citation],
    relationships: [],
    derived: {
      catalogCounts: [],
      currentRole: {
        recordId: "senior",
        role: "Senior Software Engineer",
        company: "MyMedicalHub International Ltd.",
        period: "Oct 2025 - Present",
        factId: "derived:current-role",
      },
      projectChronology: [],
      newestProjectFactId: "derived:newest-project-by-github-history",
      latestDatedBlog: {
        recordId: "article",
        title: "Article",
        publishedAt: "2026-08-24",
        tiedRecordIds: ["article"],
        tiedCount: 1,
        tieBreak: "catalog-order",
        factId: "derived:latest-dated-blog",
      },
    },
    findFact(id) {
      return [fact, alternativeFact].find((candidate) => candidate.id === id)
    },
    findCitation(id) {
      return id === citation.id ? citation : undefined
    },
    textForFact(id) {
      return id === fact.id ? JSON.stringify(fact.data) : undefined
    },
  }
}

describe("semantic answer review", () => {
  it("reviews cited evidence against a compact directory of alternatives", () => {
    const attempt = prepareSemanticAnswerReview({
      question: "What reliability work has Montasim delivered?",
      answer,
      knowledge: knowledge(),
    })

    expect(attempt.providerRequest.system).toContain("independent quality gate")
    expect(attempt.providerRequest.system).toContain("first-party")
    expect(attempt.providerRequest.system).not.toContain("complete knowledge")
    expect(attempt.providerRequest.messages).toEqual([
      expect.objectContaining({
        role: "user",
        content: expect.stringContaining("experience:senior"),
      }),
    ])
    expect(attempt.providerRequest.messages[0]?.content).toContain(
      "project:postcraft|PostCraft"
    )
    expect(attempt.providerRequest.messages[0]?.content).not.toContain(
      "multi-platform publishing product"
    )
  })

  it("accepts a relevant, supported, useful, and calibrated answer", () => {
    const result = prepareSemanticAnswerReview({
      question: "What reliability work has Montasim delivered?",
      answer,
      knowledge: knowledge(),
    }).evaluate(
      JSON.stringify({
        verdict: "accept",
        scores: {
          factualEntailment: 4,
          questionRelevance: 4,
          evidenceSelection: 4,
          audienceUsefulness: 4,
          professionalTone: 4,
        },
        issues: [],
      })
    )

    expect(result).toEqual({ status: "accepted" })
  })

  it("rejects a draft when any quality dimension is below the release floor", () => {
    const result = prepareSemanticAnswerReview({
      question: "What reliability work has Montasim delivered?",
      answer,
      knowledge: knowledge(),
    }).evaluate(
      JSON.stringify({
        verdict: "accept",
        scores: {
          factualEntailment: 4,
          questionRelevance: 2,
          evidenceSelection: 3,
          audienceUsefulness: 2,
          professionalTone: 4,
        },
        issues: ["The answer is too generic."],
      })
    )

    expect(result).toMatchObject({
      status: "rejected",
      reason: "quality-threshold",
    })
  })

  it("rejects malformed or internally inconsistent reviewer output", () => {
    const attempt = prepareSemanticAnswerReview({
      question: "What reliability work has Montasim delivered?",
      answer,
      knowledge: knowledge(),
    })

    expect(attempt.evaluate("not json")).toMatchObject({
      status: "rejected",
      reason: "invalid-review",
    })
    expect(
      attempt.evaluate(
        JSON.stringify({
          verdict: "accept",
          scores: {
            factualEntailment: 4,
            questionRelevance: 4,
            evidenceSelection: 4,
            audienceUsefulness: 4,
            professionalTone: 4,
          },
          issues: ["Unsupported conclusion."],
        })
      )
    ).toMatchObject({ status: "rejected", reason: "quality-threshold" })
  })
})
