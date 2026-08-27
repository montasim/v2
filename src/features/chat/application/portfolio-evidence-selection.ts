import { encode } from "@toon-format/toon"

import type {
  CompiledPortfolioKnowledge,
  PortfolioKnowledgeFact,
} from "@/features/chat/knowledge/portfolio-knowledge.server"
import type { PortfolioKnowledgeFactSource } from "@/features/chat/knowledge/portfolio-knowledge-types"

export const PORTFOLIO_EVIDENCE_MAX_FACTS = 12

export interface PortfolioEvidenceSelection {
  readonly facts: readonly PortfolioKnowledgeFact[]
  readonly factIds: readonly string[]
  readonly prompt: string
  readonly strategies: readonly string[]
}

interface PortfolioEvidenceSelectionInput {
  readonly question: string
  readonly trustedPreviousExchange?: {
    readonly question: string
    readonly answer: string
  }
  readonly knowledge: CompiledPortfolioKnowledge
  readonly maximumFacts?: number
}

interface RankedFact {
  readonly fact: PortfolioKnowledgeFact
  readonly score: number
}

type FactDocument = ReturnType<typeof factDocument>

interface EvidenceIndex {
  readonly documents: readonly FactDocument[]
  readonly documentFrequency: ReadonlyMap<string, number>
}

const evidenceIndexes = new WeakMap<object, EvidenceIndex>()

const stopWords = new Set([
  "a",
  "about",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "can",
  "could",
  "did",
  "do",
  "does",
  "for",
  "from",
  "he",
  "help",
  "him",
  "his",
  "how",
  "i",
  "in",
  "is",
  "it",
  "me",
  "of",
  "on",
  "should",
  "show",
  "that",
  "the",
  "their",
  "this",
  "to",
  "us",
  "what",
  "which",
  "with",
  "would",
])

const tokenAliases: Readonly<Record<string, readonly string[]>> = {
  available: ["availability"],
  capability: ["skill", "experience"],
  channel: ["contact", "email"],
  colleague: ["recommendation", "collaboration"],
  credential: ["certification"],
  current: ["present", "latest"],
  hold: ["role", "position"],
  job: ["role", "experience"],
  newest: ["latest", "recent"],
  position: ["role", "experience"],
  reach: ["contact", "email"],
  recent: ["latest", "current"],
  technology: ["skill", "stack", "tool"],
  toolkit: ["skill", "stack", "tool"],
  work: ["experience", "project"],
}

const sourceRules: readonly {
  readonly pattern: RegExp
  readonly sources: readonly PortfolioKnowledgeFactSource[]
}[] = [
  { pattern: /\bblogs?|articles?|posts?|writing\b/i, sources: ["blog"] },
  { pattern: /\bcase stud(?:y|ies)\b/i, sources: ["casestudy"] },
  {
    pattern: /\bcertificat(?:e|es|ion|ions)|credentials?|learning\b/i,
    sources: ["certifications"],
  },
  {
    pattern: /\bdegree|education|stud(?:ied|y)|university\b/i,
    sources: ["education"],
  },
  {
    pattern: /\bprojects?|products?|built|shipped\b/i,
    sources: ["projects", "casestudy", "blog"],
  },
  {
    pattern: /\bskills?|stack|technolog(?:y|ies)|toolkit|tools?\b/i,
    sources: ["skills", "experience", "projects", "casestudy", "blog"],
  },
  {
    pattern:
      /\brecommendations?|references?|peer feedback|colleagues?|working style\b/i,
    sources: ["recommendations"],
  },
  {
    pattern: /\borganizations?|affiliations?|memberships?\b/i,
    sources: ["organizations"],
  },
  { pattern: /\bvolunteer(?:ed|ing)?\b/i, sources: ["volunteering"] },
  {
    pattern: /\bcontributions?|github activity|active (?:days?|weeks?)\b/i,
    sources: ["contributions", "derived"],
  },
  {
    pattern:
      /\bavailability|available|location|relocat(?:e|ion)|timezone|time zone|visa|contact|reach\b/i,
    sources: ["profile"],
  },
  {
    pattern: /\brole|position|employment|professional work|company\b/i,
    sources: ["experience", "derived"],
  },
]

