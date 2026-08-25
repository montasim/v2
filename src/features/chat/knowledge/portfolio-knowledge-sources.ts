import blogJson from "@/data/blog.json"
import caseStudyJson from "@/data/casestudy.json"
import certificationsJson from "@/data/certifications.json"
import contributionsJson from "@/data/contributions.json"
import educationJson from "@/data/education.json"
import experienceJson from "@/data/experience.json"
import organizationsJson from "@/data/organizations.json"
import profileJson from "@/data/profile.json"
import projectsJson from "@/data/projects.json"
import recommendationsJson from "@/data/recommendations.json"
import skillsJson from "@/data/skills.json"
import volunteeringJson from "@/data/volunteering.json"
import { affiliationCatalog } from "@/lib/content/affiliations"
import { blogCatalog } from "@/lib/content/blog"
import { certificationCatalog } from "@/lib/content/certifications"
import { contributionCatalog } from "@/lib/content/contributions"
import { educationCatalog } from "@/lib/content/education"
import { experienceCatalog } from "@/lib/content/experience"
import { profileCatalog } from "@/lib/content/profile"
import { projectCaseStudyCatalog } from "@/lib/content/project-case-studies"
import { projectCatalog } from "@/lib/content/projects"
import { recommendationCatalog } from "@/lib/content/recommendations"
import { skillCatalog } from "@/lib/content/skills"
import type {
  EvidenceRole,
  JsonValue,
  PortfolioKnowledgeSourceId,
} from "@/features/chat/knowledge/portfolio-knowledge-types"

export interface PortfolioSourceRecord {
  readonly id: string
  readonly title: string
  readonly value: JsonValue
}

export interface PortfolioSourceSnapshot {
  readonly id: PortfolioKnowledgeSourceId
  readonly filename: string
  readonly evidenceRole: Exclude<EvidenceRole, "derived-fact">
  readonly metadata?: JsonValue
  readonly records: readonly PortfolioSourceRecord[]
}

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

function toJsonValue(value: unknown, path: string): JsonValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return value
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError(`${path} contains a non-finite number`)
    }
    return value
  }

  if (Array.isArray(value)) {
    return value.map((item, index) => toJsonValue(item, `${path}[${index}]`))
  }

  if (typeof value === "object") {
    const entries = Object.entries(value)
      .filter((entry) => entry[1] !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, toJsonValue(child, `${path}.${key}`)])

    return Object.fromEntries(entries) as { readonly [key: string]: JsonValue }
  }

  throw new TypeError(`${path} contains unsupported ${typeof value} data`)
}

function record(
  id: string,
  title: string,
  value: unknown
): PortfolioSourceRecord {
  if (!id || !title)
    throw new Error("Portfolio source records require an ID and title")
  return { id, title, value: toJsonValue(value, id) }
}

function assertUniqueRecordIds(snapshot: PortfolioSourceSnapshot) {
  const recordIds = snapshot.records.map((entry) => entry.id)
  if (new Set(recordIds).size !== recordIds.length) {
    throw new Error(
      `${snapshot.filename} contains duplicate knowledge record IDs`
    )
  }
  return snapshot
}

function assertCatalogCount(
  source: PortfolioKnowledgeSourceId,
  rawCount: number,
  validatedCount: number
) {
  if (rawCount !== validatedCount) {
    throw new Error(
      `${source} source count ${rawCount} does not match validated catalog count ${validatedCount}`
    )
  }
}

