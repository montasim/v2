import { describe, expect, it } from "vitest"
import { getProjectReadme } from "@/data/project-readmes"
import { projectCaseStudyCatalog } from "@/lib/content/project-case-studies"
import { projectCatalog } from "@/lib/content/projects"

describe("project README content", () => {
  it("provides visitor-friendly documentation for every project", () => {
    for (const project of projectCatalog.records) {
      const caseStudy = projectCaseStudyCatalog.findByProjectId(project.id)
      expect(caseStudy, `${project.title} needs a case study`).toBeTruthy()
      if (!caseStudy) continue

      const readme = getProjectReadme(project, caseStudy)
      expect(readme).toContain(`# ${project.title}`)
      expect(readme.length).toBeGreaterThan(500)
    }
  })
})
