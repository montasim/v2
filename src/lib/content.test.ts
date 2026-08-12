import { describe, expect, it } from "vitest"
import {
  certifications,
  education,
  experience,
  profile,
  projects,
  recommendations,
  skills,
} from "./content"
import { createMeta, site } from "./site"

describe("portfolio content", () => {
  it("validates every required JSON catalog", () => {
    expect(profile.name).toContain("Montasim")
    expect(experience.length).toBeGreaterThan(0)
    expect(projects.length).toBeGreaterThan(0)
    expect(skills.length).toBeGreaterThan(0)
    expect(education.length).toBeGreaterThan(0)
    expect(certifications.length).toBeGreaterThan(0)
    expect(recommendations.length).toBeGreaterThan(0)
  })

  it("builds canonical social metadata", () => {
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
})
