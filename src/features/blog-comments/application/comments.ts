import { createServerFn } from "@tanstack/react-start"

import {
  blogCommentDeletionSchema,
  blogCommentRequestSchema,
} from "@/features/blog-comments/domain/comment"
import { getCommentSubmissionModerationError } from "@/features/blog-comments/domain/moderation"
import {
  createStoredBlogComment,
  deleteStoredBlogComment,
  listStoredBlogComments,
} from "@/features/blog-comments/infrastructure/comments.server"
import { checkBlogCommentRateLimit } from "@/features/blog-comments/infrastructure/rate-limit.server"
import { requirePermanentEmail } from "@/features/email-verification/infrastructure/disposable-email.server"
import { requirePortfolioOwner } from "@/features/owner-auth/infrastructure/neon-auth.server"
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

    const moderationError = await getCommentSubmissionModerationError(
      data.comment
    )
    if (moderationError) throw new Error(moderationError.message)

    await requirePermanentEmail(data.comment.email)
    checkBlogCommentRateLimit(data.comment.email)
    return createStoredBlogComment(data.comment)
  })

export const deleteBlogComment = createServerFn({ method: "POST" })
  .validator((input: unknown) => blogCommentDeletionSchema.parse(input))
  .handler(async ({ data }) => {
    await requirePortfolioOwner()
    assertKnownPost(data.postSlug)
    await deleteStoredBlogComment(data.id, data.postSlug)
    return { deleted: true }
  })
