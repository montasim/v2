import { decode } from "@toon-format/toon"
import { z } from "zod"

import exactAnswersToon from "@/features/chat/knowledge/exact-answers.toon?raw"

export const exactAnswerCategoryTargets = {
  project: 62,
  "case-study": 93,
  blog: 32,
  certification: 47,
  experience: 14,
  skill: 11,
  recommendation: 16,
  affiliation: 8,
  "identity-current-availability": 15,
  "career-impact-metrics": 25,
  "hiring-fit-due-diligence": 35,
  "leadership-collaboration": 20,
  "technical-depth": 30,
  "catalog-chronology-comparison": 20,
  "client-delivery-product-thinking": 15,
  "contributions-learning": 7,
} as const

export type ExactAnswerCategory = keyof typeof exactAnswerCategoryTargets

export interface ExactAnswer {
  readonly id: string
  readonly category: ExactAnswerCategory
  readonly question: string
  readonly text: string
  readonly factIds: readonly [string, ...string[]]
  readonly supportingExcerpts: readonly [string, ...string[]]
}

export interface ExactAnswerCatalog {
  readonly records: readonly ExactAnswer[]
  readonly find: (question: string) => ExactAnswer | undefined
}

export interface ExactAnswerCatalogMetadata {
  readonly schemaVersion: "portfolio-exact-answers/v1"
  readonly knowledgeHash: string
}

export interface LoadedExactAnswerArtifact {
  readonly metadata: ExactAnswerCatalogMetadata
  readonly catalog: ExactAnswerCatalog
}

export interface PortfolioExactAnswerCatalog {
  readonly knowledgeHash: string
  readonly find: (question: string) => ExactAnswer | undefined
}

const exactAnswerCategorySchema = z.enum([
  "project",
  "case-study",
  "blog",
  "certification",
  "experience",
  "skill",
  "recommendation",
  "affiliation",
  "identity-current-availability",
  "career-impact-metrics",
  "hiring-fit-due-diligence",
  "leadership-collaboration",
  "technical-depth",
  "catalog-chronology-comparison",
  "client-delivery-product-thinking",
  "contributions-learning",
])

const exactAnswerArtifactSchema = z
  .object({
    schemaVersion: z.literal("portfolio-exact-answers/v1"),
    knowledgeHash: z.string().regex(/^[a-f0-9]{64}$/),
    records: z
      .array(
        z
          .object({
            id: z.string().trim().min(1),
            category: exactAnswerCategorySchema,
            question: z.string().trim().min(1),
            text: z.string().trim().min(1),
            factIds: z.array(z.string().trim().min(1)).min(1),
            supportingExcerpts: z.array(z.string().trim().min(1)).min(1),
          })
          .strict()
      )
      .length(450),
  })
  .strict()

const apostrophes = /[\u2018\u2019\u201B\u02BC\uFF07]/g

export function normalizeExactQuestion(question: string): string {
  return question
    .normalize("NFKC")
    .toLocaleLowerCase("en-US")
    .replace(apostrophes, "'")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[?.]$/, "")
    .trimEnd()
}

export function createExactAnswerCatalog(
  records: readonly ExactAnswer[]
): ExactAnswerCatalog {
  const byQuestion = new Map<string, ExactAnswer>()
  const answerIds = new Set<string>()

  for (const record of records) {
    if (
      !record.id.trim() ||
      !record.question.trim() ||
      !record.text.trim() ||
      !record.factIds.length ||
      record.factIds.some((id) => !id.trim()) ||
      !record.supportingExcerpts.length ||
      record.supportingExcerpts.some((item) => !item.trim())
    ) {
      throw new Error(
        `Exact answer ${record.id || "<unknown>"} requires non-empty fields and support`
      )
    }
    if (answerIds.has(record.id)) {
      throw new Error(`Duplicate exact answer ID: ${record.id}`)
    }
    answerIds.add(record.id)

    const normalizedQuestion = normalizeExactQuestion(record.question)
    const duplicate = byQuestion.get(normalizedQuestion)

    if (duplicate) {
      throw new Error(
        `Duplicate normalized exact question: ${record.question} (${duplicate.id}, ${record.id})`
      )
    }

    byQuestion.set(normalizedQuestion, record)
  }

  return Object.freeze({
    records: Object.freeze([...records]),
    find(question: string) {
      return byQuestion.get(normalizeExactQuestion(question))
    },
  })
}

function assertCategoryAllocation(records: readonly ExactAnswer[]) {
  for (const [category, target] of Object.entries(exactAnswerCategoryTargets)) {
    const actual = records.filter(
      (record) => record.category === category
    ).length
    if (actual !== target) {
      throw new Error(
        `Exact-answer category ${category} requires ${target} records; received ${actual}`
      )
    }
  }
}

export function loadExactAnswerArtifact(
  toon: string
): LoadedExactAnswerArtifact {
  const decoded = exactAnswerArtifactSchema.parse(decode(toon))
  const records: readonly ExactAnswer[] = decoded.records.map((record) => ({
    ...record,
    factIds: nonEmpty(record.factIds, `${record.id} fact IDs`),
    supportingExcerpts: nonEmpty(
      record.supportingExcerpts,
      `${record.id} supporting excerpts`
    ),
  }))
  assertCategoryAllocation(records)

  return Object.freeze({
    metadata: Object.freeze({
      schemaVersion: decoded.schemaVersion,
      knowledgeHash: decoded.knowledgeHash,
    }),
    catalog: createExactAnswerCatalog(records),
  })
}

function nonEmpty(
  values: readonly string[],
  label: string
): readonly [string, ...string[]] {
  const [first, ...rest] = values
  if (!first) throw new Error(`${label} cannot be empty`)
  return [first, ...rest]
}

const loadedPortfolioExactAnswers = loadExactAnswerArtifact(exactAnswersToon)
const portfolioExactAnswerCatalog: PortfolioExactAnswerCatalog = Object.freeze({
  knowledgeHash: loadedPortfolioExactAnswers.metadata.knowledgeHash,
  find: loadedPortfolioExactAnswers.catalog.find,
})

export function getPortfolioExactAnswerCatalog(): PortfolioExactAnswerCatalog {
  return portfolioExactAnswerCatalog
}

export function getExactAnswerCatalog(): readonly ExactAnswer[] {
  return loadedPortfolioExactAnswers.catalog.records
}

export function getExactAnswerCatalogMetadata(): ExactAnswerCatalogMetadata {
  return loadedPortfolioExactAnswers.metadata
}

export function findExactAnswer(question: string): ExactAnswer | undefined {
  return portfolioExactAnswerCatalog.find(question)
}
