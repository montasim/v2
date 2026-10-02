import { createHash } from "node:crypto"
import { experienceCatalog } from "@/lib/content/experience"
import { projectCatalog } from "@/lib/content/projects"

// Stable IDs make initialization retryable without overwriting owner edits.
export function portfolioJournalId(key: string) {
  const hash = createHash("sha256").update(`work-journal:${key}`).digest("hex")
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-5${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`
}
export const portfolioCompanies = Array.from(
  new Set(experienceCatalog.records.map((record) => record.company))
).map((name) => {
  const roles = experienceCatalog.records.filter(
    (record) => record.company === name
  )
  const dates = roles
    .flatMap((record) => (record.startDate ? [record.startDate] : []))
    .sort()
  const endDates = roles
    .flatMap((record) => (record.endDate ? [record.endDate] : []))
    .sort()
  return {
    id: portfolioJournalId(`company:${name}`),
    name,
    role: roles[0].role,
    startDate: dates.length === roles.length ? dates[0] : null,
    endDate: endDates.length === roles.length ? endDates.at(-1)! : null,
    archived: false,
  }
})
export const currentPortfolioCompany = experienceCatalog.current.company
export const portfolioProjects = projectCatalog.records.map(
  ({ id, title, description }) => ({ id, title, description })
)
