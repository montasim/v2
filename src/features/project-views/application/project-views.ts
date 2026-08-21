import { createServerFn } from "@tanstack/react-start"

import {
  getStoredProjectViewCount,
  incrementStoredProjectViewCount,
} from "@/features/project-views/infrastructure/project-views.server"
import {
  projectCaseStudyCatalog,
  projectCaseStudySlugSchema,
} from "@/lib/content/project-case-studies"

function assertKnownCaseStudy(caseStudySlug: string) {
  if (!projectCaseStudyCatalog.findBySlug(caseStudySlug)) {
    throw new Error("Unknown project case study.")
  }
}

export const getProjectViewCount = createServerFn({ method: "GET" })
  .validator((input: unknown) => projectCaseStudySlugSchema.parse(input))
  .handler(async ({ data: caseStudySlug }) => {
    assertKnownCaseStudy(caseStudySlug)
    return getStoredProjectViewCount(caseStudySlug)
  })

export const recordProjectView = createServerFn({ method: "POST" })
  .validator((input: unknown) => projectCaseStudySlugSchema.parse(input))
  .handler(async ({ data: caseStudySlug }) => {
    assertKnownCaseStudy(caseStudySlug)
    return incrementStoredProjectViewCount(caseStudySlug)
  })
