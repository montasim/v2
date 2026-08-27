import { beforeAll, describe, expect, it } from "vitest"

import { buildEvaluationCorpus } from "@/features/chat/evaluation/evaluation-corpus"
import { selectPortfolioEvidence } from "@/features/chat/application/portfolio-evidence-selection"
import { getCompiledPortfolioKnowledge } from "@/features/chat/knowledge/portfolio-knowledge.server"
import type { CompiledPortfolioKnowledge } from "@/features/chat/knowledge/portfolio-knowledge.server"

let knowledge: CompiledPortfolioKnowledge

beforeAll(() => {
  knowledge = getCompiledPortfolioKnowledge()
})

describe("portfolio evidence selection", () => {
  it("keeps a dynamic prompt focused while retaining current-role evidence", () => {
    const selection = selectPortfolioEvidence({
      question:
        "What position does he hold now, and what does its scope involve?",
      knowledge,
    })

    expect(selection.facts.length).toBeLessThanOrEqual(12)
    expect(selection.prompt.length).toBeLessThan(40_000)
    expect(selection.factIds).toContain(
      "experience:experience-mymedicalhub-senior-software-engineer"
    )
    expect(selection.prompt).not.toContain(knowledge.toon)
  })

  it("retrieves expected evidence for at least 99% of mandatory corpus cases", () => {
    const required = buildEvaluationCorpus().filter(
      (entry) => entry.evidenceRequirement === "reference-overlap-required"
    )
    const matched = required.filter((entry) => {
      const selection = selectPortfolioEvidence({
        question: entry.question,
        knowledge,
      })
      return entry.expectedFactIds.some((factId) =>
        selection.factIds.includes(factId)
      )
    })

    expect(matched.length / required.length).toBeGreaterThanOrEqual(0.99)
  }, 20_000)
})
