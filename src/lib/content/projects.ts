import { z } from "zod"
import projectsJson from "@/data/projects.json"
import type { CatalogFilter } from "@/lib/content/shared"
import { optionalUrlSchema } from "@/lib/content/shared"

const projectTypeSchema = z.enum([
  "website",
  "desktop",
  "extension",
  "package",
  "skill",
  "dataset",
  "tool",
  "api",
  "template",
])

const projectSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  type: projectTypeSchema,
  clientWork: z.boolean().optional(),
  professionalWork: z.boolean().optional(),
  featured: z.boolean(),
  description: z.string().min(1),
  technologies: z.array(z.string().min(1)),
  topics: z.array(z.string().min(1)),
  imageUrl: z.string().nullable().optional(),
  youtubeVideoId: z.string().min(1).optional(),
  liveUrl: optionalUrlSchema.optional(),
  npmUrl: optionalUrlSchema.optional(),
  releaseUrl: optionalUrlSchema.optional(),
  chromeWebStoreUrl: optionalUrlSchema.optional(),
  snapcraftUrl: optionalUrlSchema.optional(),
  microsoftStoreUrl: optionalUrlSchema.optional(),
  githubUrl: optionalUrlSchema.optional(),
  githubRepositoryPrivate: z.boolean().optional(),
  githubRepositoryCreatedAt: z.iso.datetime(),
  githubInitialCommitAt: z.iso.datetime(),
  githubInitialCommitSha: z.string().regex(/^[0-9a-f]{40}$/),
  emoji: z.string().optional(),
})

export type Project = z.infer<typeof projectSchema>
export type ProjectFilter =
  "all" | "client" | "professional" | z.infer<typeof projectTypeSchema>

const parsedRecords = z.array(projectSchema).parse(projectsJson)

// Preserve the established recruiter-facing sequence for the original catalog.
// Newly documented professional and client work is appended afterward so those
// additions do not reshuffle the existing portfolio. Filters preserve this order.
const hiringPriority = [
  "project-postcraft",
  "project-bugreceipt",
  "project-mulalens",
  "project-formflow",
  "project-b4joinacompany",
  "project-devtools",
  "project-skillfoliox",
  "project-ispcine",
  "project-bangladesh-location-registry",
  "project-thoughtline",
  "project-release-agent-skill",
  "project-1snap",
  "project-vidquery",
  "project-shrnkly",
  "project-ramadan-clock",
  "project-foliofarer",
  "project-routempo",
  "project-markdown-typing-svg",
  "project-tin-audit-checker",
  "project-content-types-lite",
  "project-http-status-lite",
  "project-client-parser",
  "project-mime-types-lite",
  "project-verify-github-npm-release",
  "project-make-project-github-ready",
  "project-make-app-netlify-ready",
  "project-find-ui-inconsistencies",
  "project-fix-project-metadata-mismatches",
  "project-publish-verified-github-release",
  "project-update-skillfolio-catalog",
  "project-write-complete-project-readme",
  "project-fix-social-link-previews",
  "project-build-android-app-from-web",
  "project-deploy-prebuilt-app-to-netlify",
  "project-integrate-supportkori-widget",
  "project-educanvas",
  "project-book-heaven",
  "project-github-readme-counter",
  "project-mmh-patient-portal",
  "project-mmh-re-annotation",
  "project-mmh-telemedicine",
  "project-liftuno",
  "project-coaching-management",
] as const

const hiringRank = new Map<string, number>(
  hiringPriority.map((projectId, index) => [projectId, index])
)
const records = [...parsedRecords].sort(
  (left, right) =>
    (hiringRank.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
    (hiringRank.get(right.id) ?? Number.MAX_SAFE_INTEGER)
)

const recordsBySlug = new Map(
  records.map((project) => [project.id.replace(/^project-/, ""), project])
)

// GitHub chronology is evidence of when a project first existed in repository
// history, not its release or deployment date. Taking the earlier timestamp
// handles both local-first commits and repositories whose default-branch
// history was later rewritten. The recruiter-facing records keep their curated
// order; chronology is exposed separately.
export function githubHistoryStartedAt(project: Project) {
  return project.githubInitialCommitAt < project.githubRepositoryCreatedAt
    ? project.githubInitialCommitAt
    : project.githubRepositoryCreatedAt
}

const chronological = [...parsedRecords].sort((left, right) => {
  const historyOrder = githubHistoryStartedAt(right).localeCompare(
    githubHistoryStartedAt(left)
  )
  if (historyOrder) return historyOrder

  const repositoryOrder = right.githubRepositoryCreatedAt.localeCompare(
    left.githubRepositoryCreatedAt
  )
  return repositoryOrder || left.id.localeCompare(right.id)
})
const filters: readonly CatalogFilter<ProjectFilter>[] = [
  { value: "all", label: "All work" },
  { value: "professional", label: "Professional work" },
  { value: "client", label: "Client work" },
  { value: "website", label: "Web apps" },
  { value: "desktop", label: "Desktop apps" },
  { value: "extension", label: "Extensions" },
  { value: "package", label: "npm packages" },
  { value: "skill", label: "AI skills" },
  { value: "dataset", label: "Datasets" },
  { value: "tool", label: "Developer tools" },
  { value: "api", label: "APIs" },
  { value: "template", label: "Templates" },
]

export const projectCatalog = {
  records,
  chronological,
  newestByGitHubHistory: chronological[0],
  featured: records.filter((project) => project.featured),
  filters,
  filterSchema: z.enum([
    "all",
    "professional",
    "client",
    "website",
    "desktop",
    "extension",
    "package",
    "skill",
    "dataset",
    "tool",
    "api",
    "template",
  ]),
  findBySlug(slug: string) {
    return recordsBySlug.get(slug)
  },
  next(projectId: string) {
    const index = records.findIndex((project) => project.id === projectId)
    return index === -1 ? undefined : records[(index + 1) % records.length]
  },
  matches(project: Project, filter: ProjectFilter) {
    if (filter === "all") return true
    if (filter === "client") return project.clientWork === true
    if (filter === "professional") return project.professionalWork === true
    return project.type === filter
  },
} as const
