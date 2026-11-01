import { createFileRoute, notFound } from "@tanstack/react-router"
import { ProjectCaseStudyPage } from "@/components/portfolio/project-case-study"
import { blogCatalog } from "@/lib/content/blog"
import { contentLanguageSearchSchema } from "@/lib/content/content-language"
import type { ContentLanguage } from "@/lib/content/content-language"
import {
  localizeCaseStudy,
  projectCaseStudyCatalog,
} from "@/lib/content/project-case-studies"
import { createMeta } from "@/lib/site"

export const Route = createFileRoute("/case-studies_/$slug")({
  validateSearch: contentLanguageSearchSchema,
  loader: ({ params }) => {
    const caseStudy = projectCaseStudyCatalog.findBySlug(params.slug)
    if (!caseStudy) throw notFound()
    return caseStudy
  },
  head: ({ loaderData, match }) => {
    if (!loaderData) return {}

    // Link cards use the project's article illustration.
    const image = blogCatalog.findByProjectId(loaderData.projectId)?.image
    const content = localizeCaseStudy(loaderData, match.search.lang ?? "en")

    return createMeta(
      `${loaderData.project.title} case study`,
      content.summary,
      `/case-studies/${loaderData.slug}`,
      { image: image?.src, imageAlt: image?.alt }
    )
  },
  component: Page,
})

function Page() {
  const caseStudy = Route.useLoaderData()
  const nextCaseStudy = projectCaseStudyCatalog.next(caseStudy.slug)
  const { lang } = Route.useSearch()
  const navigate = Route.useNavigate()

  function changeLanguage(language: ContentLanguage) {
    void navigate({
      search: (previous) => ({
        ...previous,
        lang: language === "en" ? undefined : language,
      }),
      replace: true,
      resetScroll: false,
    })
  }

  return (
    <ProjectCaseStudyPage
      caseStudy={caseStudy}
      nextCaseStudy={nextCaseStudy ?? caseStudy}
      language={lang ?? "en"}
      onLanguageChange={changeLanguage}
    />
  )
}
