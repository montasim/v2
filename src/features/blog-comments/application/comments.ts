import { createServerFn } from "@tanstack/react-start"

import { blogCommentRequestSchema } from "@/features/blog-comments/domain/comment"
import { getCommentModerationError } from "@/features/blog-comments/domain/moderation"
import {
  createStoredBlogComment,
  listStoredBlogComments,
} from "@/features/blog-comments/infrastructure/comments.server"
import { checkBlogCommentRateLimit } from "@/features/blog-comments/infrastructure/rate-limit.server"
import { requirePermanentEmail } from "@/features/email-verification/infrastructure/disposable-email.server"
import { blogCatalog, blogPostSlugSchema } from "@/lib/content/blog"

function assertKnownPost(postSlug: string) {
  if (!blogCatalog.find(postSlug)) throw new Error("Unknown blog post.")
}

export const getBlogComments = createServerFn({ method: "GET" })
  .validator((input: unknown) => blogPostSlugSchema.parse(input))
  .handler(async ({ data: postSlug }) => {
    assertKnownPost(postSlug)
    return listStoredBlogComments(postSlug)
  })

export const postBlogComment = createServerFn({ method: "POST" })
  .validator((input: unknown) => blogCommentRequestSchema.parse(input))
  .handler(async ({ data }) => {
    assertKnownPost(data.comment.postSlug)
    if (data.website) return null

    const moderationError = await getCommentModerationError(
      data.comment.message
    )
    if (moderationError) throw new Error(moderationError)

    await requirePermanentEmail(data.comment.email)
    checkBlogCommentRateLimit(data.comment.email)
    return createStoredBlogComment(data.comment)
  })
