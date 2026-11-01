import { describe, expect, it } from "vitest"

import {
  getProjectReadme,
  hasProjectReadmeTranslation,
} from "@/data/project-readmes"
import { blogCatalog, localizeBlogPost } from "./blog"
import {
  hasCaseStudyTranslation,
  localizeCaseStudy,
  projectCaseStudyCatalog,
} from "./project-case-studies"
import {
  hasProjectTranslation,
  localizeProject,
  projectCatalog,
} from "./projects"

describe("Bangla coverage", () => {
  it("translates every blog post", () => {
    for (const post of blogCatalog.posts) {
      expect(localizeBlogPost(post, "bn").language, post.slug).toBe("bn")
    }
  })

  it("translates every case study with matching structure", () => {
    for (const caseStudy of projectCaseStudyCatalog.records) {
      expect(hasCaseStudyTranslation(caseStudy.slug), caseStudy.slug).toBe(true)
      const bangla = localizeCaseStudy(caseStudy, "bn")
      expect(bangla.language).toBe("bn")
      expect(bangla.decisions).toHaveLength(caseStudy.decisions.length)
      expect(bangla.outcomes).toHaveLength(caseStudy.outcomes.length)
    }
  })

  it("translates every project description and README", () => {
    for (const project of projectCatalog.records) {
      expect(hasProjectTranslation(project.id), project.id).toBe(true)
      expect(hasProjectReadmeTranslation(project), project.id).toBe(true)
      expect(localizeProject(project, "bn").description).not.toBe(
        project.description
      )

      const caseStudy = projectCaseStudyCatalog.findByProjectId(project.id)
      if (!caseStudy) continue
      expect(getProjectReadme(project, caseStudy, "bn")).not.toBe(
        getProjectReadme(project, caseStudy, "en")
      )
    }
  })

  it("falls back to English when asked for English", () => {
    const [caseStudy] = projectCaseStudyCatalog.records
    expect(localizeCaseStudy(caseStudy, "en").summary).toBe(caseStudy.summary)
  })
})
