import { encode } from "@toon-format/toon"
import { describe, expect, it } from "vitest"
import { getCompiledPortfolioKnowledge } from "@/features/chat/knowledge/portfolio-knowledge.server"
import { buildPortfolioExactAnswers } from "@/features/chat/knowledge/exact-answer-source"

import {
  createExactAnswerCatalog,
  exactAnswerCategoryTargets,
  findExactAnswer,
  getExactAnswerCatalog,
  getExactAnswerCatalogMetadata,
  getPortfolioExactAnswerCatalog,
  loadExactAnswerArtifact,
  normalizeExactQuestion,
} from "@/features/chat/knowledge/exact-answer-catalog"
import type { ExactAnswer } from "@/features/chat/knowledge/exact-answer-catalog"

describe("normalizeExactQuestion", () => {
  it("normalizes only the approved exact-match differences", () => {
    expect(
      normalizeExactQuestion(
        "  WHICH role does Montasim hold now, and what work defines it?  "
      )
    ).toBe("which role does montasim hold now, and what work defines it")
    expect(normalizeExactQuestion("What\t is   his top 20% work.")).toBe(
      "what is his top 20% work"
    )
  })

  it("keeps materially different numbers distinct", () => {
    expect(normalizeExactQuestion("What is his top 20% work?")).not.toBe(
      normalizeExactQuestion("What is his top 10% work?")
    )
  })
})

describe("createExactAnswerCatalog", () => {
  const evidence: ExactAnswer = {
    id: "test:current-role",
    category: "identity-current-availability",
    question: "Which role does this engineer hold now?",
    text: "Montasim is a Senior Software Engineer.",
    factIds: ["experience:experience-mymedicalhub-senior-software-engineer"],
    supportingExcerpts: ["Role: Senior Software Engineer"],
  }

  it("finds only normalized exact questions", () => {
    const catalog = createExactAnswerCatalog([evidence])

    expect(catalog.find(" WHICH role does this engineer hold now. ")).toEqual(
      evidence
    )
    expect(catalog.find("What role would suit Montasim?")).toBeUndefined()
  })

  it("rejects duplicate normalized questions", () => {
    expect(() =>
      createExactAnswerCatalog([
        evidence,
        {
          ...evidence,
          id: "test:duplicate",
          question: " which role does this engineer hold now. ",
        },
      ])
    ).toThrow(/duplicate normalized exact question/i)
  })

  it("rejects duplicate IDs and incomplete support", () => {
    expect(() =>
      createExactAnswerCatalog([
        evidence,
        {
          ...evidence,
          question: "Which role is current?",
        },
      ])
    ).toThrow(/duplicate exact answer id/i)

    expect(() =>
      createExactAnswerCatalog([
        { ...evidence, text: " ", supportingExcerpts: [" "] },
      ])
    ).toThrow(/requires non-empty/i)
  })
})

