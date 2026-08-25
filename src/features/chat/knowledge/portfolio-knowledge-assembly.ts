import { blogCatalog } from "@/lib/content/blog"
import { certificationCatalog } from "@/lib/content/certifications"
import { contributionCatalog } from "@/lib/content/contributions"
import { experienceCatalog } from "@/lib/content/experience"
import { projectCatalog } from "@/lib/content/projects"
import {
  linkedInRecommendationsUrl,
  recommendationCatalog,
} from "@/lib/content/recommendations"
import { profileCatalog } from "@/lib/content/profile"
import type {
  PortfolioSourceRecord,
  PortfolioSourceSnapshot,
} from "@/features/chat/knowledge/portfolio-knowledge-sources"
import type {
  JsonValue,
  PortfolioDerivedKnowledge,
  PortfolioKnowledgeCitation,
  PortfolioKnowledgeFact,
  PortfolioKnowledgeRelationship,
  PortfolioKnowledgeSourceId,
  ProjectChronologyKnowledge,
} from "@/features/chat/knowledge/portfolio-knowledge-types"

export interface PortfolioKnowledgeAssembly {
  readonly facts: readonly PortfolioKnowledgeFact[]
  readonly citations: readonly PortfolioKnowledgeCitation[]
  readonly relationships: readonly PortfolioKnowledgeRelationship[]
  readonly derived: PortfolioDerivedKnowledge
}

interface MutableAssembly {
  readonly facts: PortfolioKnowledgeFact[]
  readonly citations: Map<string, PortfolioKnowledgeCitation>
}

type JsonObject = { readonly [key: string]: JsonValue }

function isJsonObject(value: JsonValue | undefined): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function isJsonArray(
  value: JsonValue | undefined
): value is readonly JsonValue[] {
  return Array.isArray(value)
}

function requiredObject(value: JsonValue, context: string) {
  if (!isJsonObject(value)) throw new Error(`${context} must be an object`)
  return value
}

function requiredString(object: JsonObject, key: string, context: string) {
  const value = object[key]
  if (typeof value !== "string" || !value) {
    throw new Error(`${context}.${key} must be a non-empty string`)
  }
  return value
}

function optionalString(object: JsonObject, key: string) {
  const value = object[key]
  return typeof value === "string" && value ? value : undefined
}

function pick(object: JsonObject, keys: readonly string[]) {
  return Object.fromEntries(
    keys.flatMap((key) => (key in object ? [[key, object[key]]] : []))
  )
}

function omit(object: JsonObject, keys: ReadonlySet<string>) {
  return Object.fromEntries(
    Object.entries(object).filter(([key]) => !keys.has(key))
  )
}

function source(
  sources: readonly PortfolioSourceSnapshot[],
  id: PortfolioKnowledgeSourceId
) {
  const match = sources.find((candidate) => candidate.id === id)
  if (!match) throw new Error(`Missing portfolio source: ${id}`)
  return match
}

function rootHref(sourceId: PortfolioKnowledgeSourceId) {
  const hrefs: Readonly<Record<PortfolioKnowledgeSourceId, string>> = {
    profile: "/#about",
    experience: "/experience",
    projects: "/projects",
    casestudy: "/projects",
    blog: "/blog",
    certifications: "/certifications",
    contributions: profileCatalog.socialUrl("github"),
    education: "/education",
    organizations: "/#organizations",
    recommendations: linkedInRecommendationsUrl,
    skills: "/skills#skill-list",
    volunteering: "/#volunteering",
  }
  return hrefs[sourceId]
}

function citation(
  id: string,
  sourceId: PortfolioKnowledgeSourceId,
  recordId: string,
  label: string,
  href: string
): PortfolioKnowledgeCitation {
  return { id, source: sourceId, recordId, label, href }
}

function addFact(
  assembly: MutableAssembly,
  fact: PortfolioKnowledgeFact,
  factCitation: PortfolioKnowledgeCitation
) {
  assembly.facts.push(fact)
  assembly.citations.set(factCitation.id, factCitation)
}

function sourceFact(
  id: string,
  sourceSnapshot: PortfolioSourceSnapshot,
  recordId: string,
  label: string,
  data: JsonValue,
  factCitation: PortfolioKnowledgeCitation
): PortfolioKnowledgeFact {
  return {
    id,
    source: sourceSnapshot.id,
    recordId,
    label,
    data,
    evidenceRole: sourceSnapshot.evidenceRole,
    citationId: factCitation.id,
  }
}

