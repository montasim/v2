export type JsonPrimitive = string | number | boolean | null

export type JsonValue =
  JsonPrimitive | readonly JsonValue[] | { readonly [key: string]: JsonValue }

export const portfolioKnowledgeSourceIds = [
  "profile",
  "experience",
  "projects",
  "casestudy",
  "blog",
  "certifications",
  "contributions",
  "education",
  "organizations",
  "recommendations",
  "skills",
  "volunteering",
] as const

export type PortfolioKnowledgeSourceId =
  (typeof portfolioKnowledgeSourceIds)[number]

export type PortfolioKnowledgeFactSource =
  PortfolioKnowledgeSourceId | "derived"

export type EvidenceRole =
  | "first-party-portfolio"
  | "derived-fact"
  | "professional-observation"
  | "activity-record"
  | "affiliation"

export interface PortfolioKnowledgeFact {
  readonly id: string
  readonly source: PortfolioKnowledgeFactSource
  readonly recordId: string
  readonly label: string
  readonly data: JsonValue
  readonly evidenceRole: EvidenceRole
  readonly citationId: string
  readonly supportingFactIds?: readonly string[]
}

export interface PortfolioKnowledgeCitation {
  readonly id: string
  readonly source: PortfolioKnowledgeSourceId
  readonly recordId: string
  readonly label: string
  readonly href: string
}

export interface PortfolioKnowledgeRelationship {
  readonly id: string
  readonly fromRecordId: string
  readonly kind:
    | "documents"
    | "explains"
    | "derived-from"
    | "progressed-from"
    | "evidenced-by"
  readonly toRecordId: string
}

export interface PortfolioKnowledgeSourceManifestEntry {
  readonly id: PortfolioKnowledgeSourceId
  readonly filename: string
  readonly recordCount: number
  readonly hash: string
}

export interface PortfolioKnowledgeSourceManifest {
  readonly schemaVersion: "portfolio-source-manifest/v1"
  readonly sources: readonly PortfolioKnowledgeSourceManifestEntry[]
}

export interface PortfolioCatalogCount {
  readonly source: PortfolioKnowledgeSourceId
  readonly count: number
  readonly factId: string
}

export interface CurrentRoleKnowledge {
  readonly recordId: string
  readonly role: string
  readonly company: string
  readonly period: string
  readonly factId: "derived:current-role"
}

export interface ProjectChronologyKnowledge {
  readonly rank: number
  readonly recordId: string
  readonly title: string
  readonly historyStartedAt: string
  readonly repositoryCreatedAt: string
  readonly initialCommitAt: string
  readonly factId: string
}

export interface LatestDatedBlogKnowledge {
  readonly recordId: string
  readonly title: string
  readonly publishedAt: string
  readonly tiedRecordIds: readonly string[]
  readonly tiedCount: number
  readonly tieBreak: "catalog-order"
  readonly factId: "derived:latest-dated-blog"
}

export interface PortfolioDerivedKnowledge {
  readonly catalogCounts: readonly PortfolioCatalogCount[]
  readonly currentRole: CurrentRoleKnowledge
  readonly projectChronology: readonly ProjectChronologyKnowledge[]
  readonly newestProjectFactId: "derived:newest-project-by-github-history"
  readonly latestDatedBlog: LatestDatedBlogKnowledge
}

export interface CompiledPortfolioKnowledge {
  readonly schemaVersion: "portfolio-knowledge/v1"
  readonly toon: string
  readonly hash: string
  readonly sourceManifest: PortfolioKnowledgeSourceManifest
  readonly facts: readonly PortfolioKnowledgeFact[]
  readonly citations: readonly PortfolioKnowledgeCitation[]
  readonly relationships: readonly PortfolioKnowledgeRelationship[]
  readonly derived: PortfolioDerivedKnowledge
  readonly findFact: (id: string) => PortfolioKnowledgeFact | undefined
  readonly findCitation: (id: string) => PortfolioKnowledgeCitation | undefined
  readonly textForFact: (id: string) => string | undefined
}
