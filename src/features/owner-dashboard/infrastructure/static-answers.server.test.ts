import { describe, expect, it } from "vitest"

import { loadOwnerStaticAnswers } from "./static-answers.server"

describe("loadOwnerStaticAnswers", () => {
  it("projects the versioned exact-answer artifact into read-only review data", () => {
    const catalog = loadOwnerStaticAnswers()

    expect(catalog.knowledgeHash).toMatch(/^[a-f0-9]{64}$/)
    expect(catalog.records).toHaveLength(462)
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

    expect(
      catalog.records.find(
        (record) => record.id === "catalog-chronology-comparison:project-count"
      )?.text
    ).toContain("33 project records")
    expect(
      catalog.records
        .filter(
          (record) =>
            record.id.startsWith("project:project-bugreceipt:") ||
            record.id.startsWith("case-study:bugreceipt:") ||
            record.id ===
              "blog:reproducible-bug-reports-without-default-surveillance"
        )
        .map((record) => record.question)
    ).toEqual([
      "What is Montasim's BugReceipt project?",
      "Which technologies did Montasim use for BugReceipt?",
      "What problem did Montasim address in the BugReceipt case study?",
      "How did Montasim structure the BugReceipt solution?",
      "What did Montasim deliver and achieve with BugReceipt?",
      "What engineering insight does Montasim share in “Turning ‘It Broke’ Into Reproducible Evidence Without Default Surveillance”?",
    ])

    expect(
      catalog.records
        .filter(
          (record) =>
            record.id.startsWith("project:project-1snap:") ||
            record.id.startsWith("case-study:1snap:") ||
            record.id === "blog:full-page-screenshots-without-cloud-capture"
        )
        .map((record) => record.question)
    ).toEqual([
      "What is Montasim's 1Snap project?",
      "Which technologies did Montasim use for 1Snap?",
      "What problem did Montasim address in the 1Snap case study?",
      "How did Montasim structure the 1Snap solution?",
      "What did Montasim deliver and achieve with 1Snap?",
      "What engineering insight does Montasim share in “Capturing the Whole Page Without Sending It to the Cloud”?",
    ])
  })
})
