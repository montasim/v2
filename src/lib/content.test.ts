import { blogCatalog } from "./content/blog"
import { loadContactContext } from "@/features/contact/application/contact-context.server"
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
  it("uses employment and client labels while preserving existing filter links", () => {
    expect(projectCatalog.filterSchema.parse("employment")).toBe("employment")
    expect(projectCatalog.filterSchema.parse("professional")).toBe("employment")
    expect(projectCatalog.filterSchema.parse("client")).toBe("client")
    expect(projectCatalog.filters).toContainEqual({
      value: "employment",
      label: "Employment",
    })
    expect(projectCatalog.filters).toContainEqual({
      value: "client",
      label: "Client work & Ventures",
    })
  })

  it("connects Air Traffic Control across project, case study, blog, and contact", () => {
    const project = projectCatalog.findBySlug("air-traffic-control")
    expect(project?.liveUrl).toBe("https://airtrafficcontrol.netlify.app")
    expect(project?.snapcraftUrl).toBe(
      "https://snapcraft.io/air-traffic-control"
    )
    expect(
      projectCaseStudyCatalog.findBySlug("air-traffic-control")?.project.id
    ).toBe(project?.id)
    expect(
      blogCatalog.find("separating-flight-rules-from-the-renderer")?.projectId
    ).toBe(project?.id)
    const contact = loadContactContext({ app: "air-traffic-control" })
    expect(contact.projectId).toBe(project?.id)
    expect(
      contact.projects.find((item) => item.id === project?.id)?.links
    ).toContainEqual({ label: "Snap Store", href: project?.snapcraftUrl })
  })

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
      "project-bugreceipt",
      "project-devtools",
    ])
    expect(
      projectCatalog.records.slice(0, 10).map((project) => project.id)
    ).toEqual([
      "project-postcraft",
      "project-bugreceipt",
      "project-mulalens",
      "project-formflow",
      "project-b4joinacompany",
      "project-devtools",
      "project-skillfoliox",
      "project-bangladesh-location-registry",
      "project-thoughtline",
      "project-release-agent-skill",
    ])
    expect(
      projectCatalog.records.slice(-13).map((project) => project.id)
    ).toEqual([
      "project-mmh-patient-portal",
      "project-mmh-re-annotation",
      "project-mmh-telemedicine",
      "project-liftuno",
      "project-coaching-management",
      "project-mcq-topper-backend",
      "project-school-management-backend",
      "project-school-management",
      "project-survey-module-backend",
      "project-warehouse-management-client",
      "project-inventory-management-system-server",
      "project-technofire",
      "project-project-management",
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

  it("derives project chronology from verified GitHub history", () => {
    expect(projectCatalog.newestByGitHubHistory.id).toBe("project-liftuno")
    expect(
      projectCatalog.chronological.map((project) => project.id)
    ).toHaveLength(projectCatalog.records.length)
    expect(
      new Set(projectCatalog.chronological.map((project) => project.id))
    ).toEqual(new Set(projectCatalog.records.map((project) => project.id)))

    for (const project of projectCatalog.records) {
      expect(project.githubRepositoryCreatedAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
      )
      expect(project.githubInitialCommitAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
      )
      expect(project.githubInitialCommitSha).toMatch(/^[0-9a-f]{40}$/)
    }

    const firstObservedAt = (
      project: (typeof projectCatalog.records)[number]
    ) =>
      project.githubInitialCommitAt < project.githubRepositoryCreatedAt
        ? project.githubInitialCommitAt
        : project.githubRepositoryCreatedAt

    for (let index = 1; index < projectCatalog.chronological.length; index++) {
      expect(
        firstObservedAt(projectCatalog.chronological[index - 1]) >=
          firstObservedAt(projectCatalog.chronological[index])
      ).toBe(true)
    }
  })

  it("publishes evidence-backed case studies for every project", () => {
    expect(
      new Set(
        projectCaseStudyCatalog.records.map((caseStudy) => caseStudy.projectId)
      )
    ).toEqual(new Set(projectCatalog.records.map((project) => project.id)))
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
          (caseStudy.project.clientWork ||
            caseStudy.project.collaborativeWork ||
            caseStudy.project.githubUrl) &&
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

  it("includes npm-released skills in the package filter", () => {
    const npmProjects = projectCatalog.records.filter((project) =>
      projectCatalog.matches(project, "package")
    )
    const releasedSkills = projectCatalog.records.filter(
      (project) => project.type === "skill" && project.npmUrl
    )

    expect(releasedSkills).toHaveLength(13)
    expect(npmProjects).toEqual(expect.arrayContaining(releasedSkills))
    expect(npmProjects.every((project) => Boolean(project.npmUrl))).toBe(true)
    expect(
      projectCatalog
        .orderedForFilter("package")
        .filter((project) => projectCatalog.matches(project, "package"))
        .slice(0, 4)
        .map((project) => project.id)
    ).toEqual([
      "project-content-types-lite",
      "project-http-status-lite",
      "project-client-parser",
      "project-mime-types-lite",
    ])
    expect(
      projectCatalog.matches(
        projectCatalog.records.find(
          (project) => project.id === "project-skillfoliox"
        )!,
        "package"
      )
    ).toBe(false)
  })

  it("builds canonical social metadata", () => {
    expect(site.url).toBe("https://montasim.dev")

    const homepageMetadata = createMeta(site.fullName, site.description)
    expect(homepageMetadata.meta).toContainEqual({ title: site.title })
    expect(homepageMetadata.meta).toContainEqual({
      property: "og:title",
      content: site.title,
    })

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
      content: `${site.url}/images/social-preview-v2.png`,
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
    expect(sitemap).toContain("<loc>https://montasim.dev/case-studies</loc>")
    expect(sitemap).toContain("<loc>https://montasim.dev/status</loc>")
    expect(sitemap).toContain("<loc>https://montasim.dev/contact</loc>")
    expect(`${robots}\n${sitemap}`).not.toContain("montasim.vercel.app")
  })
})

it("preserves filter values and maps client projects to the documented engagements", () => {
  expect(experienceCatalog.filterSchema.parse("independent")).toBe("client")
  expect(experienceCatalog.filterSchema.parse("client")).toBe("client")
  expect(experienceCatalog.filters).toContainEqual({
    value: "client",
    label: "Client work & Ventures",
  })
  expect(projectCatalog.filterSchema.parse("client")).toBe("client")
  const expected = {
    infomax: ["project-mcq-topper-backend"],
    talendit: [
      "project-school-management-backend",
      "project-school-management",
      "project-survey-module-backend",
      "project-technofire",
    ],
    ndevers: [
      "project-warehouse-management-client",
      "project-inventory-management-system-server",
    ],
  }
  for (const [company, ids] of Object.entries(expected)) {
    const engagementId = `experience-${company}-freelance-developer`
    const projects = projectCatalog.forEngagement(engagementId)
    expect(projects.map((project) => project.id).sort()).toEqual(
      [...ids].sort()
    )
    for (const project of projects) {
      expect(project.clientWork).toBe(true)
      expect(projectCatalog.engagementFor(project)?.id).toBe(engagementId)
    }
  }
  expect(
    projectCatalog.records.filter((project) => project.engagementId)
  ).toHaveLength(7)
})
