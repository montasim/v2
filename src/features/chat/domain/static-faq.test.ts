import { describe, expect, it } from "vitest"

import {
  getStaticFaqAnswer,
  staticFaqQuestions,
} from "@/features/chat/domain/static-faq"

describe("static portfolio FAQ", () => {
  it("provides a substantial grounded answer for every approved question", () => {
    expect(staticFaqQuestions).toHaveLength(52)
    expect(new Set(staticFaqQuestions).size).toBe(staticFaqQuestions.length)

    for (const question of staticFaqQuestions) {
      const result = getStaticFaqAnswer(question)

      expect(result?.question).toBe(question)
      expect(result?.answer.length).toBeGreaterThan(100)
      expect(result?.source).toBeTruthy()
      expect(result?.answer).not.toMatch(/[—–]/)
    }
  })

  it("matches capitalization, punctuation, spacing, and accents safely", () => {
    expect(getStaticFaqAnswer("  TELL ME ABOUT MONTASIM!!!  ")?.question).toBe(
      "Tell me about Montasim."
    )
    expect(
      getStaticFaqAnswer("Where can I download his resume?")?.question
    ).toBe("Where can I download his résumé?")
  })

  it("leaves unreviewed questions for the AI adapter", () => {
    expect(getStaticFaqAnswer("What should I ask next?")).toBeUndefined()
  })

  it("preserves authored paragraphs in detailed answers", () => {
    for (const question of [
      "Tell me about Montasim.",
      "What are his main professional achievements?",
      "Why should we hire Montasim?",
      "How does he ensure software reliability?",
    ]) {
      expect(getStaticFaqAnswer(question)?.answer.split("\n\n")).toHaveLength(2)
    }

    expect(
      getStaticFaqAnswer("Tell me about PostCraft.")?.answer
    ).not.toContain("\n\n")
  })
})