function addWholeRecordFacts(
  assembly: MutableAssembly,
  sourceSnapshot: PortfolioSourceSnapshot,
  factId: (record: PortfolioSourceRecord, index: number) => string,
  factCitation: (
    record: PortfolioSourceRecord,
    index: number,
    id: string
  ) => PortfolioKnowledgeCitation
) {
  sourceSnapshot.records.forEach((record, index) => {
    const id = factId(record, index)
    const resolvedCitation = factCitation(record, index, id)
    addFact(
      assembly,
      sourceFact(
        id,
        sourceSnapshot,
        record.id,
        record.title,
        record.value,
        resolvedCitation
      ),
      resolvedCitation
    )
  })
}

function assembleProfile(
  assembly: MutableAssembly,
  snapshot: PortfolioSourceSnapshot
) {
  const profile = snapshot.records[0]
  const profileCitation = citation(
    "profile",
    snapshot.id,
    profile.id,
    profile.title,
    "/#about"
  )
  addFact(
    assembly,
    sourceFact(
      "profile",
      snapshot,
      profile.id,
      profile.title,
      profile.value,
      profileCitation
    ),
    profileCitation
  )
}

function assembleExperience(
  assembly: MutableAssembly,
  snapshot: PortfolioSourceSnapshot
) {
  addWholeRecordFacts(
    assembly,
    snapshot,
    (record) => `experience:${record.id}`,
    (record, _index, id) =>
      citation(
        id,
        snapshot.id,
        record.id,
        record.title,
        `/experience#${record.id}`
      )
  )
}

function assembleProjects(
  assembly: MutableAssembly,
  snapshot: PortfolioSourceSnapshot
) {
  addWholeRecordFacts(
    assembly,
    snapshot,
    (record) => `project:${record.id}`,
    (record, _index, id) =>
      citation(
        id,
        snapshot.id,
        record.id,
        record.title,
        `/projects#${record.id}`
      )
  )
}

function assembleCaseStudies(
  assembly: MutableAssembly,
  snapshot: PortfolioSourceSnapshot,
  projectTitles: ReadonlyMap<string, string>
) {
  const sections = [
    { id: "problem", keys: ["problem", "constraints"] },
    { id: "architecture", keys: ["architecture", "decisions"] },
    { id: "contribution", keys: ["contribution"] },
    { id: "outcomes", keys: ["outcomes"] },
    { id: "screenshots", keys: ["screenshot"] },
  ] as const
  const sectionKeys = new Set(sections.flatMap((section) => section.keys))

  for (const record of snapshot.records) {
    const data = requiredObject(record.value, `casestudy.${record.id}`)
    const projectId = requiredString(
      data,
      "projectId",
      `casestudy.${record.id}`
    )
    const title = `${projectTitles.get(projectId) ?? record.title} case study`
    const overviewId = `case-study:${record.id}`
    const overviewCitation = citation(
      overviewId,
      snapshot.id,
      record.id,
      title,
      `/projects/${record.id}`
    )
    addFact(
      assembly,
      sourceFact(
        overviewId,
        snapshot,
        record.id,
        title,
        omit(data, sectionKeys),
        overviewCitation
      ),
      overviewCitation
    )

    for (const section of sections) {
      if (!section.keys.some((key) => key in data)) continue
      const id = `case-study:${record.id}:${section.id}`
      const sectionCitation = citation(
        id,
        snapshot.id,
        record.id,
        `${title}: ${section.id}`,
        `/projects/${record.id}#${section.id}`
      )
      addFact(
        assembly,
        sourceFact(
          id,
          snapshot,
          record.id,
          `${title}: ${section.id}`,
          pick(data, section.keys),
          sectionCitation
        ),
        sectionCitation
      )
    }
  }
}

