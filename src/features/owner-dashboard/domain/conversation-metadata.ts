export type ConversationResponseMetadata = {
  responseKind?: string | null
  handoffReason?: string | null
  provider?: string | null
  model?: string | null
  servedModel?: string | null
  usedFallback?: boolean | null
  source?: string | null
}

/**
 * Formats the provenance of a saved answer for the owner dashboard.
 *
 * Only generated answers have model provenance. Reviewed and handoff answers
 * are intentionally labelled as non-model responses instead of rendering
 * empty provider/model placeholders.
 */
export function formatConversationResponseMetadata(
  item: ConversationResponseMetadata
) {
  const source = normalizedPart(item.source)

  if (item.responseKind === "generated") {
    return joinParts(
      normalizedPart(item.provider) ?? "Generated answer",
      normalizedPart(item.servedModel) ?? normalizedPart(item.model),
      item.usedFallback ? "fallback" : null,
      source
    )
  }

  if (item.responseKind === "common") {
    return joinParts("Reviewed answer", source)
  }

  if (item.responseKind === "exact") {
    return joinParts("Exact answer", source)
  }

  if (item.responseKind === "handoff") {
    return joinParts(handoffLabel(item.handoffReason), source)
  }

  if (item.responseKind === "noisy") {
    return joinParts("Filtered response (no model)", source)
  }

  if (item.responseKind === "safety") {
    return joinParts("Safety response (no model)", source)
  }

  return joinParts("Non-model response", source)
}

/** Formats persisted provider attempts without trusting their JSON shape. */
export function formatConversationProviderRoute(value: unknown) {
  if (!Array.isArray(value)) return null

  const attempts = value.flatMap((attempt) => {
    if (!isRecord(attempt)) return []
    const provider = readString(attempt.provider)
    if (!provider) return []
    const stage = readString(attempt.stage)
    const routeProvider =
      stage === "generation" || stage === "review"
        ? `${stage}: ${provider}`
        : provider

    const requestedModel = readString(attempt.requestedModel)
    const servedModel = readString(attempt.servedModel)
    const model =
      requestedModel && servedModel && requestedModel !== servedModel
        ? `${requestedModel} / ${servedModel}`
        : (servedModel ?? requestedModel)
    const reason = humanizeAttemptReason(readString(attempt.reason))
    const outcome = humanizeAttemptOutcome(readString(attempt.outcome))

    return [`${joinParts(routeProvider, model)} (${reason ?? outcome})`]
  })

  return attempts.length ? `Route: ${attempts.join(" → ")}` : null
}

function handoffLabel(reason: string | null | undefined) {
  if (reason === "contact-intent") return "Contact handoff (no model)"
  if (reason === "insufficient-evidence") {
    return "Evidence handoff (no model)"
  }
  if (reason === "unsafe-question") return "Safety response (no model)"
  if (reason === "provider-unavailable") {
    return "Provider handoff (no accepted model)"
  }
  return "Handoff (no model)"
}

function joinParts(...parts: Array<string | null | undefined>) {
  return parts.filter((part): part is string => Boolean(part)).join(" · ")
}

function normalizedPart(value: string | null | undefined) {
  const normalized = value?.trim()
  return normalized || null
}

function humanizeAttemptOutcome(value: string | null) {
  if (
    value === "accepted" ||
    value === "failed" ||
    value === "rejected" ||
    value === "skipped"
  ) {
    return value
  }
  return "attempted"
}

function humanizeAttemptReason(value: string | null) {
  if (!value) return null
  const knownReasons: Record<string, string> = {
    "provider-circuit-open": "circuit open",
    "rate-limited": "rate limited",
    "provider-unavailable": "provider unavailable",
    authentication: "authentication failed",
    "policy-violation": "policy violation",
    "openrouter-cost-not-proven-zero": "zero cost not verified",
    "invalid-json": "invalid response",
  }
  if (knownReasons[value]) return knownReasons[value]

  return value
    .slice(0, 120)
    .split(",")
    .map((reason) => reason.trim().replace(/[-_]+/g, " "))
    .filter(Boolean)
    .join(", ")
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function readString(value: unknown) {
  return typeof value === "string" ? normalizedPart(value) : null
}
