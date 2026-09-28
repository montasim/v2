import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

import { BlogIndexPage } from "@/components/blog/blog-index-page"
import { blogTopicSchema } from "@/lib/content/blog"
import { createMeta } from "@/lib/site"

const description =
  "Practical notes on reliable systems, frontend architecture, AI workflows, and engineering decisions."

export const Route = createFileRoute("/blog")({
  head: () => createMeta("Writing", description, "/blog"),
  validateSearch: z.object({
    topic: blogTopicSchema.catch("all").default("all"),
    q: z.string().catch("").default(""),
    page: z.coerce.number().int().min(1).catch(1).default(1),
  }),
  component: Page,
})

function Page() {
  const { page, q, topic } = Route.useSearch()
  const navigate = Route.useNavigate()

  return (
    <BlogIndexPage
      topic={topic}
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
          const heading = document.getElementById("browse-writing-heading")
          heading?.focus({ preventScroll: true })
          document
            .getElementById("browse-writing-section")
            ?.scrollIntoView({ block: "start" })
        })
      }}
    />
  )
}
