import { describe, expect, it } from "vitest"

import { projectCaseStudyCatalog } from "./project-case-studies"
import { githubHistoryStartedAt } from "./projects"

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

  it("filters case studies by npm release availability", () => {
    const packages = projectCaseStudyCatalog.filter("package", "")

    expect(packages.length).toBeGreaterThan(0)
    expect(packages.every((record) => Boolean(record.project.npmUrl))).toBe(
      true
    )
    expect(packages.some((record) => record.project.type === "skill")).toBe(
      true
    )
  })

  it("derives the featured carousel from featured projects", () => {
    expect(
      projectCaseStudyCatalog.featured.map((record) => record.project.title)
    ).toEqual(["BugReceipt", "PostCraft", "DevTools"])
  })

  it("orders case studies from newest to oldest", () => {
    const dates = projectCaseStudyCatalog.records.map((record) =>
      githubHistoryStartedAt(record.project)
    )

    expect(dates).toEqual(
      [...dates].sort((left, right) => right.localeCompare(left))
    )
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

  it("filters client work without replacing its project type", () => {
    const clientWork = projectCaseStudyCatalog.filter("client", "")

    expect(clientWork.every((record) => !record.project.githubUrl)).toBe(true)

    expect(clientWork.map((record) => record.project.id).sort()).toEqual(
      [
        "project-clm-api",
        "project-mcq-topper-backend",
        "project-school-management-backend",
        "project-school-management",
        "project-survey-module-backend",
        "project-warehouse-management-client",
        "project-inventory-management-system-server",
        "project-technofire",
      ].sort()
    )
    expect(new Set(clientWork.map((record) => record.project.type))).toEqual(
      new Set(["website", "api"])
    )
  })

  it("filters collaborative work immediately after client work", () => {
    const projects = projectCaseStudyCatalog.filter("collaborative", "")
    expect(projects.map((record) => record.project.id).sort()).toEqual([
      "project-coaching-management",
      "project-liftuno",
      "project-project-management",
    ])
    expect(projects.every((record) => !record.project.clientWork)).toBe(true)
    const filters = projectCaseStudyCatalog.filters
    const clientIndex = filters.findIndex((filter) => filter.value === "client")
    expect(filters[clientIndex + 1]).toEqual({
      value: "collaborative",
      label: "Collaborative work",
    })
    expect(projectCaseStudyCatalog.filterSchema.parse("collaborative")).toBe(
      "collaborative"
    )
  })

  it("filters professional work without replacing its project type", () => {
    const professionalWork = projectCaseStudyCatalog.filter("employment", "")

    expect(professionalWork.map((record) => record.project.id)).toEqual([
      "project-mmh-re-annotation",
      "project-mmh-telemedicine",
      "project-mmh-patient-portal",
    ])
    expect(
      professionalWork.every((record) => record.project.type === "website")
    ).toBe(true)
  })
})
