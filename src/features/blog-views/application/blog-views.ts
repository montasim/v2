import { createServerFn } from "@tanstack/react-start"

import {
  getStoredBlogPostViewCount,
  incrementStoredBlogPostViewCount,
} from "@/features/blog-views/infrastructure/blog-views.server"
import { blogCatalog, blogPostSlugSchema } from "@/lib/content/blog"

function assertKnownPost(postSlug: string) {
  if (!blogCatalog.find(postSlug)) throw new Error("Unknown blog post.")
}

export const getBlogPostViewCount = createServerFn({ method: "GET" })
  .validator((input: unknown) => blogPostSlugSchema.parse(input))
  .handler(async ({ data: postSlug }) => {
    assertKnownPost(postSlug)
    return getStoredBlogPostViewCount(postSlug)
  })

export const recordBlogPostView = createServerFn({ method: "POST" })
  .validator((input: unknown) => blogPostSlugSchema.parse(input))
  .handler(async ({ data: postSlug }) => {
    assertKnownPost(postSlug)
    return incrementStoredBlogPostViewCount(postSlug)
  })
