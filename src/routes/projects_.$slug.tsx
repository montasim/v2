import { createFileRoute, notFound } from "@tanstack/react-router"
import { ProjectDetailPage } from "@/components/portfolio/project-detail-page"
import { projectCaseStudyCatalog } from "@/lib/content/project-case-studies"
import { projectCatalog } from "@/lib/content/projects"
import { projectReadmes } from "@/data/project-readmes"
import { blogCatalog } from "@/lib/content/blog"
import { createMeta } from "@/lib/site"

export const Route = createFileRoute("/projects_/$slug")({
  loader: ({ params }) => {
    const project = projectCatalog.findBySlug(params.slug)
    if (!project) throw notFound()
    const caseStudy = projectCaseStudyCatalog.findByProjectId(project.id)
    const localReadme = projectReadmes[params.slug]
    const repository = project.githubUrl
      ? new URL(project.githubUrl).pathname.replace(/^\/+|\/+$/g, "")
      : undefined
    const branch = caseStudy?.verifiedBranch ?? "main"
    const readmeSource = localReadme
      ? ({ kind: "local", markdown: localReadme } as const)
      : repository
        ? ({
            kind: "remote",
            readmeUrl: `https://raw.githubusercontent.com/${repository}/${branch}/README.md`,
            sourceBaseUrl: `https://github.com/${repository}/blob/${branch}`,
            rawBaseUrl: `https://raw.githubusercontent.com/${repository}/${branch}`,
            branch,
          } as const)
        : undefined
    return {
      project,
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
