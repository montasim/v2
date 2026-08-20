import { createFileRoute, notFound } from "@tanstack/react-router"
import { ProjectCaseStudyPage } from "@/components/portfolio/project-case-study"
import { projectCaseStudyCatalog } from "@/lib/content/project-case-studies"
import { createMeta } from "@/lib/site"

export const Route = createFileRoute("/projects_/$slug")({
  loader: ({ params }) => {
    const caseStudy = projectCaseStudyCatalog.findBySlug(params.slug)
    if (!caseStudy) throw notFound()
    return caseStudy
  },
  head: ({ loaderData }) =>
    loaderData
      ? createMeta(
          `${loaderData.project.title} case study`,
          loaderData.summary,
          `/projects/${loaderData.slug}`
        )
      : {},
  component: Page,
})

function Page() {
  const caseStudy = Route.useLoaderData()
  const nextCaseStudy = projectCaseStudyCatalog.next(caseStudy.slug)

  return (
    <ProjectCaseStudyPage
      caseStudy={caseStudy}
      nextCaseStudy={nextCaseStudy ?? caseStudy}
    />
  )
}
