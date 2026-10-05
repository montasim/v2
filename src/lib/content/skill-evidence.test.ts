import { describe, expect, it } from "vitest"
import { skillEvidenceCatalog } from "./skill-evidence"

describe("skill evidence catalog", () => {
  it("connects a skill to matching project and experience records", () => {
    const evidence = skillEvidenceCatalog.forSlug("typescript")

    expect(evidence?.projects.map((project) => project.title)).toContain(
      "PostCraft"
    )
    expect(evidence?.experience.map((role) => role.role)).toContain(
      "Senior Software Engineer"
    )
  })

  it("normalizes known labels without using partial string matches", () => {
    const react = skillEvidenceCatalog.forSkill("React.js")
    const redux = skillEvidenceCatalog.forSkill("Redux.js")

    expect(react?.projects.map((project) => project.title)).toContain(
      "Routempo"
    )
    expect(redux?.experience.map((role) => role.role)).toContain(
      "Senior Software Engineer"
    )
    expect(
      skillEvidenceCatalog
        .forSkill("Git")
        ?.projects.map((project) => project.title)
    ).toContain("verify-github-npm-release")
  })

  it("rejects invalid shareable URL state", () => {
    expect(skillEvidenceCatalog.skillSchema.parse("unknown-skill")).toBe(
      undefined
    )
    expect(skillEvidenceCatalog.skillSchema.parse("typescript")).toBe(
      "typescript"
    )
  })

  it("orders the flat view by evidence and supports category filters", () => {
    const all = skillEvidenceCatalog.forCategory("all")
    const data = skillEvidenceCatalog.forCategory("data")

    expect(all[0]?.total).toBeGreaterThanOrEqual(all[1]?.total ?? 0)
    expect(data.map((record) => record.skill)).toEqual([
      "MongoDB",
      "PostgreSQL",
      "Mongoose",
      "Prisma",
      "Redis",
      "Drizzle ORM",
      "MariaDB",
      "MySQLi",
      "SQLite",
      "PhpMyAdmin",
    ])
    expect(data.every((record) => record.groupId === "skills-databases")).toBe(
      true
    )
  })

  it("exposes project-backed AI and browser extension skill filters", () => {
    expect(
      skillEvidenceCatalog.forCategory("ai").map((record) => record.skill)
    ).toEqual([
      "Agent Skills",
      "Gemini API",
      "Groq API",
      "OpenRouter",
      "ZhipuAI",
    ])
    expect(
      skillEvidenceCatalog
        .forCategory("extensions")
        .map((record) => record.skill)
    ).toEqual(["Chrome Extensions API", "Chrome Manifest V3", "WXT"])
  })

  it("connects repository tooling only to projects with direct evidence", () => {
    expect(
      skillEvidenceCatalog
        .forSkill("GitHub Actions")
        ?.projects.map((project) => project.title)
    ).toContain("VidQuery - YouTube Q&A Extension")
    expect(
      skillEvidenceCatalog
        .forSkill("React Testing Library")
        ?.projects.map((project) => project.title)
    ).toContain("Routempo")
    expect(
      skillEvidenceCatalog
        .forSkill("Lighthouse")
        ?.projects.map((project) => project.title)
    ).toEqual([])
    expect(
      skillEvidenceCatalog
        .forSkill("System Design")
        ?.projects.map((project) => project.title)
    ).toContain("Book Heaven")
    expect(skillEvidenceCatalog.forSkill("Scrum")?.projects).toHaveLength(0)
  })
})

it("connects new client skills to their verified engagements and projects", () => {
  for (const [skill, company, projectId] of [
    ["NestJS", "WaTheta", "project-clm-api"],
    ["Meta Graph API", "WaTheta", "project-clm-api"],
    ["WhatsApp Cloud API", "WaTheta", "project-clm-api"],
    ["Messenger API", "WaTheta", "project-clm-api"],
    ["Instagram API", "WaTheta", "project-clm-api"],
    ["Meta Conversions API", "WaTheta", "project-clm-api"],
    ["Google Maps API", "TalendIT", "project-school-management"],
    ["MariaDB", "TalendIT", "project-technofire"],
    [
      "Firebase Authentication",
      "nDevers",
      "project-warehouse-management-client",
    ],
    ["Helmet", "Infomax", "project-mcq-topper-backend"],
  ]) {
    const evidence = skillEvidenceCatalog.forSkill(skill)
    expect(evidence?.experience.map((role) => role.company)).toContain(company)
    expect(evidence?.projects.map((project) => project.id)).toContain(projectId)
    expect(skillEvidenceCatalog.skillSchema.parse(evidence?.slug)).toBe(
      evidence?.slug
    )
  }
})
