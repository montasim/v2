import { describe, expect, it } from "vitest"

import {
  buildEvaluationCorpus,
  evaluationCategoryTargets,
  selectEvaluationCases,
} from "@/features/chat/evaluation/evaluation-corpus"
import {
  getExactAnswerCatalog,
  normalizeExactQuestion,
} from "@/features/chat/knowledge/exact-answer-catalog"

describe("chat quality evaluation corpus", () => {
  it("builds exactly 300 deterministic non-exact questions across every category", () => {
    const first = buildEvaluationCorpus()
    const second = buildEvaluationCorpus()

    expect(first).toEqual(second)
    expect(first).toHaveLength(300)
    expect(new Set(first.map((entry) => entry.id))).toHaveLength(300)
    expect(new Set(first.map((entry) => entry.question))).toHaveLength(300)

    for (const [category, target] of Object.entries(
      evaluationCategoryTargets
    )) {
      expect(first.filter((entry) => entry.category === category)).toHaveLength(
        target
      )
    }
  })

  it("uses the new exact catalog only as the independent evaluation reference", () => {
    const exactAnswers = getExactAnswerCatalog()
    const exactById = new Map(exactAnswers.map((answer) => [answer.id, answer]))
    const exactQuestionChecks = exactAnswers.map((answer) => ({
      normalized: normalizeExactQuestion(answer.question),
      tokens: tokenSet(answer.question),
    }))
    const normalizedExactQuestions = new Set(
      exactQuestionChecks.map((answer) => answer.normalized)
    )

    for (const entry of buildEvaluationCorpus()) {
      const reference = exactById.get(entry.referenceAnswerId)
      const normalizedQuestion = normalizeExactQuestion(entry.question)

      expect(reference).toBeDefined()
      expect(entry.referenceAnswer).toBe(reference?.text)
      expect(entry.expectedFactIds).toEqual(reference?.factIds)
      expect(entry.supportingExcerpts).toEqual(reference?.supportingExcerpts)
      expect(normalizedExactQuestions).not.toContain(normalizedQuestion)
      const copiedReference = exactQuestionChecks.find((exactQuestion) =>
        normalizedQuestion.includes(exactQuestion.normalized)
      )
      expect(copiedReference, entry.id).toBeUndefined()
      const questionTokens = tokenSet(entry.question)
      const maximumReferenceSimilarity = Math.max(
        ...exactQuestionChecks.map((exactQuestion) =>
          tokenSimilarity(questionTokens, exactQuestion.tokens)
        )
      )
      expect(maximumReferenceSimilarity, entry.id).toBeLessThan(0.7)
    }
  })

  it("covers difficult recruiter and chronology angles across the full catalog", () => {
    const corpus = buildEvaluationCorpus()
    const referenceIds = new Set(corpus.map((entry) => entry.referenceAnswerId))

    for (const referenceId of [
      "career-impact-metrics:highest-signal-outcomes",
      "career-impact-metrics:complex-professional-work",
      "career-impact-metrics:top-tenth-interpretation",
      "career-impact-metrics:bounded-early-work",
      "hiring-fit-due-diligence:weakness-due-diligence",
      "hiring-fit-due-diligence:candidate-comparison",
      "hiring-fit-due-diligence:recent-value",
      "hiring-fit-due-diligence:hiring-summary",
      "catalog-chronology-comparison:newest-project",
      "catalog-chronology-comparison:latest-blog",
      "catalog-chronology-comparison:evidence-relationship",
    ]) {
      expect(referenceIds, `missing ${referenceId}`).toContain(referenceId)
    }

    expect(
      new Set(
        corpus
          .filter((entry) => entry.category === "case-study")
          .map((entry) => entry.referenceAnswerId.split(":").at(-1))
      )
    ).toEqual(new Set(["problem", "architecture", "delivery"]))
    expect(
      new Set(
        corpus
          .filter((entry) => entry.category === "project")
          .map((entry) => entityRoot(entry.referenceAnswerId))
      ).size
    ).toBe(32)
    expect(
      new Set(
        corpus
          .filter((entry) => entry.category === "case-study")
          .map((entry) => entityRoot(entry.referenceAnswerId))
      ).size
    ).toBe(32)
  })

  it("keeps the known difficult visitor phrasings in the dynamic suite", () => {
    const questions = new Set(
      buildEvaluationCorpus().map((entry) => entry.question)
    )

    for (const question of [
      "Introduce him.",
      "What is his weakness?",
      "Show me some of his less complex work.",
      "What is his most complex work?",
      "What falls within the top 10% of his lifetime work?",
      "What is his latest work?",
      "How many total projects does he have?",
      "What is his latest blog?",
      "Why should a company hire him?",
    ]) {
      expect(questions).toContain(question)
    }
  })

  it("keeps direct visitor prompts concise instead of adding evaluator boilerplate", () => {
    const directQuestions = buildEvaluationCorpus().filter((entry) =>
      /^(?:How many|Which (?:article|project)|When|Where|What (?:date|time zone|is the (?:current number|total number)))/iu.test(
        entry.referenceQuestion
      )
    )

    expect(directQuestions.length).toBeGreaterThan(10)
    for (const entry of directQuestions) {
      expect(entry.question.length, entry.id).toBeLessThanOrEqual(120)
      expect(entry.question).not.toMatch(
        /I'm (?:deciding|assessing|reviewing|evaluating|preparing)/u
      )
    }
  })

  it("selects a small run across the corpus instead of taking one category prefix", () => {
    const corpus = buildEvaluationCorpus()
    const selected = selectEvaluationCases(corpus, 16)

    expect(selected).toHaveLength(16)
    expect(new Set(selected.map((entry) => entry.category))).toEqual(
      new Set(Object.keys(evaluationCategoryTargets))
    )
    expect(selected.map((entry) => entry.referenceAnswerId)).toEqual(
      expect.arrayContaining([
        "identity-current-availability:introduction",
        "career-impact-metrics:top-tenth-interpretation",
        "hiring-fit-due-diligence:weakness-due-diligence",
        "catalog-chronology-comparison:newest-project",
      ])
    )

    const projectCases = corpus.filter((entry) => entry.category === "project")
    const projectSample = selectEvaluationCases(projectCases, 6)
    expect(projectSample).toContain(projectCases[0])
    expect(projectSample).toContain(projectCases.at(-1))
  })
})

function entityRoot(referenceAnswerId: string) {
  return referenceAnswerId.slice(0, referenceAnswerId.lastIndexOf(":"))
}

function tokenSimilarity(leftTokens: Set<string>, rightTokens: Set<string>) {
  const intersection = [...leftTokens].filter((token) => rightTokens.has(token))
  const union = new Set([...leftTokens, ...rightTokens])
  return union.size === 0 ? 0 : intersection.length / union.size
}

function tokenSet(value: string) {
  return new Set(
    value
      .normalize("NFKC")
      .toLocaleLowerCase("en-US")
      .match(/[\p{L}\p{N}]+/gu) ?? []
  )
}
