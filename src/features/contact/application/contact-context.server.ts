import { projectCatalog } from "@/lib/content/projects"
import { blogCatalog } from "@/lib/content/blog"
import { projectCaseStudyCatalog } from "@/lib/content/project-case-studies"
import { contactSubmissionSchema } from "@/features/contact/domain/contact"
import type {
  ContactSearch,
  ContactSubmission,
} from "@/features/contact/domain/contact"

const pages: Record<string, string> = {
  "/": "Portfolio",
  "/projects": "Projects",
  "/blog": "Blog",
  "/case-studies": "Case studies",
  "/experience": "Experience",
  "/skills": "Skills",
  "/education": "Education",
  "/certifications": "Certifications",
  "/recommendations": "Recommendations",
  "/status": "Project status",
}
export function resolveRelatedPage(input?: string) {
  if (
    !input ||
    !input.startsWith("/") ||
    input.startsWith("//") ||
    input.includes("\\")
  )
    return undefined
  const path = input.split(/[?#]/, 1)[0].replace(/\/+$/, "") || "/"
  if (pages[path]) return { path, title: pages[path] }
  const segments = path.split("/")
  const [, section, slug] = segments
  if (segments.length !== 3 || !slug) return undefined
  const record =
    section === "projects"
      ? projectCatalog.findBySlug(slug)
      : section === "blog"
        ? blogCatalog.find(slug)
        : section === "case-studies"
          ? projectCaseStudyCatalog.findBySlug(slug)
          : undefined
  return record
    ? { path, title: "project" in record ? record.project.title : record.title }
    : undefined
}
export function loadContactContext(search: ContactSearch) {
  const project = search.app ? projectCatalog.findBySlug(search.app) : undefined
  return {
    topic: search.topic ?? (search.app ? "support" : "general"),
    projectId: project?.id ?? (search.app === "other" ? "other" : ""),
    unknownApp: Boolean(search.app && search.app !== "other" && !project),
    related: resolveRelatedPage(search.from),
    projects: projectCatalog.records.map(
      ({ id, title, description, liveUrl }) => ({
        id,
        title,
        description,
        href: liveUrl || `/projects/${id.replace(/^project-/, "")}`,
      })
    ),
  }
}
export function resolveContactSubmission(
  input: ContactSubmission
): ContactSubmission {
  const project = input.projectId
    ? projectCatalog.records.find((item) => item.id === input.projectId)
    : undefined
  if (input.projectId && !project)
    throw new Error(
      "The selected project is no longer available. Choose another project."
    )
  const related = resolveRelatedPage(input.relatedPath)
  const allowsProject =
    input.topic !== "general" && input.topic !== "collaboration"
  return contactSubmissionSchema.parse({
    ...input,
    projectId: allowsProject ? project?.id : undefined,
    projectTitle: allowsProject ? project?.title : undefined,
    relatedPath: related?.path,
    relatedTitle: related?.title,
    unlistedProject:
      allowsProject && !project ? input.unlistedProject : undefined,
    platform: input.topic === "support" ? input.platform : undefined,
    appVersion: input.topic === "support" ? input.appVersion : undefined,
  })
}