export function selectPortfolioEvidence(
  input: PortfolioEvidenceSelectionInput
): PortfolioEvidenceSelection {
  const maximumFacts = input.maximumFacts ?? PORTFOLIO_EVIDENCE_MAX_FACTS
  if (
    !Number.isInteger(maximumFacts) ||
    maximumFacts < 1 ||
    maximumFacts > 24
  ) {
    throw new RangeError("Portfolio evidence maximum must be between 1 and 24")
  }

  const query = conversationalQuery(input)
  const queryTokens = expandedTokens(query)
  const desiredSources = new Set(
    sourceRules.flatMap((rule) =>
      rule.pattern.test(query) ? rule.sources : []
    )
  )
  const { documents, documentFrequency } = evidenceIndex(input.knowledge)
  const selected = new Map<string, PortfolioKnowledgeFact>()
  const strategies = new Set<string>()

  for (const factId of pinnedFactIds(query, input.knowledge)) {
    const fact = input.knowledge.findFact(factId)
    if (!fact || selected.size >= maximumFacts) continue
    selected.set(fact.id, fact)
    strategies.add("deterministic-intent")
  }

  const ranked: RankedFact[] = documents
    .map((document) => ({
      fact: document.fact,
      score: rankFact({
        document,
        query,
        queryTokens,
        desiredSources,
        documentFrequency,
        documentCount: documents.length,
      }),
    }))
    .sort(
      (left, right) =>
        right.score - left.score || left.fact.id.localeCompare(right.fact.id)
    )

  for (const candidate of ranked) {
    if (selected.size >= maximumFacts) break
    if (candidate.score <= 0) continue
    if (
      desiredSources.size > 0 &&
      !desiredSources.has(candidate.fact.source) &&
      candidate.fact.source !== "derived" &&
      candidate.score < 80
    ) {
      continue
    }
    if (
      candidate.fact.id === "contributions" &&
      selected.has("derived:contribution-activity-summary") &&
      !/\b(?:calendar|daily|date|day|week|when)\b/i.test(query)
    ) {
      continue
    }
    selected.set(candidate.fact.id, candidate.fact)
    strategies.add("lexical-ranking")
  }

  includeSupportingFacts(selected, input.knowledge, maximumFacts)
  includeRelatedFacts(selected, ranked, input.knowledge, maximumFacts)

  if (selected.size === 0) {
    for (const fallbackId of [
      "profile",
      input.knowledge.derived.currentRole.factId,
      `experience:${input.knowledge.derived.currentRole.recordId}`,
    ]) {
      const fact = input.knowledge.findFact(fallbackId)
      if (fact && selected.size < maximumFacts) selected.set(fact.id, fact)
    }
    strategies.add("safe-default")
  }

  const facts = [...selected.values()].slice(0, maximumFacts)
  const prompt = encode({
    schemaVersion: "portfolio-focused-evidence/v1",
    evidence: facts.map(({ id, label, evidenceRole, data }) => ({
      id,
      label,
      evidenceRole,
      data,
    })),
  })

  return Object.freeze({
    facts: Object.freeze(facts),
    factIds: Object.freeze(facts.map((fact) => fact.id)),
    prompt,
    strategies: Object.freeze([...strategies]),
  })
}

function conversationalQuery(input: PortfolioEvidenceSelectionInput) {
  const question = input.question.trim()
  const previous = input.trustedPreviousExchange?.question.trim()
  if (!previous || !isReferentialFollowUp(question)) return question
  return `${previous}\n${question}`
}

function isReferentialFollowUp(question: string) {
  return (
    question.length < 180 &&
    /\b(?:also|and|that|those|this|them|there|they|what about|why does it|how does it|the same)\b/i.test(
      question
    )
  )
}

function factDocument(fact: PortfolioKnowledgeFact) {
  const label = normalizedText(fact.label)
  const identifier = normalizedText(`${fact.id} ${fact.recordId}`)
  const data = normalizedText(JSON.stringify(fact.data))
  const names = namedValues(fact.data).map(normalizedText).filter(Boolean)
  return {
    fact,
    label,
    identifier,
    data,
    names,
    labelTokens: new Set(expandedTokens(label)),
    identifierTokens: new Set(expandedTokens(identifier)),
    dataTokens: new Set(expandedTokens(data)),
    allTokens: new Set(expandedTokens(`${label} ${identifier} ${data}`)),
  }
}

