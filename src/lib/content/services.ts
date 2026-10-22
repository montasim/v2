import { z } from "zod"
import { projectCaseStudyCatalog } from "@/lib/content/project-case-studies"
import { projectCatalog } from "@/lib/content/projects"

const serviceSchema = z.object({
  id: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  eyebrow: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  idealFor: z.array(z.string().min(1)).min(1),
  deliverables: z.array(z.string().min(1)).min(1),
  timeline: z.string().min(1),
  projectIds: z.array(z.string().min(1)).min(1),
})

const records = serviceSchema.array().parse([
  {
    id: "service-web-applications",
    slug: "web-applications",
    eyebrow: "Product delivery",
    title: "Web applications that hold up in production",
    summary:
      "From first workflow to shipped product: a clear, typed application with the data, performance, and failure states to support real users.",
    idealFor: [
      "A new product that needs a reliable first version",
      "A growing team with a frontend bottleneck",
    ],
    deliverables: [
      "Responsive React and TypeScript interfaces",
      "Validated server routes and data flows",
      "Production build, deployment, and handoff notes",
    ],
    timeline: "Scoped around the smallest useful release",
    projectIds: ["project-postcraft", "project-formflow", "project-devtools"],
  },
  {
    id: "service-frontend-modernization",
    slug: "frontend-modernization",
    eyebrow: "Architecture and UX",
    title: "Frontend systems made easier to change",
    summary:
      "Turn a brittle interface into a calmer system with explicit state, reusable boundaries, and a visual language that stays consistent as the product grows.",
    idealFor: [
      "Legacy React or Next.js products",
      "Teams slowed down by duplicated UI and unclear state",
    ],
    deliverables: [
      "Architecture and consistency audit",
      "Targeted refactors with accessible components",
      "A practical path from the current code to the next release",
    ],
    timeline: "Audit first; implementation follows the highest-value seam",
    projectIds: [
      "project-bugreceipt",
      "project-thoughtline",
      "project-mulalens",
    ],
  },
  {
    id: "service-ai-workflows",
    slug: "ai-workflows",
    eyebrow: "AI and automation",
    title: "AI features with guardrails, not guesswork",
    summary:
      "Connect models to useful product workflows with bounded prompts, provider fallbacks, evidence checks, and a user experience that explains what happens next.",
    idealFor: [
      "Teams adding AI to an existing product",
      "Founders who need a grounded prototype before scaling it",
    ],
    deliverables: [
      "Model and workflow integration",
      "Validation, fallback, and failure handling",
      "A reviewable path from prototype behavior to production behavior",
    ],
    timeline: "Start with one workflow and expand only after it proves useful",
    projectIds: ["project-postcraft", "project-educanvas", "project-mulalens"],
  },
])

for (const service of records) {
  for (const projectId of service.projectIds) {
    const project = projectCatalog.records.find((item) => item.id === projectId)
    if (!project) throw new Error(`Unknown service project: ${projectId}`)
    if (!projectCaseStudyCatalog.findByProjectId(projectId)) {
      throw new Error(`Service project lacks a case study: ${projectId}`)
    }
  }
}

const recordsBySlug = new Map(records.map((service) => [service.slug, service]))

export type Service = (typeof records)[number]

export const serviceCatalog = {
  records,
  findBySlug(slug: string) {
    return recordsBySlug.get(slug)
  },
  projects(service: Service) {
    return service.projectIds.flatMap((id) => {
      const project = projectCatalog.records.find((item) => item.id === id)
      return project ? [project] : []
    })
  },
} as const
