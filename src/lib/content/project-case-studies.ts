import { z } from "zod"
import caseStudiesJson from "@/data/casestudy.json"
import { projectCatalog } from "@/lib/content/projects"
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
      fit: z.enum(["cover", "contain"]).optional(),
    })
    .optional(),
})

const caseStudyRecords = z.array(caseStudySchema).parse(caseStudiesJson)

const projectsById = new Map(
  projectCatalog.records.map((project) => [project.id, project])
)
const projectRank = new Map(
  projectCatalog.records.map((project, index) => [project.id, index])
)

const records = caseStudyRecords.map((caseStudy) => {
  const project = projectsById.get(caseStudy.projectId)
  if (!project) {
    throw new Error(`Unknown case-study project: ${caseStudy.projectId}`)
  }
  if (!project.githubUrl) {
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

records.sort(
  (left, right) =>
    (projectRank.get(left.projectId) ?? Number.MAX_SAFE_INTEGER) -
    (projectRank.get(right.projectId) ?? Number.MAX_SAFE_INTEGER)
)

export type ProjectCaseStudy = (typeof records)[number]
export type ProjectCaseStudyFilter = ProjectFilter

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
