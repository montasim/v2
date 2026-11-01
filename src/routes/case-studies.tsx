import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

import { CaseStudyIndexPage } from "@/components/portfolio/case-study-index-page"
import { projectCaseStudyCatalog } from "@/lib/content/project-case-studies"
import { createMeta } from "@/lib/site"

const description =
  "Detailed project case studies covering engineering problems, architecture, tradeoffs, implementation decisions, and outcomes."

export const Route = createFileRoute("/case-studies")({
  head: () => createMeta("Case Studies", description, "/case-studies"),
  validateSearch: z.object({
    filter: projectCaseStudyCatalog.filterSchema.catch("all").default("all"),
    q: z.string().catch("").default(""),
    page: z.coerce.number().int().min(1).catch(1).default(1),
  }),
  component: Page,
})

function Page() {
  const { filter, page, q } = Route.useSearch()
  const navigate = Route.useNavigate()

  return (
    <CaseStudyIndexPage
      filter={filter}
      query={q}
      page={page}
      onQueryChange={(nextQuery) =>
        navigate({
          replace: true,
          resetScroll: false,
          search: (previous) => ({ ...previous, q: nextQuery, page: 1 }),
        })
      }
      onPageChange={async (nextPage) => {
        await navigate({
          resetScroll: false,
          search: (previous) => ({ ...previous, page: nextPage }),
        })
        requestAnimationFrame(() => {
          const heading = document.getElementById("browse-case-studies-heading")
          heading?.focus({ preventScroll: true })
          document
            .getElementById("browse-case-studies-section")
            ?.scrollIntoView({ block: "start" })
        })
      }}
    />
  )
}
