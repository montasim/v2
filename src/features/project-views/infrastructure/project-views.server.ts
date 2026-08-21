import { eq, sql } from "drizzle-orm"

import { getDatabase } from "@/db/client.server"
import { projectCaseStudyViews } from "@/db/schema"

export async function getStoredProjectViewCount(caseStudySlug: string) {
  const stored = (
    await getDatabase()
      .select({ viewCount: projectCaseStudyViews.viewCount })
      .from(projectCaseStudyViews)
      .where(eq(projectCaseStudyViews.caseStudySlug, caseStudySlug))
      .limit(1)
  ).at(0)

  return stored?.viewCount ?? 0
}

export async function incrementStoredProjectViewCount(caseStudySlug: string) {
  const stored = (
    await getDatabase()
      .insert(projectCaseStudyViews)
      .values({ caseStudySlug, viewCount: 1 })
      .onConflictDoUpdate({
        target: projectCaseStudyViews.caseStudySlug,
        set: { viewCount: sql`${projectCaseStudyViews.viewCount} + 1` },
      })
      .returning({ viewCount: projectCaseStudyViews.viewCount })
  ).at(0)

  if (!stored) throw new Error("The case-study view could not be recorded.")
  return stored.viewCount
}
