import { renderToStaticMarkup } from "react-dom/server"
import { expect, it } from "vitest"
import { ExperienceList } from "./experience-list"
import { experienceCatalog } from "@/lib/content/experience"

it("renders freelance engagements with related work and accurate role labels", () => {
  const records = experienceCatalog.records.filter((record) =>
    experienceCatalog.matches(record, "client")
  )
  const markup = renderToStaticMarkup(<ExperienceList card records={records} />)
  expect(records.map((record) => record.company)).toEqual([
    "WaTheta",
    "Infomax",
    "TalendIT",
    "nDevers",
  ])
  expect(markup.match(/<article[ >]/g)).toHaveLength(4)
  for (const record of records) {
    expect(markup).toContain(record.company)
    expect(markup).toContain(record.role)
  }
  expect(markup).not.toMatch(/<img|data-slot="avatar"|undefined| · <| · {2}· /)
})

it("links all eight client projects and their case studies from engagements", () => {
  const records = experienceCatalog.records.filter(
    (record) => record.category === "independent"
  )
  const markup = renderToStaticMarkup(<ExperienceList card records={records} />)
  for (const slug of [
    "clm-api",
    "mcq-topper-backend",
    "school-management-backend",
    "school-management",
    "survey-module-backend",
    "technofire",
    "warehouse-management-client",
    "inventory-management-system-server",
  ]) {
    expect(markup).toContain(`href="/projects/${slug}"`)
    expect(markup).toContain(`href="/case-studies/${slug}"`)
  }
  expect(markup.match(/<details/g)).toHaveLength(4)
})