function assembleBlog(
  assembly: MutableAssembly,
  snapshot: PortfolioSourceSnapshot,
  caseStudyByProject: ReadonlyMap<string, string>
) {
  if (snapshot.metadata) {
    const blogCatalogCitation = citation(
      "blog:catalog",
      snapshot.id,
      "catalog",
      "Blog catalog",
      "/blog"
    )
    addFact(
      assembly,
      sourceFact(
        "blog:catalog",
        snapshot,
        "catalog",
        "Blog catalog",
        snapshot.metadata,
        blogCatalogCitation
      ),
      blogCatalogCitation
    )
  }

  for (const record of snapshot.records) {
    const data = requiredObject(record.value, `blog.${record.id}`)
    const sections = data.sections
    const overviewData = omit(data, new Set(["sections"]))
    const overviewId = `blog:${record.id}`
    const overviewCitation = citation(
      overviewId,
      snapshot.id,
      record.id,
      record.title,
      `/blog/${record.id}`
    )
    addFact(
      assembly,
      sourceFact(
        overviewId,
        snapshot,
        record.id,
        record.title,
        overviewData,
        overviewCitation
      ),
      overviewCitation
    )

    if (data.kind === "case-study-derived") {
      const projectId = requiredString(data, "projectId", `blog.${record.id}`)
      const caseStudyId = caseStudyByProject.get(projectId)
      if (!caseStudyId) {
        throw new Error(`Missing case study for derived blog ${record.id}`)
      }
      const aliasId = `blog:${record.id}:problem`
      const aliasCitation = citation(
        aliasId,
        snapshot.id,
        record.id,
        `${record.title}: problem`,
        `/blog/${record.id}#problem`
      )
      addFact(
        assembly,
        {
          id: aliasId,
          source: "derived",
          recordId: record.id,
          label: `${record.title}: case-study evidence route`,
          data: { alternateRouteFor: `case-study:${caseStudyId}` },
          evidenceRole: "derived-fact",
          citationId: aliasCitation.id,
          supportingFactIds: [
            `case-study:${caseStudyId}`,
            `case-study:${caseStudyId}:problem`,
          ],
        },
        aliasCitation
      )
    }

    if (!isJsonArray(sections)) continue
    for (const sectionValue of sections) {
      const section = requiredObject(sectionValue, `blog.${record.id}.section`)
      const sectionId = requiredString(
        section,
        "id",
        `blog.${record.id}.section`
      )
      const id = `blog:${record.id}:${sectionId}`
      const sectionCitation = citation(
        id,
        snapshot.id,
        record.id,
        `${record.title}: ${sectionId}`,
        `/blog/${record.id}#${sectionId}`
      )
      addFact(
        assembly,
        sourceFact(
          id,
          snapshot,
          record.id,
          `${record.title}: ${sectionId}`,
          section,
          sectionCitation
        ),
        sectionCitation
      )
    }
  }
}

function assembleCertifications(
  assembly: MutableAssembly,
  snapshot: PortfolioSourceSnapshot
) {
  addWholeRecordFacts(
    assembly,
    snapshot,
    (record) => `certification:${record.id}`,
    (record, _index, id) => {
      const data = requiredObject(record.value, `certification.${record.id}`)
      const href =
        optionalString(data, "url") ||
        optionalString(data, "download") ||
        "/certifications"
      return citation(id, snapshot.id, record.id, record.title, href)
    }
  )
}

function assembleContributions(
  assembly: MutableAssembly,
  snapshot: PortfolioSourceSnapshot
) {
  const contributions = snapshot.records[0]
  const factCitation = citation(
    "contributions",
    snapshot.id,
    contributions.id,
    contributions.title,
    rootHref(snapshot.id)
  )
  addFact(
    assembly,
    sourceFact(
      "contributions",
      snapshot,
      contributions.id,
      contributions.title,
      contributions.value,
      factCitation
    ),
    factCitation
  )
}

function assembleEducation(
  assembly: MutableAssembly,
  snapshot: PortfolioSourceSnapshot
) {
  addWholeRecordFacts(
    assembly,
    snapshot,
    (record) => `education:${record.id}`,
    (record, _index, id) => {
      const data = requiredObject(record.value, `education.${record.id}`)
      return citation(
        id,
        snapshot.id,
        record.id,
        record.title,
        optionalString(data, "institutionUrl") || "/education"
      )
    }
  )
}

function assembleOrganizations(
  assembly: MutableAssembly,
  snapshot: PortfolioSourceSnapshot
) {
  addWholeRecordFacts(
    assembly,
    snapshot,
    (record) => `organization:${record.id}`,
    (record, _index, id) =>
      citation(id, snapshot.id, record.id, record.title, "/#organizations")
  )
}

