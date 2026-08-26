import {
  getExactAnswerCatalog,
  getExactAnswerCatalogMetadata,
} from "@/features/chat/knowledge/exact-answer-catalog"

export function loadOwnerStaticAnswers() {
  const metadata = getExactAnswerCatalogMetadata()

  return {
    knowledgeHash: metadata.knowledgeHash,
    records: getExactAnswerCatalog().map((record) => ({
      id: record.id,
      category: record.category,
      question: record.question,
      text: record.text,
      evidenceCount: record.factIds.length,
    })),
  }
}

export type OwnerStaticAnswerCatalog = ReturnType<typeof loadOwnerStaticAnswers>
