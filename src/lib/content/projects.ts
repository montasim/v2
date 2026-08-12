import { z } from "zod"
import projectsJson from "@/data/projects.json"
import type { CatalogFilter } from "@/lib/content/shared"
import { optionalUrlSchema } from "@/lib/content/shared"

const projectTypeSchema = z.enum([
  "website",
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
  featured: z.boolean(),
  description: z.string().min(1),
  technologies: z.array(z.string().min(1)),
  imageUrl: z.string().nullable().optional(),
  liveUrl: optionalUrlSchema.optional(),
  npmUrl: optionalUrlSchema.optional(),
  releaseUrl: optionalUrlSchema.optional(),
  githubUrl: optionalUrlSchema.optional(),
  emoji: z.string().optional(),
})

export type Project = z.infer<typeof projectSchema>
export type ProjectFilter = "all" | z.infer<typeof projectTypeSchema>

const parsedRecords = z.array(projectSchema).parse(projectsJson)

// Curated for recruiter review: lead with shipped AI products and substantial
// full-stack systems, then show agent workflows, data engineering, reusable
// infrastructure, and focused experiments. Filters preserve this order.
const hiringPriority = [
  "project-postcraft",
  "project-b4joinacompany",
  "project-devtools",
  "project-skillfoliox",
  "project-bangladesh-location-registry",
  "project-ship-agent-skill",
  "project-vidquery",
  "project-thoughtline",
  "project-shrnkly",
  "project-ramadan-clock",
  "project-mulalens",
  "project-foliofarer",
  "project-routempo",
  "project-markdown-typing-svg",
  "project-tin-audit-checker",
  "project-content-types-lite",
  "project-http-status-lite",
  "project-client-parser",
  "project-mime-types-lite",
  "project-verify-project-release",
  "project-prepare-github-project",
  "project-prepare-netlify-deployment",
  "project-audit-frontend-consistency",
  "project-sync-project-metadata",
  "project-craft-github-release",
  "project-publish-skill-to-skillfolio",
  "project-write-project-readme",
  "project-ensure-social-preview",
  "project-educanvas",
  "project-book-heaven",
  "project-github-readme-counter",
] as const

const hiringRank = new Map<string, number>(
  hiringPriority.map((projectId, index) => [projectId, index])
)
const records = [...parsedRecords].sort(
  (left, right) =>
    (hiringRank.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
    (hiringRank.get(right.id) ?? Number.MAX_SAFE_INTEGER)
)
const filters: readonly CatalogFilter<ProjectFilter>[] = [
  { value: "all", label: "All work" },
  { value: "website", label: "Web apps" },
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
  featured: records.filter((project) => project.featured),
  filters,
  filterSchema: z.enum([
    "all",
    "website",
    "extension",
    "package",
    "skill",
    "dataset",
    "tool",
    "api",
    "template",
  ]),
  matches(project: Project, filter: ProjectFilter) {
    return filter === "all" || project.type === filter
  },
} as const
