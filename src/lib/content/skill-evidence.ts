import { z } from "zod"
import type { Experience } from "@/lib/content/experience"
import { experienceCatalog } from "@/lib/content/experience"
import type { Project } from "@/lib/content/projects"
import { projectCatalog } from "@/lib/content/projects"
import { skillCatalog } from "@/lib/content/skills"

const aliases: Readonly<Record<string, readonly string[]>> = {
  "React.js": ["React", "React 19"],
  "Redux.js": ["Redux Toolkit"],
  HTML5: ["HTML"],
  CSS: ["CSS3"],
  "REST APIs": ["API"],
  "CI/CD": ["CI"],
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

function matchingTerms(skill: string) {
  return new Set([skill, ...(aliases[skill] ?? [])].map(normalize))
}

function normalize(value: string) {
  return value.trim().toLowerCase()
}

function includesSkill(values: readonly string[], terms: ReadonlySet<string>) {
  return values.some((value) => terms.has(normalize(value)))
}

export interface SkillEvidence {
  skill: string
  slug: string
  groupId: string
  projects: readonly Project[]
  experience: readonly Experience[]
  total: number
}

export type SkillCategory =
  | "all"
  | "frontend"
  | "backend"
  | "data"
  | "ai"
  | "extensions"
  | "devops"
  | "quality"
  | "realtime"
  | "other"

const categoryGroups: Readonly<Record<SkillCategory, readonly string[]>> = {
  all: [],
  frontend: ["skills-frontend"],
  backend: ["skills-backend-apis"],
  data: ["skills-databases"],
  ai: ["skills-ai-agents"],
  extensions: ["skills-browser-extensions"],
  devops: ["skills-cloud-devops"],
  quality: ["skills-testing-quality"],
  realtime: ["skills-realtime-vision"],
  other: [
    "skills-design-collaboration",
    "skills-office-productivity",
    "skills-architecture-security",
  ],
}

const records = skillCatalog.records.flatMap((group) =>
  group.items.map((skill): SkillEvidence => {
    const terms = matchingTerms(skill)
    const projects = projectCatalog.records.filter((project) =>
      includesSkill(project.technologies, terms)
    )
    const experience = experienceCatalog.records.filter((role) =>
      includesSkill(role.technologies, terms)
    )

    return {
      skill,
      slug: slugify(skill),
      groupId: group.id,
      projects,
      experience,
      total: projects.length + experience.length,
    }
  })
)

const bySkill = new Map(records.map((record) => [record.skill, record]))
const bySlug = new Map(records.map((record) => [record.slug, record]))

if (bySlug.size !== records.length) {
  throw new Error("Skill names must produce unique URL slugs")
}

export const skillEvidenceCatalog = {
  records: [...records].sort((left, right) => right.total - left.total),
  filters: [
    { value: "all", label: "All" },
    { value: "frontend", label: "Frontend" },
    { value: "backend", label: "Backend" },
    { value: "data", label: "Data" },
    { value: "ai", label: "AI & agents" },
    { value: "extensions", label: "Extensions" },
    { value: "devops", label: "DevOps" },
    { value: "quality", label: "Quality" },
    { value: "realtime", label: "Real-time" },
    { value: "other", label: "Other" },
  ] as const,
  categorySchema: z.enum([
    "all",
    "frontend",
    "backend",
    "data",
    "ai",
    "extensions",
    "devops",
    "quality",
    "realtime",
    "other",
  ]),
  skillSchema: z
    .string()
    .refine((value) => bySlug.has(value), "Unknown skill")
    .optional()
    .catch(undefined),
  forSkill(skill: string) {
    return bySkill.get(skill)
  },
  forSlug(slug: string | undefined) {
    return slug ? bySlug.get(slug) : undefined
  },
  forCategory(category: SkillCategory) {
    if (category === "all") return this.records
    const groupIds = categoryGroups[category]
    return this.records.filter((record) => groupIds.includes(record.groupId))
  },
} as const
