import { createHash } from "node:crypto"

import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { eq, inArray, notInArray } from "drizzle-orm"
import { embedMany } from "ai"

import { getDatabase } from "@/db/client.server"
import { portfolioEvidenceDocuments } from "@/db/schema"
import { buildPortfolioEvidenceDocuments } from "@/features/chat/domain/portfolio-evidence-documents"
import {
  PORTFOLIO_EMBEDDING_DIMENSIONS,
  PORTFOLIO_EMBEDDING_MODEL,
} from "@/features/chat/infrastructure/evidence/vector-retriever.server"

const FREE_TIER_BATCH_SIZE = 75
const FREE_TIER_BATCH_INTERVAL_MS = 60_000

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
if (!apiKey) {
  throw new Error(
    "GOOGLE_GENERATIVE_AI_API_KEY is required to index chat evidence."
  )
}
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to index chat evidence.")
}

const database = getDatabase()
const documents = buildPortfolioEvidenceDocuments().map((document) => ({
  ...document,
  contentHash: createHash("sha256")
    .update(`${document.title}\n${document.content}`)
    .digest("hex"),
}))
const existing = await database
  .select({
    id: portfolioEvidenceDocuments.id,
    contentHash: portfolioEvidenceDocuments.contentHash,
    embeddingModel: portfolioEvidenceDocuments.embeddingModel,
  })
  .from(portfolioEvidenceDocuments)
const existingById = new Map(existing.map((row) => [row.id, row]))
const changed = documents.filter((document) => {
  const row = existingById.get(document.id)
  return (
    !row ||
    row.contentHash !== document.contentHash ||
    row.embeddingModel !== PORTFOLIO_EMBEDDING_MODEL
  )
})

if (changed.length > 0) {
  const google = createGoogleGenerativeAI({ apiKey })
  const batches = chunk(changed, FREE_TIER_BATCH_SIZE)

  for (const [batchIndex, batch] of batches.entries()) {
    process.stdout.write(
      `Embedding batch ${batchIndex + 1}/${batches.length} (${batch.length} documents)...\n`
    )
    const { embeddings } = await embedMany({
      model: google.embedding(PORTFOLIO_EMBEDDING_MODEL),
      values: batch.map(
        (document) => `title: ${document.title} | text: ${document.content}`
      ),
      maxRetries: 4,
      providerOptions: {
        google: {
          outputDimensionality: PORTFOLIO_EMBEDDING_DIMENSIONS,
          taskType: "RETRIEVAL_DOCUMENT",
        },
      },
    })

    for (const [index, document] of batch.entries()) {
      const embedding = embeddings[index]
      await upsertDocument(document, embedding)
    }

    if (batchIndex < batches.length - 1) {
      process.stdout.write(
        "Waiting for the Gemini free-tier embedding window...\n"
      )
      await delay(FREE_TIER_BATCH_INTERVAL_MS)
    }
  }
}

const documentIds = documents.map((document) => document.id)
if (documentIds.length > 0) {
  await database
    .delete(portfolioEvidenceDocuments)
    .where(notInArray(portfolioEvidenceDocuments.id, documentIds))
} else {
  await database
    .delete(portfolioEvidenceDocuments)
    .where(
      eq(portfolioEvidenceDocuments.embeddingModel, PORTFOLIO_EMBEDDING_MODEL)
    )
}

const indexed = await database
  .select({ id: portfolioEvidenceDocuments.id })
  .from(portfolioEvidenceDocuments)
  .where(inArray(portfolioEvidenceDocuments.id, documentIds))

process.stdout.write(
  `Chat evidence is current: ${indexed.length} documents (${changed.length} embedded).\n`
)

async function upsertDocument(
  document: (typeof changed)[number],
  embedding: number[]
) {
  await database
    .insert(portfolioEvidenceDocuments)
    .values({
      id: document.id,
      source: document.source,
      title: document.title,
      content: document.content,
      citationLabel: document.citation.label,
      citationHref: document.citation.href,
      citationKind: document.citation.kind,
      contentHash: document.contentHash,
      embeddingModel: PORTFOLIO_EMBEDDING_MODEL,
      embedding,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: portfolioEvidenceDocuments.id,
      set: {
        source: document.source,
        title: document.title,
        content: document.content,
        citationLabel: document.citation.label,
        citationHref: document.citation.href,
        citationKind: document.citation.kind,
        contentHash: document.contentHash,
        embeddingModel: PORTFOLIO_EMBEDDING_MODEL,
        embedding,
        updatedAt: new Date(),
      },
    })
}

function chunk<T>(values: readonly T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size))
  }
  return chunks
}

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}
