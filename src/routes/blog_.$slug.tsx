import { createFileRoute, notFound } from "@tanstack/react-router"

import { BlogDetailPage } from "@/components/blog/blog-detail-page"
import { blogCatalog } from "@/lib/content/blog"
import { createMeta } from "@/lib/site"

export const Route = createFileRoute("/blog_/$slug")({
  loader: ({ params }) => {
    const post = blogCatalog.find(params.slug)
    if (!post) throw notFound()
    return post
  },
  head: ({ loaderData }) =>
    loaderData
      ? createMeta(
          loaderData.title,
          loaderData.excerpt,
          `/blog/${loaderData.slug}`,
          {
            type: "article",
            image: loaderData.image.src,
            imageAlt: loaderData.image.alt,
            publishedTime: `${loaderData.publishedAt}T00:00:00.000Z`,
            author: blogCatalog.author.name,
            section: loaderData.category,
          }
        )
      : {},
  component: Page,
})

function Page() {
  const post = Route.useLoaderData()

  return <BlogDetailPage post={post} nextPost={blogCatalog.next(post.slug)} />
}
