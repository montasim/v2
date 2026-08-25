import type { PortfolioMessageMetadata } from "@/features/chat/domain/chat"

export function formatChatResponseProvenance(
  metadata: PortfolioMessageMetadata | undefined
) {
  const source = normalized(metadata?.source) ?? "Portfolio"

  if (metadata?.responseKind === "generated" || metadata?.provider) {
    return join(
      metadata.provider ?? "Generated answer",
      formatModel(metadata),
      (metadata.fallbackDepth ?? 0) > 0 ? "fallback" : undefined,
      source
    )
  }
  if (metadata?.responseKind === "exact") return join("Exact answer", source)
  if (metadata?.responseKind === "handoff") {
    return join("No accepted model", source)
  }
  return join("Portfolio source", source)
}

function formatModel(metadata: PortfolioMessageMetadata) {
  const requested = normalized(metadata.requestedModel)
  const served = normalized(metadata.servedModel)
  if (requested && served && requested !== served) {
    return `${requested} / ${served}`
  }
  return served ?? requested ?? normalized(metadata.model)
}

function join(...parts: Array<string | undefined>) {
  return parts.filter((part): part is string => Boolean(part)).join(" · ")
}

function normalized(value: string | undefined) {
  const result = value?.trim()
  return result || undefined
}
