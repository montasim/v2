import { createFileRoute, notFound } from "@tanstack/react-router"
import { ProjectDetailPage } from "@/components/portfolio/project-detail-page"
import { projectCaseStudyCatalog } from "@/lib/content/project-case-studies"
import { localizeProject, projectCatalog } from "@/lib/content/projects"
import { getProjectReadme } from "@/data/project-readmes"
import { blogCatalog } from "@/lib/content/blog"
import { contentLanguageSearchSchema } from "@/lib/content/content-language"
import type { ContentLanguage } from "@/lib/content/content-language"
import { createMeta } from "@/lib/site"

export const Route = createFileRoute("/projects_/$slug")({
  validateSearch: contentLanguageSearchSchema,
  loader: ({ params }) => {
    const project = projectCatalog.findBySlug(params.slug)
    if (!project) throw notFound()
    const caseStudy = projectCaseStudyCatalog.findByProjectId(project.id)
    if (!caseStudy) throw notFound()
    // Both languages are prepared so switching never needs a reload.
    const readmeSources = {
      en: {
        kind: "local",
        markdown: getProjectReadme(project, caseStudy, "en"),
      },
      bn: {
        kind: "local",
        markdown: getProjectReadme(project, caseStudy, "bn"),
      },
    } as const
    return {
      project,
      nextProject: projectCatalog.next(project.id) ?? project,
      caseStudy,
      blogPost: blogCatalog.findByProjectId(project.id),
      readmeSources,
      slug: params.slug,
    }
  },
  head: ({ loaderData, match }) =>
    loaderData
      ? createMeta(
          `${loaderData.project.title} details`,
          localizeProject(loaderData.project, match.search.lang ?? "en")
            .description,
          `/projects/${loaderData.slug}`
        )
      : {},
  component: Page,
})

function Page() {
  const { readmeSources, ...data } = Route.useLoaderData()
  const { lang } = Route.useSearch()
  const navigate = Route.useNavigate()
  const language = lang ?? "en"

  function changeLanguage(next: ContentLanguage) {
    void navigate({
      search: (previous) => ({
        ...previous,
        lang: next === "en" ? undefined : next,
      }),
      replace: true,
      resetScroll: false,
    })
  }

  return (
    <ProjectDetailPage
      {...data}
      readmeSource={readmeSources[language]}
      language={language}
      onLanguageChange={changeLanguage}
    />
  )
}
