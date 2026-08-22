import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { cosineDistance, desc, sql } from "drizzle-orm"
import { embed } from "ai"

import type { PortfolioEvidenceRetriever } from "@/features/chat/application/ports/portfolio-evidence-retriever"
import type { PortfolioCitation } from "@/features/chat/domain/portfolio-citations"
import type { PortfolioEvidence } from "@/features/chat/domain/portfolio-evidence"
import { selectPortfolioEvidence } from "@/features/chat/domain/portfolio-evidence"
import {
  asksForUnpublishedDetail,
  isPromptInjectionAttempt,
} from "@/features/chat/domain/question-safety"
import { portfolioEvidenceDocuments } from "@/db/schema"
import { getDatabase } from "@/db/client.server"
import { logger } from "@/lib/logger.server"

export const PORTFOLIO_EMBEDDING_MODEL = "gemini-embedding-001"
export const PORTFOLIO_EMBEDDING_DIMENSIONS = 768
const MINIMUM_SIMILARITY = 0.58
const RELATIVE_SIMILARITY_WINDOW = 0.06
const MAX_MATCHES = 6
const MAX_CONTEXT_CHARACTERS = 12_000

interface EvidenceSearchMatch {
  id?: string
  source: string
  title: string
  content: string
  citation: PortfolioCitation
  similarity: number
}

interface VectorEvidenceDependencies {
  embedQuery: (question: string, signal?: AbortSignal) => Promise<number[]>
  search: (
    question: string,
    embedding: number[]
  ) => Promise<readonly EvidenceSearchMatch[]>
}

export function createVectorEvidenceRetriever(
  dependencies: VectorEvidenceDependencies
): PortfolioEvidenceRetriever {
  return {
    async retrieve(question, signal) {
      if (isPromptInjectionAttempt(question)) {
        return unsupportedEvidence(
          "The question requests hidden instructions or private records, which are outside the public portfolio."
        )
      }
      if (asksForUnpublishedDetail(question)) {
        return unsupportedEvidence(
          "The public portfolio does not provide the requested personal preference, compensation, or management-scope detail."
        )
      }

      const embedding = await dependencies.embedQuery(question, signal)
      const matches = await dependencies.search(question, embedding)

      if (matches.length === 0) {
        throw new Error("Portfolio evidence has not been indexed.")
      }

      const bestSimilarity = matches[0]?.similarity ?? 0
      const relevant = matches.filter(
        (match) =>
          match.similarity >= MINIMUM_SIMILARITY &&
          match.similarity >= bestSimilarity - RELATIVE_SIMILARITY_WINDOW
      )
      if (relevant.length === 0) return unsupportedEvidence()

      return assembleEvidence(
        focusCanonicalSummaryMatch(focusDominantWritingMatch(relevant)),
        question
      )
    },
  }
}

function focusCanonicalSummaryMatch(
  matches: readonly EvidenceSearchMatch[]
): readonly EvidenceSearchMatch[] {
  return matches[0]?.id === "career:measurable-impact"
    ? matches.slice(0, 1)
    : matches
}

function focusDominantWritingMatch(
  matches: readonly EvidenceSearchMatch[]
): readonly EvidenceSearchMatch[] {
  const leading = matches.slice(0, 3)
  const href = leading[0]?.citation.href
  const kind = leading[0]?.citation.kind
  const hasDominantWritingMatch =
    leading.length === 3 &&
    (kind === "blog" || kind === "case-study") &&
    leading.every((match) => match.citation.href === href)

  return hasDominantWritingMatch
    ? matches.filter((match) => match.citation.href === href)
    : matches
}

export class ResilientPortfolioEvidenceRetriever implements PortfolioEvidenceRetriever {
  constructor(
    private readonly vectorRetriever: PortfolioEvidenceRetriever = createDefaultVectorRetriever()
  ) {}

  async retrieve(question: string, signal?: AbortSignal) {
    try {
      return await this.vectorRetriever.retrieve(question, signal)
    } catch (error) {
      logger.warn(
        { errorType: error instanceof Error ? error.name : "UnknownError" },
        "Vector evidence retrieval failed; using deterministic evidence"
      )
      return selectPortfolioEvidence(question)
    }
  }
}