function assembleRecommendations(
  assembly: MutableAssembly,
  snapshot: PortfolioSourceSnapshot
) {
  const recordsByName = new Map(
    snapshot.records.map((record) => {
      const data = requiredObject(record.value, `recommendation.${record.id}`)
      return [
        requiredString(data, "name", `recommendation.${record.id}`),
        record,
      ]
    })
  )

  recommendationCatalog.records.forEach((recommendation, index) => {
    const record = recordsByName.get(recommendation.name)
    if (!record) {
      throw new Error(
        `Missing recommendation source for ${recommendation.name}`
      )
    }
    const id = `recommendation:${index}:${record.id}`
    const factCitation = citation(
      id,
      snapshot.id,
      record.id,
      record.title,
      linkedInRecommendationsUrl
    )
    addFact(
      assembly,
      sourceFact(
        id,
        snapshot,
        record.id,
        record.title,
        record.value,
        factCitation
      ),
      factCitation
    )
  })
}

function assembleSkills(
  assembly: MutableAssembly,
  snapshot: PortfolioSourceSnapshot
) {
  addWholeRecordFacts(
    assembly,
    snapshot,
    (record) => `skills:${record.id}`,
    (record, _index, id) =>
      citation(
        id,
        snapshot.id,
        record.id,
        record.title,
        `/skills#${record.id}-heading`
      )
  )
}

function assembleVolunteering(
  assembly: MutableAssembly,
  snapshot: PortfolioSourceSnapshot
) {
  addWholeRecordFacts(
    assembly,
    snapshot,
    (record) => `volunteering:${record.id}`,
    (record, _index, id) =>
      citation(id, snapshot.id, record.id, record.title, "/#volunteering")
  )
}

function addSourceFacts(
  sources: readonly PortfolioSourceSnapshot[],
  assembly: MutableAssembly
) {
  const projectSnapshot = source(sources, "projects")
  const projectTitles = new Map(
    projectSnapshot.records.map((record) => [record.id, record.title])
  )
  const caseStudyByProject = new Map(
    source(sources, "casestudy").records.map((record) => {
      const data = requiredObject(record.value, `casestudy.${record.id}`)
      return [
        requiredString(data, "projectId", `casestudy.${record.id}`),
        record.id,
      ] as const
    })
  )

  assembleProfile(assembly, source(sources, "profile"))
  assembleExperience(assembly, source(sources, "experience"))
  assembleProjects(assembly, projectSnapshot)
  assembleCaseStudies(assembly, source(sources, "casestudy"), projectTitles)
  assembleBlog(assembly, source(sources, "blog"), caseStudyByProject)
  assembleCertifications(assembly, source(sources, "certifications"))
  assembleContributions(assembly, source(sources, "contributions"))
  assembleEducation(assembly, source(sources, "education"))
  assembleOrganizations(assembly, source(sources, "organizations"))
  assembleRecommendations(assembly, source(sources, "recommendations"))
  assembleSkills(assembly, source(sources, "skills"))
  assembleVolunteering(assembly, source(sources, "volunteering"))
}

function catalogCitation(sourceSnapshot: PortfolioSourceSnapshot) {
  return citation(
    `${sourceSnapshot.id}:catalog`,
    sourceSnapshot.id,
    "catalog",
    `${sourceSnapshot.id} catalog`,
    rootHref(sourceSnapshot.id)
  )
}

function addDerivedFact(
  assembly: MutableAssembly,
  id: string,
  recordId: string,
  label: string,
  data: JsonValue,
  citationId: string,
  supportingFactIds?: readonly string[]
) {
  assembly.facts.push({
    id,
    source: "derived",
    recordId,
    label,
    data,
    evidenceRole: "derived-fact",
    citationId,
    ...(supportingFactIds ? { supportingFactIds } : {}),
  })
}

function historyStartedAt(project: {
  readonly githubInitialCommitAt: string
  readonly githubRepositoryCreatedAt: string
}) {
  return project.githubInitialCommitAt < project.githubRepositoryCreatedAt
    ? project.githubInitialCommitAt
    : project.githubRepositoryCreatedAt
}