function evidenceIndex(knowledge: CompiledPortfolioKnowledge): EvidenceIndex {
  const cached = evidenceIndexes.get(knowledge)
  if (cached) return cached

  const documents = knowledge.facts.map((fact) => factDocument(fact))
  const created = Object.freeze({
    documents: Object.freeze(documents),
    documentFrequency: tokenDocumentFrequency(documents),
  })
  evidenceIndexes.set(knowledge, created)
  return created
}

function tokenDocumentFrequency(documents: readonly FactDocument[]) {
  const result = new Map<string, number>()
  for (const document of documents) {
    for (const token of document.allTokens) {
      result.set(token, (result.get(token) ?? 0) + 1)
    }
  }
  return result
}

function rankFact(input: {
  readonly document: FactDocument
  readonly query: string
  readonly queryTokens: readonly string[]
  readonly desiredSources: ReadonlySet<PortfolioKnowledgeFactSource>
  readonly documentFrequency: ReadonlyMap<string, number>
  readonly documentCount: number
}) {
  let score = 0
  const normalizedQuery = normalizedText(input.query)

  if (
    input.document.names.some(
      (name) => name.length >= 4 && normalizedQuery.includes(name)
    )
  ) {
    score += 120
  }
  const meaningfulLabel = input.document.label
    .replace(
      /\b(?:case study|project|article|blog|certification|recommendation)\b/g,
      " "
    )
    .replace(
      /\b(?:overview|problem|architecture|contribution|outcomes?|result|technology|delivery|introduction)\b/g,
      " "
    )
    .replace(/\s+/g, " ")
    .trim()
  if (
    meaningfulLabel.length >= 5 &&
    normalizedQuery.includes(meaningfulLabel)
  ) {
    score += 100
  }

  for (const token of input.queryTokens) {
    if (!input.document.allTokens.has(token)) continue
    const frequency = input.documentFrequency.get(token) ?? input.documentCount
    const rarity = Math.log(1 + input.documentCount / frequency)
    if (input.document.labelTokens.has(token)) score += rarity * 5
    else if (input.document.identifierTokens.has(token)) score += rarity * 3
    else if (input.document.dataTokens.has(token)) score += rarity
  }
  if (score > 0 && input.desiredSources.has(input.document.fact.source)) {
    score += 8
  }
  return score
}

function pinnedFactIds(query: string, knowledge: CompiledPortfolioKnowledge) {
  const ids = new Set<string>()
  const currentExperienceId = `experience:${knowledge.derived.currentRole.recordId}`

  if (
    /\b(?:introduce|introduction|who is|profile|about him|professional summary|headline)\b/i.test(
      query
    )
  ) {
    ids.add("profile")
    ids.add(currentExperienceId)
  }
  if (
    /\b(?:availability|available|open to|preferred roles?|targeting|work arrangement|time ?zone|location|relocat(?:e|ion)|visa|start date|contact|reach him|published channel)\b/i.test(
      query
    )
  ) {
    ids.add("profile")
  }
  if (
    /\b(?:current|present|now|latest)\b.{0,36}\b(?:role|position|job|work)|\b(?:role|position)\b.{0,24}\b(?:hold|now|current)|\blatest work\b/i.test(
      query
    )
  ) {
    ids.add(knowledge.derived.currentRole.factId)
    ids.add(currentExperienceId)
  }
  if (
    /\b(?:biometric|99\.9|pose estimation|rep counting|medical chatbot|chatbot refactor|54\+? modules|frontend architecture|complex professional work|highest.signal outcomes?)\b/i.test(
      query
    )
  ) {
    ids.add(currentExperienceId)
  }
  if (
    /\b(?:early ai|diagnosis|webrtc|video consultation|junior software engineer)\b/i.test(
      query
    )
  ) {
    ids.add("experience:experience-mymedicalhub-junior-software-engineer")
  }
  if (/\b(?:newest|latest|most recent)\b.{0,30}\bproject\b/i.test(query)) {
    ids.add(knowledge.derived.newestProjectFactId)
    const newest = knowledge.findFact(knowledge.derived.newestProjectFactId)
    for (const supportingId of newest?.supportingFactIds ?? [])
      ids.add(supportingId)
  }
  if (
    /\b(?:contributions?|github activity|active (?:days?|weeks?))\b/i.test(
      query
    )
  ) {
    ids.add("derived:contribution-activity-summary")
  }
  if (
    /\b(?:newest|latest|most recent)\b.{0,30}\b(?:blog|article|post)\b/i.test(
      query
    )
  ) {
    ids.add(knowledge.derived.latestDatedBlog.factId)
    for (const fact of knowledge.facts) {
      if (
        fact.source === "blog" &&
        fact.recordId === knowledge.derived.latestDatedBlog.recordId
      ) {
        ids.add(fact.id)
        break
      }
    }
  }

  const countSources: readonly {
    readonly pattern: RegExp
    readonly source: (typeof knowledge.derived.catalogCounts)[number]["source"]
  }[] = [
    { pattern: /\bprojects?\b/i, source: "projects" },
    { pattern: /\bcase stud(?:y|ies)\b/i, source: "casestudy" },
    { pattern: /\bblogs?|articles?|posts?\b/i, source: "blog" },
    {
      pattern: /\bcredentials?|certifications?|certificates?\b/i,
      source: "certifications",
    },
    { pattern: /\bskill (?:groups?|categories?)\b/i, source: "skills" },
    { pattern: /\beducation records?|degrees?\b/i, source: "education" },
    { pattern: /\brecommendations?\b/i, source: "recommendations" },
  ]
  if (/\b(?:how many|count|total|number of)\b/i.test(query)) {
    for (const { pattern, source } of countSources) {
      if (!pattern.test(query)) continue
      const count = knowledge.derived.catalogCounts.find(
        (entry) => entry.source === source
      )
      if (count) ids.add(count.factId)
    }
  }

  return ids
}