function createDefaultVectorRetriever() {
  return createVectorEvidenceRetriever({
    async embedQuery(question, signal) {
      const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
      if (!apiKey) throw new Error("Gemini embeddings are not configured.")

      const google = createGoogleGenerativeAI({ apiKey })
      const result = await embed({
        model: google.embedding(PORTFOLIO_EMBEDDING_MODEL),
        value: question,
        abortSignal: signal,
        maxRetries: 0,
        providerOptions: {
          google: {
            outputDimensionality: PORTFOLIO_EMBEDDING_DIMENSIONS,
            taskType: "RETRIEVAL_QUERY",
          },
        },
      })
      return result.embedding
    },
    async search(question, embedding) {
      const similarity = sql<number>`1 - (${cosineDistance(
        portfolioEvidenceDocuments.embedding,
        embedding
      )})`
      const lexicalRank = sql<number>`ts_rank_cd(
        to_tsvector('english', ${portfolioEvidenceDocuments.title} || ' ' || ${portfolioEvidenceDocuments.content}),
        websearch_to_tsquery('english', ${question})
      )`
      const relevance = sql<number>`${similarity} + least(${lexicalRank}, 0.15)`
      const rows = await getDatabase()
        .select({
          id: portfolioEvidenceDocuments.id,
          source: portfolioEvidenceDocuments.source,
          title: portfolioEvidenceDocuments.title,
          content: portfolioEvidenceDocuments.content,
          citationLabel: portfolioEvidenceDocuments.citationLabel,
          citationHref: portfolioEvidenceDocuments.citationHref,
          citationKind: portfolioEvidenceDocuments.citationKind,
          similarity: relevance,
        })
        .from(portfolioEvidenceDocuments)
        .orderBy(desc(relevance))
        .limit(MAX_MATCHES)

      return rows.map((row) => ({
        id: row.id,
        source: row.source,
        title: row.title,
        content: row.content,
        similarity: Number(row.similarity),
        citation: {
          label: row.citationLabel,
          href: row.citationHref,
          kind: row.citationKind as PortfolioCitation["kind"],
        },
      }))
    },
  })
}

function assembleEvidence(
  matches: readonly EvidenceSearchMatch[],
  question: string
): PortfolioEvidence {
  const sources = Array.from(new Set(matches.map((match) => match.source)))
  const citations = new Map<string, PortfolioCitation>()
  const context: string[] = []
  let contextLength = 0

  for (const match of matches) {
    const section = `${match.source.toUpperCase()}: ${match.title}\n${match.content}`
    if (contextLength + section.length > MAX_CONTEXT_CHARACTERS) break
    context.push(section)
    contextLength += section.length
    if (!citations.has(match.citation.href)) {
      citations.set(match.citation.href, match.citation)
    }
  }

  if (asksForUndocumentedTradeoff(question, matches)) {
    context.push(
      "EVIDENCE LIMITATION: The retrieved records do not explicitly document a tradeoff. State that limitation instead of inferring cost, latency, vendor dependence, retries, guarantees, or other operational behavior."
    )
  }

  return {
    source: joinSources(sources),
    context: context.join("\n\n"),
    citations: selectVisibleCitations(matches, citations, question),
  }
}

function asksForUndocumentedTradeoff(
  question: string,
  matches: readonly EvidenceSearchMatch[]
) {
  const asksForTradeoff = /\btrade[ -]?offs?\b/i.test(question)
  const documentsTradeoff = matches.some((match) =>
    /\btrade[ -]?offs?\b/i.test(`${match.title} ${match.content}`)
  )
  return asksForTradeoff && !documentsTradeoff
}

function selectVisibleCitations(
  matches: readonly EvidenceSearchMatch[],
  citations: ReadonlyMap<string, PortfolioCitation>,
  question: string
) {
  const normalized = question.toLowerCase()
  const requestsEducationAndCertifications =
    normalized.includes("education") && normalized.includes("certif")

  if (requestsEducationAndCertifications) {
    const requestedSources = ["Education", "Certifications"]
    return requestedSources.flatMap((source) => {
      const match = matches.find(
        (candidate) =>
          candidate.source === source && citations.has(candidate.citation.href)
      )
      return match ? [match.citation] : []
    })
  }

  return Array.from(citations.values()).slice(0, 1)
}

function unsupportedEvidence(
  reason = "The retrieved portfolio evidence does not contain information relevant enough to answer this question."
): PortfolioEvidence {
  return {
    source: "Portfolio",
    context: `PROFILE IDENTITY\nName: Mohammad Montasim Al Mamun Shuvo. ${reason}`,
    citations: [],
  }
}

function joinSources(sources: readonly string[]) {
  if (sources.length === 1) return sources[0]
  if (sources.length === 2) return `${sources[0]} and ${sources[1]}`
  return `${sources.slice(0, -1).join(", ")}, and ${sources.at(-1)}`
}