function addDerivedFacts(
  sources: readonly PortfolioSourceSnapshot[],
  assembly: MutableAssembly
): PortfolioDerivedKnowledge {
  const catalogCounts = sources.map((sourceSnapshot) => {
    const id = `derived:catalog-count:${sourceSnapshot.id}`
    const factCitation = catalogCitation(sourceSnapshot)
    assembly.citations.set(factCitation.id, factCitation)
    addDerivedFact(
      assembly,
      id,
      sourceSnapshot.id,
      `${sourceSnapshot.id} record count`,
      { source: sourceSnapshot.id, count: sourceSnapshot.records.length },
      factCitation.id
    )
    return {
      source: sourceSnapshot.id,
      count: sourceSnapshot.records.length,
      factId: id,
    }
  })

  const currentRole = experienceCatalog.current
  addDerivedFact(
    assembly,
    "derived:current-role",
    currentRole.id,
    "Current documented role",
    {
      sourceRecordId: `experience:${currentRole.id}`,
      role: currentRole.role,
      company: currentRole.company,
      period: currentRole.period,
    },
    `experience:${currentRole.id}`,
    [`experience:${currentRole.id}`]
  )

  const projectChronology = projectCatalog.chronological.map(
    (project, index): ProjectChronologyKnowledge => {
      const rank = index + 1
      const id = `derived:project-chronology:${project.id}`
      const entry = {
        rank,
        recordId: project.id,
        title: project.title,
        historyStartedAt: historyStartedAt(project),
        repositoryCreatedAt: project.githubRepositoryCreatedAt,
        initialCommitAt: project.githubInitialCommitAt,
        factId: id,
      }
      addDerivedFact(
        assembly,
        id,
        project.id,
        "GitHub project chronology",
        entry,
        `project:${project.id}`,
        [`project:${project.id}`]
      )
      return entry
    }
  )

  const newestProject = projectCatalog.newestByGitHubHistory
  addDerivedFact(
    assembly,
    "derived:newest-project-by-github-history",
    newestProject.id,
    "Newest project by GitHub history",
    {
      projectId: newestProject.id,
      title: newestProject.title,
      historyStartedAt: historyStartedAt(newestProject),
      dateMeaning: "earlier of repository creation and initial commit",
    },
    `project:${newestProject.id}`,
    [`project:${newestProject.id}`]
  )

  const latestBlog = blogCatalog.latestDatedPosts[0]
  const tiedRecordIds = blogCatalog.latestDatedPosts.map((post) => post.slug)
  addDerivedFact(
    assembly,
    "derived:latest-dated-blog",
    latestBlog.slug,
    "Latest dated blog record",
    {
      blogId: latestBlog.slug,
      title: latestBlog.title,
      publishedAt: latestBlog.publishedAt,
      tiedRecordIds,
      tiedCount: tiedRecordIds.length,
      tieBreak: "catalog-order",
    },
    `blog:${latestBlog.slug}`,
    [`blog:${latestBlog.slug}`]
  )

  addDerivedFact(
    assembly,
    "derived:blog-content-distribution",
    "blog",
    "Blog content distribution",
    {
      total: blogCatalog.posts.length,
      authored: blogCatalog.authoredPosts.length,
      caseStudyDerived: blogCatalog.caseStudyDerivedPosts.length,
    },
    "blog:catalog"
  )

  const projectTypeDistribution = Object.fromEntries(
    Array.from(
      projectCatalog.records.reduce((counts, project) => {
        counts.set(project.type, (counts.get(project.type) ?? 0) + 1)
        return counts
      }, new Map<string, number>())
    ).sort(([left], [right]) => left.localeCompare(right))
  )
  addDerivedFact(
    assembly,
    "derived:project-type-distribution",
    "projects",
    "Project type distribution",
    {
      total: projectCatalog.records.length,
      byType: projectTypeDistribution,
    },
    "projects:catalog"
  )

  const credentialYears = certificationCatalog.records.map((credential) =>
    Number(credential.year)
  )
  addDerivedFact(
    assembly,
    "derived:credential-year-range",
    "certifications",
    "Credential year range",
    {
      count: certificationCatalog.records.length,
      earliestYear: Math.min(...credentialYears),
      latestYear: Math.max(...credentialYears),
    },
    "certifications:catalog"
  )

  const contributionDays = contributionCatalog.weeks.flatMap(
    (week) => week.contributionDays
  )
  const activeDays = contributionDays.filter((day) => day.contributionCount > 0)
  const activeWeeks = contributionCatalog.weeks.filter((week) =>
    week.contributionDays.some((day) => day.contributionCount > 0)
  )
  const busiestDay = contributionDays.reduce((busiest, day) =>
    day.contributionCount > busiest.contributionCount ? day : busiest
  )
  addDerivedFact(
    assembly,
    "derived:contribution-activity-summary",
    "github-contributions",
    "GitHub contribution activity summary",
    {
      totalContributions: contributionCatalog.totalContributions,
      recordedWeeks: contributionCatalog.weeks.length,
      activeWeeks: activeWeeks.length,
      recordedDays: contributionDays.length,
      activeDays: activeDays.length,
      firstDate: contributionDays[0].date,
      lastDate: contributionDays.at(-1)?.date ?? contributionDays[0].date,
      peakDate: busiestDay.date,
      peakContributions: busiestDay.contributionCount,
    },
    "contributions:catalog",
    ["contributions"]
  )

  return {
    catalogCounts,
    currentRole: {
      recordId: currentRole.id,
      role: currentRole.role,
      company: currentRole.company,
      period: currentRole.period,
      factId: "derived:current-role",
    },
    projectChronology,
    newestProjectFactId: "derived:newest-project-by-github-history",
    latestDatedBlog: {
      recordId: latestBlog.slug,
      title: latestBlog.title,
      publishedAt: latestBlog.publishedAt,
      tiedRecordIds,
      tiedCount: tiedRecordIds.length,
      tieBreak: "catalog-order",
      factId: "derived:latest-dated-blog",
    },
  }
}

