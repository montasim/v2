import { and, asc, eq } from "drizzle-orm"

import { getDatabase } from "@/db/client.server"
import { blogComments } from "@/db/schema"
import { blogCommentSchema } from "@/features/blog-comments/domain/comment"
import type {
  BlogComment,
  BlogCommentSubmission,
} from "@/features/blog-comments/domain/comment"

const publicSelection = {
  id: blogComments.id,
  postSlug: blogComments.postSlug,
  name: blogComments.name,
  message: blogComments.message,
  createdAt: blogComments.createdAt,
  replyTo: blogComments.parentId,
}

function serializeComment(
  row: Omit<BlogComment, "createdAt"> & { createdAt: Date }
) {
  return blogCommentSchema.parse({
    ...row,
    createdAt: row.createdAt.toISOString(),
  })
}

export async function listStoredBlogComments(postSlug: string) {
  const rows = await getDatabase()
    .select(publicSelection)
    .from(blogComments)
    .where(eq(blogComments.postSlug, postSlug))
    .orderBy(asc(blogComments.createdAt))

  return rows.map(serializeComment)
}

export async function createStoredBlogComment(
  submission: BlogCommentSubmission
) {
  const database = getDatabase()

  if (submission.replyTo) {
    const parent = (
      await database
        .select({ id: blogComments.id, parentId: blogComments.parentId })
        .from(blogComments)
        .where(
          and(
            eq(blogComments.id, submission.replyTo),
            eq(blogComments.postSlug, submission.postSlug)
          )
        )
        .limit(1)
    ).at(0)

    if (!parent || parent.parentId) {
      throw new Error("The comment being replied to is unavailable.")
    }
  }

  const created = (
    await database
      .insert(blogComments)
      .values({
        postSlug: submission.postSlug,
        parentId: submission.replyTo,
        name: submission.name,
        email: submission.email,
        message: submission.message,
      })
      .returning(publicSelection)
  ).at(0)

  if (!created) throw new Error("The comment could not be created.")
  return serializeComment(created)
}
