import { PORTFOLIO_CHAT_POLICY_VERSION } from "@/features/chat/domain/portfolio-chat"

export { PORTFOLIO_CHAT_POLICY_VERSION }

export interface ChatKnowledgeScope {
  policyVersion: string
  knowledgeHash: string
}

export function createPortfolioChatKnowledgeScope(
  knowledgeHash: string
): ChatKnowledgeScope {
  if (!/^[a-f0-9]{64}$/.test(knowledgeHash)) {
    throw new Error(
      "The portfolio knowledge hash must be 64 lowercase hex characters."
    )
  }

  return {
    policyVersion: PORTFOLIO_CHAT_POLICY_VERSION,
    knowledgeHash,
  }
}
