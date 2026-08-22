import type { PortfolioEvidence } from "@/features/chat/domain/portfolio-evidence"

export interface PortfolioEvidenceRetriever {
  retrieve: (
    question: string,
    signal?: AbortSignal
  ) => Promise<PortfolioEvidence>
}