describe("portfolio exact answers", () => {
  it("contains the approved number of independently traceable records", () => {
    const records = getExactAnswerCatalog()

    expect(records).toHaveLength(468)
    expect(new Set(records.map((record) => record.id)).size).toBe(468)
    expect(
      new Set(records.map((record) => normalizeExactQuestion(record.question)))
        .size
    ).toBe(468)

    for (const record of records) {
      expect(record.text.trim().length, record.id).toBeGreaterThan(40)
      expect(record.factIds.length, record.id).toBeGreaterThan(0)
      expect(record.supportingExcerpts.length, record.id).toBeGreaterThan(0)
      expect(record.text, record.id).not.toMatch(/undefined|null/)
    }
  })

  it("keeps recruiter-facing prose grammatical and evidence-calibrated", () => {
    const prohibitedPhrases = [
      /\b(?:as|is|was) a extension\b/i,
      /\b(?:as|is|was) a api\b/i,
      /\bcan verifiably do\b/i,
      /\bforms? of shipped engineering work\b/i,
      /\bshipped-project catalog\b/i,
      /\bindependently shipped projects\b/i,
      /\bwith shipped examples\b/i,
      /\bThe attributed recommendation begins\b/i,
      /\bIt verifies the learning activity\b/i,
      /\b\d+\. (?:He|Montasim) \d+%\b/,
      /\bwith scope spanning [^.]*\b(?:ai|api|http|svg)\b/,
      /\bdistributed as [^.]*\bapi:/,
      /\b(?:aPI|hTTP|uI|uX)\b/,
      /\bMontasim studied (?:Bachelor|Higher Secondary|Secondary School)\b/,
      /\b(?:meticulously managed|vibrant and memorable)\b/i,
      /\bissued by (.+?) through \1 in\b/i,
    ]

    for (const record of getExactAnswerCatalog()) {
      for (const prohibitedPhrase of prohibitedPhrases) {
        expect(record.text, record.id).not.toMatch(prohibitedPhrase)
      }
    }
  })

  it("keeps reusable answers useful to hiring teams, developers, and clients", () => {
    const reusableCategories = new Set<ExactAnswer["category"]>([
      "project",
      "case-study",
      "blog",
      "certification",
      "experience",
      "skill",
      "recommendation",
      "affiliation",
    ])
    const reusableAnswers = getExactAnswerCatalog().filter((record) =>
      reusableCategories.has(record.category)
    )

    for (const record of reusableAnswers) {
      expect(record.text, record.id).toMatch(
        /hiring|client|reviewer|developer|interviewer|production|applied ability|paid engineering/i
      )
    }

    for (const record of reusableAnswers.filter(
      (answer) => answer.category === "project"
    )) {
      expect(record.factIds, record.id).toEqual(
        expect.arrayContaining([expect.stringMatching(/^case-study:/)])
      )
    }

    const fullStackAnswer = reusableAnswerById(
      "hiring-fit-due-diligence:full-stack-fit"
    )
    expect(fullStackAnswer.text).toContain(
      "does not claim production Laravel experience"
    )
  })

  it("answers recommendation questions with attributed insight, not endorsement", () => {
    const recommendations = getExactAnswerCatalog().filter(
      (record) => record.category === "recommendation"
    )

    expect(recommendations).toHaveLength(16)
    for (const record of recommendations) {
      expect(record.text, record.id).toMatch(
        /attributed feedback|attributes? the feedback|says|writes/i
      )
      expect(record.text, record.id).not.toMatch(
        /\b(?:highly |wholeheartedly )?recommend(?:s|ed)?\b|\bendorse(?:s|d)?\b/i
      )
      expect(record.text.split(/\s+/).length, record.id).toBeLessThanOrEqual(90)
    }
  })

  it("keeps the committed TOON artifact synchronized with its source build", () => {
    expect(getExactAnswerCatalog()).toEqual(buildPortfolioExactAnswers())
  })

  it("meets every approved category allocation exactly", () => {
    const actualCounts = Object.fromEntries(
      Object.keys(exactAnswerCategoryTargets).map((category) => [
        category,
        getExactAnswerCatalog().filter((record) => record.category === category)
          .length,
      ])
    )

    expect(actualCounts).toEqual(exactAnswerCategoryTargets)
  })

  it("serves a catalog answer only for an exact normalized question", () => {
    const answer = findExactAnswer(
      "WHICH ROLE DOES MONTASIM HOLD NOW, AND WHAT WORK DEFINES IT?"
    )

    expect(answer?.text).toContain("Senior Software Engineer")
    expect(answer?.factIds).toContain(
      "experience:experience-mymedicalhub-senior-software-engineer"
    )
    expect(findExactAnswer("What is Montasim's next role?")).toBeUndefined()
    expect(findExactAnswer("What is Montasim's current role?")).toBeUndefined()
  })

  it("publishes static answers for the updated project count and new extension context", () => {
    const projectCount = reusableAnswerById(
      "catalog-chronology-comparison:project-count"
    )
    expect(projectCount.text).toContain("34 project records")
    expect(projectCount.factIds).toEqual(["derived:catalog-count:projects"])

    const bugReceiptAnswers = getExactAnswerCatalog().filter(
      (record) =>
        record.id.startsWith("project:project-bugreceipt:") ||
        record.id.startsWith("case-study:bugreceipt:") ||
        record.id ===
          "blog:reproducible-bug-reports-without-default-surveillance"
    )

    expect(bugReceiptAnswers.map((record) => record.id)).toEqual([
      "project:project-bugreceipt:overview",
      "project:project-bugreceipt:technology",
      "case-study:bugreceipt:problem",
      "case-study:bugreceipt:architecture",
      "case-study:bugreceipt:delivery",
      "blog:reproducible-bug-reports-without-default-surveillance",
    ])
    expect(
      reusableAnswerById("project:project-bugreceipt:overview").factIds
    ).toEqual([
      "project:project-bugreceipt",
      "case-study:bugreceipt:problem",
      "case-study:bugreceipt:outcomes",
    ])

    const oneSnapAnswers = getExactAnswerCatalog().filter(
      (record) =>
        record.id.startsWith("project:project-1snap:") ||
        record.id.startsWith("case-study:1snap:") ||
        record.id === "blog:full-page-screenshots-without-cloud-capture"
    )
    expect(oneSnapAnswers.map((record) => record.id)).toEqual([
      "project:project-1snap:overview",
      "project:project-1snap:technology",
      "case-study:1snap:problem",
      "case-study:1snap:architecture",
      "case-study:1snap:delivery",
      "blog:full-page-screenshots-without-cloud-capture",
    ])
    expect(
      reusableAnswerById("project:project-1snap:overview").factIds
    ).toEqual([
      "project:project-1snap",
      "case-study:1snap:problem",
      "case-study:1snap:outcomes",
    ])
  })

  it("exposes one immutable runtime catalog seam", () => {
    const catalog = getPortfolioExactAnswerCatalog()

    expect(catalog.knowledgeHash).toBe(getCompiledPortfolioKnowledge().hash)
    expect(
      catalog.find(
        "WHICH ROLE DOES MONTASIM HOLD NOW, AND WHAT WORK DEFINES IT?"
      )
    ).toEqual(
      findExactAnswer(
        "Which role does Montasim hold now, and what work defines it?"
      )
    )
    expect(Object.isFrozen(catalog)).toBe(true)
  })

  it("references only facts from the compiled portfolio knowledge", () => {
    const knowledge = getCompiledPortfolioKnowledge()

    expect(getExactAnswerCatalogMetadata()).toEqual({
      schemaVersion: "portfolio-exact-answers/v1",
      knowledgeHash: knowledge.hash,
    })

    for (const record of getExactAnswerCatalog()) {
      for (const factId of record.factIds) {
        expect(
          knowledge.findFact(factId),
          `${record.id} references ${factId}`
        ).toBeDefined()
      }
      expect(record.supportingExcerpts, record.id).not.toContain("undefined")
      for (const supportingExcerpt of record.supportingExcerpts) {
        expect(
          record.factIds.some((factId) =>
            knowledge.textForFact(factId)?.includes(supportingExcerpt)
          ),
          `${record.id} has an untraceable supporting excerpt`
        ).toBe(true)
      }
    }
  })

  it("keeps every numeric claim traceable to its cited facts", () => {
    const knowledge = getCompiledPortfolioKnowledge()

    for (const record of getExactAnswerCatalog()) {
      const citedEvidence = record.factIds
        .map((factId) => knowledge.textForFact(factId) ?? "")
        .join(" ")
        .replace(/,/g, "")
      const numericClaims = Array.from(
        new Set(
          record.text.replace(/,/g, "").match(/\b\d+(?:\.\d+)?(?:%|\+)?/g) ?? []
        )
      )

      for (const numericClaim of numericClaims) {
        expect(citedEvidence, `${record.id} claims ${numericClaim}`).toContain(
          numericClaim
        )
      }
    }
  })

  it("fails closed when a TOON artifact does not satisfy the catalog schema", () => {
    expect(() =>
      loadExactAnswerArtifact(
        encode({
          schemaVersion: "portfolio-exact-answers/v1",
          knowledgeHash: "0".repeat(64),
          records: [],
        })
      )
    ).toThrow()
  })
})

function reusableAnswerById(id: string): ExactAnswer {
  const record = getExactAnswerCatalog().find((answer) => answer.id === id)
  expect(record, id).toBeDefined()
  return record as ExactAnswer
}
