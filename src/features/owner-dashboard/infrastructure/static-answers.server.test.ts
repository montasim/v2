import { describe, expect, it } from "vitest"

import { loadOwnerStaticAnswers } from "./static-answers.server"

describe("loadOwnerStaticAnswers", () => {
  it("projects the versioned exact-answer artifact into read-only review data", () => {
    const catalog = loadOwnerStaticAnswers()

    expect(catalog.knowledgeHash).toMatch(/^[a-f0-9]{64}$/)
    expect(catalog.records).toHaveLength(450)
    expect(catalog.records[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        category: expect.any(String),
        question: expect.any(String),
        text: expect.any(String),
        evidenceCount: expect.any(Number),
      })
    )
    expect(catalog.records[0]).not.toHaveProperty("supportingExcerpts")
  })
})
