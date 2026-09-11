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

  it("keeps ISPCine's tailored promotional documentation", () => {
    const project = projectCatalog.findBySlug("ispcine")
    const caseStudy = project
      ? projectCaseStudyCatalog.findByProjectId(project.id)
      : undefined
    expect(project).toBeTruthy()
    expect(caseStudy).toBeTruthy()
    if (!project || !caseStudy) return

    const readme = getProjectReadme(project, caseStudy)
    expect(readme).toContain("A simpler viewing experience")
    expect(readme).toContain("Try ISPCine")
  })
})
