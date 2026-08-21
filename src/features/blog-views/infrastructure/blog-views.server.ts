import { eq, sql } from "drizzle-orm"

import { getDatabase } from "@/db/client.server"
import { blogPostViews } from "@/db/schema"

export async function getStoredBlogPostViewCount(postSlug: string) {
  const stored = (
    await getDatabase()
      .select({ viewCount: blogPostViews.viewCount })
      .from(blogPostViews)
      .where(eq(blogPostViews.postSlug, postSlug))
      .limit(1)
  ).at(0)

  return stored?.viewCount ?? 0
}

export async function incrementStoredBlogPostViewCount(postSlug: string) {
  const stored = (
    await getDatabase()
      .insert(blogPostViews)
      .values({ postSlug, viewCount: 1 })
      .onConflictDoUpdate({
        target: blogPostViews.postSlug,
        set: { viewCount: sql`${blogPostViews.viewCount} + 1` },
      })
      .returning({ viewCount: blogPostViews.viewCount })
  ).at(0)

  if (!stored) throw new Error("The article view could not be recorded.")
  return stored.viewCount
}
