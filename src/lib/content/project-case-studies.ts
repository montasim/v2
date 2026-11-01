import { z } from "zod"
import caseStudiesJson from "@/data/casestudy.json"
import caseStudiesBnJson from "@/data/casestudy.bn.json"
import type { ContentLanguage } from "@/lib/content/content-language"
import { projectCatalog, githubHistoryStartedAt } from "@/lib/content/projects"
import type { ProjectFilter } from "@/lib/content/projects"

export const projectCaseStudySlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

const caseStudySchema = z.object({
  slug: projectCaseStudySlugSchema,
  projectId: z.string().min(1),
  summary: z.string().min(1),
  role: z.string().min(1),
  scope: z.string().min(1),
  status: z.string().min(1),
  verifiedBranch: z.string().min(1),
  verifiedCommit: z.string().length(40),
  problem: z.string().min(1),
  constraints: z.array(z.string().min(1)).min(1),
  architecture: z.object({
    summary: z.string().min(1),
    layers: z
      .array(
        z.object({
          title: z.string().min(1),
          detail: z.string().min(1),
        })
      )
      .min(2),
  }),
  decisions: z
    .array(
      z.object({
        title: z.string().min(1),
        detail: z.string().min(1),
      })
    )
    .min(1),
  contribution: z.array(z.string().min(1)).min(1),
  outcomes: z.array(z.string().min(1)).min(1),
  screenshot: z
    .object({
      alt: z.string().min(1),
      caption: z.string().min(1),
    })
    .optional(),
})

const caseStudyRecords = z.array(caseStudySchema).parse(caseStudiesJson)

const projectsById = new Map(
  projectCatalog.records.map((project) => [project.id, project])
)
const records = caseStudyRecords.map((caseStudy) => {
  const project = projectsById.get(caseStudy.projectId)
  if (!project) {
    throw new Error(`Unknown case-study project: ${caseStudy.projectId}`)
  }
  if (!project.githubUrl && !project.clientWork && !project.collaborativeWork) {
    throw new Error(`Case-study project lacks a repository: ${project.id}`)
  }
  return {
    ...caseStudy,
    project: {
      ...project,
      githubUrl: project.githubUrl,
    },
  }
})

records.sort((left, right) => {
  const historyOrder = githubHistoryStartedAt(right.project).localeCompare(
    githubHistoryStartedAt(left.project)
  )
  return historyOrder || left.slug.localeCompare(right.slug)
})

export type ProjectCaseStudy = (typeof records)[number]
export type ProjectCaseStudyFilter = ProjectFilter

const titledDetailsSchema = z.array(
  z.object({ title: z.string().min(1), detail: z.string().min(1) }).strict()
)

const caseStudyTranslationSchema = z
  .object({
    summary: z.string().min(1),
    role: z.string().min(1),
    scope: z.string().min(1),
    status: z.string().min(1),
    problem: z.string().min(1),
    constraints: z.array(z.string().min(1)).min(1),
    architecture: z
      .object({ summary: z.string().min(1), layers: titledDetailsSchema })
      .strict(),
    decisions: titledDetailsSchema,
    contribution: z.array(z.string().min(1)).min(1),
    outcomes: z.array(z.string().min(1)).min(1),
    screenshot: z
      .object({ alt: z.string().min(1), caption: z.string().min(1) })
      .strict()
      .optional(),
  })
  .strict()

type CaseStudyText = z.infer<typeof caseStudyTranslationSchema>

const caseStudyTranslations = new Map(
  Object.entries(
    z
      .record(projectCaseStudySlugSchema, caseStudyTranslationSchema)
      .parse(caseStudiesBnJson)
  )
)

// A translation must mirror its English entry so every section lines up.
for (const [slug, translation] of caseStudyTranslations) {
  const source = records.find((record) => record.slug === slug)
  if (!source) throw new Error(`Bangla case study has no source: ${slug}`)
  const mismatched = (
    [
      ["constraints", source.constraints, translation.constraints],
      [
        "architecture.layers",
        source.architecture.layers,
        translation.architecture.layers,
      ],
      ["decisions", source.decisions, translation.decisions],
      ["contribution", source.contribution, translation.contribution],
      ["outcomes", source.outcomes, translation.outcomes],
    ] as const
  ).find(([, english, bangla]) => english.length !== bangla.length)
  if (mismatched) {
    throw new Error(`Bangla case study ${slug} differs in ${mismatched[0]}`)
  }
  if (Boolean(source.screenshot) !== Boolean(translation.screenshot)) {
    throw new Error(`Bangla case study ${slug} differs in screenshot`)
  }
}

/** Returns the case study's text in the requested language, falling back to English. */
export function localizeCaseStudy(
  caseStudy: ProjectCaseStudy,
  language: ContentLanguage
): CaseStudyText & { language: ContentLanguage } {
  const translation =
    language === "bn" ? caseStudyTranslations.get(caseStudy.slug) : undefined
  if (translation) return { ...translation, language: "bn" }

  const {
    summary,
    role,
    scope,
    status,
    problem,
    constraints,
    architecture,
    decisions,
    contribution,
    outcomes,
    screenshot,
  } = caseStudy
  return {
    summary,
    role,
    scope,
    status,
    problem,
    constraints,
    architecture,
    decisions,
    contribution,
    outcomes,
    screenshot,
    language: "en",
  }
}

export function hasCaseStudyTranslation(slug: string) {
  return caseStudyTranslations.has(slug)
}

function searchableText(caseStudy: ProjectCaseStudy) {
  const { project } = caseStudy
  return [
    project.title,
    project.description,
    project.type,
    ...project.technologies,
    ...project.topics,
    caseStudy.summary,
    caseStudy.role,
    caseStudy.scope,
    caseStudy.status,
    caseStudy.problem,
    ...caseStudy.constraints,
    ...caseStudy.outcomes,
  ]
    .join(" ")
    .toLocaleLowerCase()
}

const recordsBySlug = new Map(records.map((record) => [record.slug, record]))
const recordsByProjectId = new Map(
  records.map((record) => [record.projectId, record])
)

export const projectCaseStudyCatalog = {
  records,
  featured: records.filter((record) => record.project.featured),
  filters: projectCatalog.filters,
  filterSchema: projectCatalog.filterSchema,
  filter(filter: ProjectCaseStudyFilter, query: string) {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    return records.filter(
      (record) =>
        projectCatalog.matches(record.project, filter) &&
        (!normalizedQuery || searchableText(record).includes(normalizedQuery))
    )
  },
  findBySlug(slug: string) {
    return recordsBySlug.get(slug)
  },
  findByProjectId(projectId: string) {
    return recordsByProjectId.get(projectId)
  },
  next(slug: string) {
    const index = records.findIndex((record) => record.slug === slug)
    return index === -1 ? undefined : records[(index + 1) % records.length]
  },
} as const
