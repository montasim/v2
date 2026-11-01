import { createFileRoute, notFound } from "@tanstack/react-router"
import { z } from "zod"

import { BlogDetailPage } from "@/components/blog/blog-detail-page"
import {
  blogCatalog,
  blogLanguageSchema,
  localizeBlogPost,
} from "@/lib/content/blog"
import type { BlogLanguage } from "@/lib/content/blog"
import { createMeta } from "@/lib/site"

export const Route = createFileRoute("/blog_/$slug")({
  // English is the default, so it stays out of the URL.
  validateSearch: z.object({
    lang: blogLanguageSchema.optional().catch(undefined),
  }),
  loader: ({ params }) => {
    const post = blogCatalog.find(params.slug)
    if (!post) throw notFound()
    return post
  },
  head: ({ loaderData, match }) => {
    if (!loaderData) return {}

    const content = localizeBlogPost(loaderData, match.search.lang ?? "en")

    return createMeta(
      content.title,
      content.excerpt,
      `/blog/${loaderData.slug}`,
      {
        type: "article",
        image: loaderData.image?.src,
        imageAlt: loaderData.image?.alt,
        publishedTime: loaderData.publishedAt
          ? `${loaderData.publishedAt}T00:00:00.000Z`
          : undefined,
        author: blogCatalog.author.name,
        section: loaderData.category,
      }
    )
  },
  component: Page,
})

function Page() {
  const post = Route.useLoaderData()
  const { lang } = Route.useSearch()
  const navigate = Route.useNavigate()

  function changeLanguage(language: BlogLanguage) {
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
    <BlogDetailPage
      post={post}
      nextPost={blogCatalog.next(post.slug)}
      language={lang ?? "en"}
      onLanguageChange={changeLanguage}
    />
  )
}
