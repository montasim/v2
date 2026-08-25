import { createHash } from "node:crypto"
import { encode } from "@toon-format/toon"

import {
  assemblePortfolioKnowledge,
  flattenFactText,
} from "@/features/chat/knowledge/portfolio-knowledge-assembly"
import { loadPortfolioSourceSnapshots } from "@/features/chat/knowledge/portfolio-knowledge-sources"
import type { PortfolioSourceSnapshot } from "@/features/chat/knowledge/portfolio-knowledge-sources"
import type {
  CompiledPortfolioKnowledge,
  JsonValue,
  PortfolioKnowledgeCitation,
  PortfolioKnowledgeFact,
  PortfolioKnowledgeRelationship,
  PortfolioKnowledgeSourceManifest,
} from "@/features/chat/knowledge/portfolio-knowledge-types"

export type {
  CompiledPortfolioKnowledge,
  CurrentRoleKnowledge,
  EvidenceRole,
  JsonPrimitive,
  JsonValue,
  LatestDatedBlogKnowledge,
  PortfolioCatalogCount,
  PortfolioDerivedKnowledge,
  PortfolioKnowledgeCitation,
  PortfolioKnowledgeFact,
  PortfolioKnowledgeRelationship,
  PortfolioKnowledgeSourceId,
  PortfolioKnowledgeSourceManifest,
  PortfolioKnowledgeSourceManifestEntry,
  ProjectChronologyKnowledge,
} from "@/features/chat/knowledge/portfolio-knowledge-types"

const schemaVersion = "portfolio-knowledge/v1" as const

function isJsonObject(
  value: JsonValue | undefined
): value is { readonly [key: string]: JsonValue } {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function canonicalize(value: JsonValue): JsonValue {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (!isJsonObject(value)) return value

  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, canonicalize(child)])
  )
}

function canonicalStringify(value: JsonValue) {
  return JSON.stringify(canonicalize(value))
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex")
}

function compileSourceManifest(
  sources: readonly PortfolioSourceSnapshot[]
): PortfolioKnowledgeSourceManifest {
  return {
    schemaVersion: "portfolio-source-manifest/v1",
    sources: sources.map((source) => ({
      id: source.id,
      filename: source.filename,
      recordCount: source.records.length,
      hash: sha256(
        canonicalStringify({
          metadata: source.metadata ?? null,
          records: source.records.map((record) => ({
            id: record.id,
            title: record.title,
            value: record.value,
          })),
        })
      ),
    })),
  }
}

function assertUniqueIds<T extends { readonly id: string }>(
  values: readonly T[],
  label: string
) {
  if (new Set(values.map((value) => value.id)).size !== values.length) {
    throw new Error(
      `Compiled portfolio knowledge contains duplicate ${label} IDs`
    )
  }
}

function assertKnowledgeIntegrity(
  facts: readonly PortfolioKnowledgeFact[],
  citations: readonly PortfolioKnowledgeCitation[],
  relationships: readonly PortfolioKnowledgeRelationship[]
) {
  assertUniqueIds(facts, "fact")
  assertUniqueIds(citations, "citation")
  assertUniqueIds(relationships, "relationship")

  const citationIds = new Set(citations.map((citation) => citation.id))
  for (const fact of facts) {
    if (!citationIds.has(fact.citationId)) {
      throw new Error(
        `Fact ${fact.id} references unknown citation ${fact.citationId}`
      )
    }
  }
}

function scalarFingerprint(value: JsonValue): readonly string[] {
  if (value === null) return ["null"]
  if (typeof value !== "object")
    return [`${typeof value}:${JSON.stringify(value)}`]
  if (Array.isArray(value)) return value.flatMap(scalarFingerprint)
  return Object.values(value).flatMap(scalarFingerprint)
}

function assertLosslessSourceContent(
  sources: readonly PortfolioSourceSnapshot[],
  facts: readonly PortfolioKnowledgeFact[]
) {
  for (const source of sources) {
    const expected = [
      ...(source.metadata ? scalarFingerprint(source.metadata) : []),
      ...source.records.flatMap((record) => scalarFingerprint(record.value)),
    ].sort()
    const actual = facts
      .filter((fact) => fact.source === source.id)
      .flatMap((fact) => scalarFingerprint(fact.data))
      .sort()

    if (
      expected.length !== actual.length ||
      expected.some((value, index) => value !== actual[index])
    ) {
      throw new Error(
        `${source.filename} was not preserved exactly once in knowledge facts`
      )
    }
  }
}

function deepFreeze<T>(value: T): T {
  if (
    (typeof value !== "object" && typeof value !== "function") ||
    value === null ||
    Object.isFrozen(value)
  ) {
    return value
  }

  for (const property of Reflect.ownKeys(value)) {
    deepFreeze((value as Record<PropertyKey, unknown>)[property])
  }
  return Object.freeze(value)
}

export function compilePortfolioKnowledge(): CompiledPortfolioKnowledge {
  const sources = loadPortfolioSourceSnapshots()
  const sourceManifest = compileSourceManifest(sources)
  const assembly = assemblePortfolioKnowledge(sources)
  const { facts, citations, relationships, derived } = assembly

  assertLosslessSourceContent(sources, facts)
  assertKnowledgeIntegrity(facts, citations, relationships)

  const promptPacket = {
    schemaVersion,
    sourceManifest,
    evidence: facts.map(
      ({ id, label, data, evidenceRole, supportingFactIds }) => ({
        id,
        label,
        evidenceRole,
        data,
        ...(supportingFactIds ? { supportingFactIds } : {}),
      })
    ),
    citationTargets: citations.map(({ id, href }) => ({ id, href })),
    relationships,
  }
  const toon = encode(promptPacket)
  const factsById = new Map(facts.map((fact) => [fact.id, fact]))
  const citationsById = new Map(
    citations.map((citation) => [citation.id, citation])
  )
  const textForFact = (
    id: string,
    visited = new Set<string>()
  ): string | undefined => {
    if (visited.has(id)) return undefined
    const fact = factsById.get(id)
    if (!fact) return undefined

    visited.add(id)
    return [
      flattenFactText(fact.data),
      ...(fact.supportingFactIds ?? []).flatMap((supportingId) => {
        const supportingText = textForFact(supportingId, visited)
        return supportingText ? [supportingText] : []
      }),
    ].join("\n")
  }

  return deepFreeze({
    schemaVersion,
    sourceManifest,
    facts,
    citations,
    relationships,
    derived,
    toon,
    hash: sha256(toon),
    findFact(id: string) {
      return factsById.get(id)
    },
    findCitation(id: string) {
      return citationsById.get(id)
    },
    textForFact(id: string) {
      return textForFact(id)
    },
  })
}

let cachedKnowledge: CompiledPortfolioKnowledge | undefined

export function getCompiledPortfolioKnowledge() {
  cachedKnowledge ??= compilePortfolioKnowledge()
  return cachedKnowledge
}
