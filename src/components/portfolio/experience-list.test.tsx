import { renderToStaticMarkup } from "react-dom/server"
import { expect, it } from "vitest"
import { ExperienceList } from "./experience-list"
import { experienceCatalog } from "@/lib/content/experience"

it("renders freelance company cards without logos, links, or missing metadata separators", () => {
  const records = experienceCatalog.records.filter((record) =>
    experienceCatalog.matches(record, "independent")
  )
  const markup = renderToStaticMarkup(<ExperienceList card records={records} />)
  expect(records.map((record) => record.company)).toEqual([
    "Infomax",
    "TalendIT",
    "nDevers",
  ])
  expect(markup.match(/<article[ >]/g)).toHaveLength(3)
  for (const record of records) {
    expect(markup).toContain(record.company)
    expect(markup).toContain(record.role)
  }
  expect(markup).not.toMatch(
    /<img|<a |data-slot="avatar"|undefined| · <| · {2}· /
  )
})
