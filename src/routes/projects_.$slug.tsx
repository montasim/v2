import { createFileRoute, notFound } from "@tanstack/react-router"
import { ProjectDetailPage } from "@/components/portfolio/project-detail-page"
import { projectCaseStudyCatalog } from "@/lib/content/project-case-studies"
import { projectCatalog } from "@/lib/content/projects"
import { getProjectReadme } from "@/data/project-readmes"
import { blogCatalog } from "@/lib/content/blog"
import { createMeta } from "@/lib/site"

export const Route = createFileRoute("/projects_/$slug")({
  loader: ({ params }) => {
    const project = projectCatalog.findBySlug(params.slug)
    if (!project) throw notFound()
    const caseStudy = projectCaseStudyCatalog.findByProjectId(project.id)
    if (!caseStudy) throw notFound()
    const readmeSource = {
      kind: "local",
      markdown: getProjectReadme(project, caseStudy),
    } as const
    return {
      project,
      nextProject: projectCatalog.next(project.id) ?? project,
      caseStudy,
      blogPost: blogCatalog.findByProjectId(project.id),
      readmeSource,
      slug: params.slug,
    }
  },
  head: ({ loaderData }) =>
    loaderData
      ? createMeta(
          `${loaderData.project.title} details`,
          loaderData.project.description,
          `/projects/${loaderData.slug}`
        )
      : {},
  component: Page,
})

function Page() {
  return <ProjectDetailPage {...Route.useLoaderData()} />
}
