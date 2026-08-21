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
  }),
  component: Page,
})

function Page() {
  const { q, topic } = Route.useSearch()
  const navigate = Route.useNavigate()

  return (
    <BlogIndexPage
      topic={topic}
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