function includeSupportingFacts(
  selected: Map<string, PortfolioKnowledgeFact>,
  knowledge: CompiledPortfolioKnowledge,
  maximumFacts: number
) {
  for (const fact of [...selected.values()]) {
    for (const supportingId of fact.supportingFactIds ?? []) {
      if (selected.size >= maximumFacts) return
      if (supportingId === "contributions") continue
      const supporting = knowledge.findFact(supportingId)
      if (supporting) selected.set(supporting.id, supporting)
    }
  }
}

function includeRelatedFacts(
  selected: Map<string, PortfolioKnowledgeFact>,
  ranked: readonly RankedFact[],
  knowledge: CompiledPortfolioKnowledge,
  maximumFacts: number
) {
  if (selected.size >= maximumFacts) return
  const selectedNodes = new Set(
    [...selected.values()].map((fact) => `${fact.source}:${fact.recordId}`)
  )
  const relatedNodes = new Set<string>()
  for (const relationship of knowledge.relationships) {
    if (selectedNodes.has(relationship.fromRecordId)) {
      relatedNodes.add(relationship.toRecordId)
    }
    if (selectedNodes.has(relationship.toRecordId)) {
      relatedNodes.add(relationship.fromRecordId)
    }
  }
  for (const candidate of ranked) {
    if (selected.size >= maximumFacts) return
    const node = `${candidate.fact.source}:${candidate.fact.recordId}`
    if (relatedNodes.has(node)) selected.set(candidate.fact.id, candidate.fact)
  }
}

function expandedTokens(value: string) {
  const result = new Set<string>()
  for (const token of baseTokens(value)) {
    result.add(token)
    for (const alias of tokenAliases[token] ?? []) result.add(alias)
  }
  return [...result]
}

function baseTokens(value: string) {
  return (normalizedText(value).match(/[\p{L}\p{N}]+/gu) ?? []).filter(
    (token) => token.length > 1 && !stopWords.has(token)
  )
}

function normalizedText(value: string) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("en-US")
    .replace(/[_/:-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function namedValues(value: unknown, key = ""): readonly string[] {
  if (typeof value === "string") {
    return /^(?:category|company|institution|issuer|name|organization|role|title)$/i.test(
      key
    )
      ? [value]
      : []
  }
  if (Array.isArray(value)) return value.flatMap((child) => namedValues(child))
  if (typeof value !== "object" || value === null) return []
  return Object.entries(value).flatMap(([childKey, child]) =>
    namedValues(child, childKey)
  )
}
