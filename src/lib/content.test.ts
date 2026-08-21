import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { affiliationCatalog } from "./content/affiliations"
import { certificationCatalog } from "./content/certifications"
import { contributionCatalog } from "./content/contributions"
import { educationCatalog } from "./content/education"
import { experienceCatalog } from "./content/experience"
import { profileCatalog } from "./content/profile"
import { projectCaseStudyCatalog } from "./content/project-case-studies"
import { projectCatalog } from "./content/projects"
import { recommendationCatalog } from "./content/recommendations"
import { skillCatalog } from "./content/skills"
import { catalogFilterNavigation } from "./content/shared"
import { createMeta, site } from "./site"

describe("portfolio content", () => {
  it("validates every required JSON catalog", () => {
    expect(profileCatalog.profile.name).toContain("Montasim")
    expect(profileCatalog.profile.workPreferences.timeZone).toBe("UTC+6")
    expect(experienceCatalog.records.length).toBeGreaterThan(0)
    expect(experienceCatalog.current.period).toContain("Present")
    expect(projectCatalog.records.length).toBeGreaterThan(0)
    expect(skillCatalog.records.length).toBeGreaterThan(0)
    expect(educationCatalog.records.length).toBeGreaterThan(0)
    expect(certificationCatalog.records.length).toBeGreaterThan(0)
    expect(recommendationCatalog.records.length).toBeGreaterThan(0)
    expect(affiliationCatalog.organizations.length).toBeGreaterThan(0)
    expect(affiliationCatalog.volunteering.length).toBeGreaterThan(0)
    expect(contributionCatalog.weeks.length).toBeGreaterThan(0)
  })

  it("owns classifications and featured records inside catalogs", () => {
    expect(projectCatalog.featured.map((project) => project.id)).toEqual([
      "project-postcraft",
      "project-b4joinacompany",
      "project-devtools",
    ])
    expect(
      projectCatalog.records.slice(0, 10).map((project) => project.id)
    ).toEqual([
      "project-postcraft",
      "project-b4joinacompany",
      "project-devtools",
      "project-skillfoliox",
      "project-bangladesh-location-registry",
      "project-ship-agent-skill",
      "project-vidquery",
      "project-thoughtline",
      "project-shrnkly",
      "project-ramadan-clock",
    ])
    expect(
      educationCatalog.records.every((record) =>
        ["bsc", "hsc", "ssc"].includes(record.type)
      )
    ).toBe(true)
    expect(
      certificationCatalog.records.every(
        (record) => record.platform && record.platformIcon && record.description
      )
    ).toBe(true)
    const courseraCredentials = certificationCatalog.records.filter(
      (record) => record.platform === "Coursera"
    )
    expect(courseraCredentials).toHaveLength(19)
    expect(courseraCredentials.every((record) => record.image)).toBe(true)
    expect(
      courseraCredentials.every(
        (record) =>
          record.completedAt && record.year === record.completedAt.slice(0, 4)
      )
    ).toBe(true)
    expect(courseraCredentials.map((record) => record.title)).toContain(
      "Google Business Intelligence"
    )
    const udemyCompleted = certificationCatalog.records.filter((record) =>
      record.id.startsWith("certification-udemy-")
    )
    expect(udemyCompleted).toHaveLength(25)
    expect(udemyCompleted.every((record) => record.image)).toBe(true)
    expect(
      udemyCompleted.filter((record) => record.completedAt === null)
    ).toHaveLength(2)
    expect(
      certificationCatalog.records.slice(0, 10).map((record) => record.id)
    ).toEqual([
      "certification-claude-101",
      "certification-meta-front-end-developer",
      "certification-microsoft-azure-fundamentals",
      "certification-postman-api-testing",
      "certification-unit-testing-jest",
      "certification-accessible-web-development",
      "certification-meta-react-native",
      "certification-agile-atlassian-jira",
      "certification-google-project-management",
      "certification-foundations-ux-design",
    ])
    expect(certificationCatalog.featured.map((record) => record.id)).toEqual([
      "certification-claude-101",
      "certification-meta-front-end-developer",
      "certification-microsoft-azure-fundamentals",
    ])
    expect(
      recommendationCatalog.records.every(
        (record) => record.year === record.date.slice(-4)
      )
    ).toBe(true)
    expect(
      recommendationCatalog.records.slice(0, 8).map((record) => record.name)
    ).toEqual([
      "Shoriful Islam",
      "Tabbi Quadir",
      "Md. Tamim Tanvir, MBA",
      "Shahriar Iqbal",
      "Mahmudul Ahsan",
      "Syed Mahedi Hasen",
      "Md. Sazzad Hossain",
      "Md. Rifaet Ullah",
    ])
    expect(recommendationCatalog.records).toHaveLength(16)
    expect(recommendationCatalog.featured).toHaveLength(5)
    expect(
      recommendationCatalog.records.every((record) => record.hiringSignal)
    ).toBe(true)
  })

  it("publishes evidence-backed case studies for every project", () => {
    expect(
      projectCaseStudyCatalog.records.map((caseStudy) => caseStudy.projectId)
    ).toEqual(projectCatalog.records.map((project) => project.id))
    expect(
      new Set(
        projectCaseStudyCatalog.records.map((caseStudy) => caseStudy.slug)
      ).size
    ).toBe(projectCaseStudyCatalog.records.length)
    expect(
      projectCaseStudyCatalog.records.every(
        (caseStudy) =>
          caseStudy.constraints.length >= 3 &&
          caseStudy.decisions.length >= 3 &&
          caseStudy.contribution.length >= 3 &&
          caseStudy.outcomes.length >= 3 &&
          caseStudy.project.githubUrl &&
          Boolean(caseStudy.screenshot) === Boolean(caseStudy.project.imageUrl)
      )
    ).toBe(true)
  })

  it("falls back to the default catalog filter for invalid URL state", () => {
    expect(projectCatalog.filterSchema.catch("all").parse("unknown")).toBe(
      "all"
    )
    expect(
      recommendationCatalog.filterSchema.catch("all").parse("not-a-year")
    ).toBe("all")
    expect(certificationCatalog.filterSchema.parse(2023)).toBe(2023)
    expect(recommendationCatalog.filterSchema.parse(2025)).toBe(2025)
    expect(catalogFilterNavigation("website")).toEqual({
      search: { filter: "website" },
      replace: true,
    })
  })

  it("builds canonical social metadata", () => {
    expect(site.url).toBe("https://montasim.dev")

    const metadata = createMeta(
      "Projects",
      "A verified project catalog.",
      "/projects"
    )
    expect(metadata.links).toContainEqual({
      rel: "canonical",
      href: `${site.url}/projects`,
    })
    expect(metadata.meta).toContainEqual({
      property: "og:image",
      content: `${site.url}/images/social-preview.png`,
    })
  })

  it("uses crawler-compatible PNG previews for local WebP images", () => {
    const metadata = createMeta(
      "Article",
      "A sufficiently descriptive summary for a social preview card.",
      "/blog/article",
      { image: "/images/projects/thoughtline.webp" }
    )

    expect(metadata.meta).toContainEqual({
      property: "og:image",
      content: `${site.url}/images/projects/thoughtline.png`,
    })
    expect(metadata.meta).toContainEqual({
      property: "og:image:type",
      content: "image/png",
    })
    expect(metadata.meta).toContainEqual({
      name: "twitter:image",
      content: `${site.url}/images/projects/thoughtline.png`,
    })
  })

  it("keeps crawler files on the canonical domain", () => {
    const robots = readFileSync(
      new URL("../../public/robots.txt", import.meta.url),
      "utf8"
    )
    const sitemap = readFileSync(
      new URL("../../public/sitemap.xml", import.meta.url),
      "utf8"
    )

    expect(robots).toContain("https://montasim.dev/sitemap.xml")
    expect(sitemap).toContain("<loc>https://montasim.dev/</loc>")
    expect(`${robots}\n${sitemap}`).not.toContain("montasim.vercel.app")
  })
})
