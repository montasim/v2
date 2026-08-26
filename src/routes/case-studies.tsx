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
  }),
  component: Page,
})

function Page() {
  const { filter, q } = Route.useSearch()
  const navigate = Route.useNavigate()

  return (
    <CaseStudyIndexPage
      filter={filter}
      query={q}
      onQueryChange={(nextQuery) =>
        navigate({
          replace: true,
          resetScroll: false,
          search: (previous) => ({ ...previous, q: nextQuery }),
        })
      }
    />
  )
}
