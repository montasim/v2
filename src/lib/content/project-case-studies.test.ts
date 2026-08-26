import { describe, expect, it } from "vitest"

import { projectCaseStudyCatalog } from "./project-case-studies"

describe("project case-study catalog", () => {
  it("keeps every record connected to a unique project and route", () => {
    expect(projectCaseStudyCatalog.records.length).toBeGreaterThan(0)
    expect(
      new Set(projectCaseStudyCatalog.records.map((record) => record.slug)).size
    ).toBe(projectCaseStudyCatalog.records.length)
    expect(
      projectCaseStudyCatalog.records.every(
        (record) => record.project.id === record.projectId
      )
    ).toBe(true)
  })

  it("filters case studies by project type", () => {
    const packages = projectCaseStudyCatalog.filter("package", "")

    expect(packages.length).toBeGreaterThan(0)
    expect(packages.every((record) => record.project.type === "package")).toBe(
      true
    )
  })

  it("derives the featured carousel from featured projects", () => {
    expect(
      projectCaseStudyCatalog.featured.map((record) => record.project.title)
    ).toEqual(["PostCraft", "b4joinacompany", "DevTools"])
  })

  it("searches project and case-study evidence", () => {
    expect(
      projectCaseStudyCatalog
        .filter("all", "content-types-lite")
        .map((record) => record.slug)
    ).toEqual(["content-types-lite"])
    expect(projectCaseStudyCatalog.filter("package", "MediaPipe")).toHaveLength(
      0
    )
  })

  it("combines type filters and normalized search", () => {
    const matches = projectCaseStudyCatalog.filter("extension", "  LINKEDIN  ")

    expect(matches.map((record) => record.slug)).toContain("thoughtline")
    expect(matches.every((record) => record.project.type === "extension")).toBe(
      true
    )
  })
})