export function loadPortfolioSourceSnapshots(): readonly PortfolioSourceSnapshot[] {
  if (profileCatalog.profile.name !== profileJson.name) {
    throw new Error("profile source does not match the validated catalog")
  }
  assertCatalogCount(
    "experience",
    experienceJson.length,
    experienceCatalog.records.length
  )
  assertCatalogCount(
    "projects",
    projectsJson.length,
    projectCatalog.records.length
  )
  assertCatalogCount(
    "casestudy",
    caseStudyJson.length,
    projectCaseStudyCatalog.records.length
  )
  assertCatalogCount("blog", blogJson.posts.length, blogCatalog.posts.length)
  assertCatalogCount(
    "certifications",
    certificationsJson.length,
    certificationCatalog.records.length
  )
  if (
    contributionCatalog.totalContributions !==
    contributionsJson.totalContributions
  ) {
    throw new Error("contributions source does not match the validated catalog")
  }
  assertCatalogCount(
    "education",
    educationJson.length,
    educationCatalog.records.length
  )
  assertCatalogCount(
    "organizations",
    organizationsJson.length,
    affiliationCatalog.organizations.length
  )
  assertCatalogCount(
    "recommendations",
    recommendationsJson.length,
    recommendationCatalog.records.length
  )
  assertCatalogCount("skills", skillsJson.length, skillCatalog.records.length)
  assertCatalogCount(
    "volunteering",
    volunteeringJson.length,
    affiliationCatalog.volunteering.length
  )

  const snapshots: readonly PortfolioSourceSnapshot[] = [
    {
      id: "profile",
      filename: "profile.json",
      evidenceRole: "first-party-portfolio",
      records: [record("profile", profileJson.name, profileJson)],
    },
    {
      id: "experience",
      filename: "experience.json",
      evidenceRole: "first-party-portfolio",
      records: experienceJson.map((entry) =>
        record(entry.id, `${entry.role} at ${entry.company}`, entry)
      ),
    },
    {
      id: "projects",
      filename: "projects.json",
      evidenceRole: "first-party-portfolio",
      records: projectsJson.map((entry) =>
        record(entry.id, entry.title, entry)
      ),
    },
    {
      id: "casestudy",
      filename: "casestudy.json",
      evidenceRole: "first-party-portfolio",
      records: caseStudyJson.map((entry) =>
        record(entry.slug, entry.slug, entry)
      ),
    },
    {
      id: "blog",
      filename: "blog.json",
      evidenceRole: "first-party-portfolio",
      metadata: toJsonValue(
        {
          author: blogJson.author,
          caseStudyPublishedAt: blogJson.caseStudyPublishedAt,
        },
        "blog.metadata"
      ),
      records: blogJson.posts.map((entry) =>
        record(entry.slug, entry.title, entry)
      ),
    },
    {
      id: "certifications",
      filename: "certifications.json",
      evidenceRole: "first-party-portfolio",
      records: certificationsJson.map((entry) =>
        record(entry.id, entry.title, entry)
      ),
    },
    {
      id: "contributions",
      filename: "contributions.json",
      evidenceRole: "activity-record",
      records: [
        record(
          "github-contributions",
          "GitHub contribution activity",
          contributionsJson
        ),
      ],
    },
    {
      id: "education",
      filename: "education.json",
      evidenceRole: "first-party-portfolio",
      records: educationJson.map((entry) =>
        record(entry.id, `${entry.degree} at ${entry.institution}`, entry)
      ),
    },
    {
      id: "organizations",
      filename: "organizations.json",
      evidenceRole: "affiliation",
      records: organizationsJson.map((entry) =>
        record(entry.id, `${entry.role} at ${entry.name}`, entry)
      ),
    },
    {
      id: "recommendations",
      filename: "recommendations.json",
      evidenceRole: "professional-observation",
      records: recommendationsJson.map((entry) =>
        record(slugify(entry.name), `Recommendation from ${entry.name}`, entry)
      ),
    },
    {
      id: "skills",
      filename: "skills.json",
      evidenceRole: "first-party-portfolio",
      records: skillsJson.map((entry) =>
        record(entry.id, entry.category, entry)
      ),
    },
    {
      id: "volunteering",
      filename: "volunteering.json",
      evidenceRole: "affiliation",
      records: volunteeringJson.map((entry) =>
        record(entry.id, `${entry.role} at ${entry.organization}`, entry)
      ),
    },
  ]

  return snapshots.map(assertUniqueRecordIds)
}