function recordNode(sourceId: PortfolioKnowledgeSourceId, recordId: string) {
  return `${sourceId}:${recordId}`
}

function relation(
  id: string,
  fromRecordId: string,
  kind: PortfolioKnowledgeRelationship["kind"],
  toRecordId: string
): PortfolioKnowledgeRelationship {
  return { id, fromRecordId, kind, toRecordId }
}

function assembleRelationships(sources: readonly PortfolioSourceSnapshot[]) {
  const relationships: PortfolioKnowledgeRelationship[] = []
  const caseStudyByProject = new Map<string, string>()

  for (const record of source(sources, "casestudy").records) {
    const data = requiredObject(record.value, `casestudy.${record.id}`)
    const projectId = requiredString(
      data,
      "projectId",
      `casestudy.${record.id}`
    )
    caseStudyByProject.set(projectId, record.id)
    relationships.push(
      relation(
        `relationship:casestudy:${record.id}:documents:${projectId}`,
        recordNode("casestudy", record.id),
        "documents",
        recordNode("projects", projectId)
      )
    )
  }

  for (const record of source(sources, "blog").records) {
    const data = requiredObject(record.value, `blog.${record.id}`)
    const projectId = optionalString(data, "projectId")
    if (!projectId) continue
    relationships.push(
      relation(
        `relationship:blog:${record.id}:explains:${projectId}`,
        recordNode("blog", record.id),
        "explains",
        recordNode("projects", projectId)
      )
    )
    const caseStudyId = caseStudyByProject.get(projectId)
    if (caseStudyId && data.kind === "case-study-derived") {
      relationships.push(
        relation(
          `relationship:blog:${record.id}:derived-from:${caseStudyId}`,
          recordNode("blog", record.id),
          "derived-from",
          recordNode("casestudy", caseStudyId)
        )
      )
    }
  }

  for (
    let index = 0;
    index < experienceCatalog.records.length - 1;
    index += 1
  ) {
    const role = experienceCatalog.records[index]
    const previousRole = experienceCatalog.records[index + 1]
    if (role.company !== previousRole.company) continue
    relationships.push(
      relation(
        `relationship:experience:${role.id}:progressed-from:${previousRole.id}`,
        recordNode("experience", role.id),
        "progressed-from",
        recordNode("experience", previousRole.id)
      )
    )
  }

  return relationships.sort((left, right) => left.id.localeCompare(right.id))
}

export function assemblePortfolioKnowledge(
  sources: readonly PortfolioSourceSnapshot[]
): PortfolioKnowledgeAssembly {
  const assembly: MutableAssembly = { facts: [], citations: new Map() }
  addSourceFacts(sources, assembly)
  const derived = addDerivedFacts(sources, assembly)

  return {
    facts: assembly.facts,
    citations: [...assembly.citations.values()].sort((left, right) =>
      left.id.localeCompare(right.id)
    ),
    relationships: assembleRelationships(sources),
    derived,
  }
}

export function flattenFactText(value: JsonValue): string {
  if (value === null) return "null"
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value)
  }
  if (isJsonArray(value)) return value.map(flattenFactText).join("\n")
  return Object.values(value).map(flattenFactText).join("\n")
}
