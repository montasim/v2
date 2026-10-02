import { z } from "zod"

export const categories = [
  "delivery",
  "bug fixing",
  "reliability",
  "architecture",
  "collaboration",
  "mentoring",
  "learning",
] as const
export const statuses = [
  "in progress",
  "completed",
  "blocked",
  "investigated",
] as const
export const audiences = ["personal", "cto", "manager", "hr"] as const
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const parsed = new Date(`${value}T12:00:00Z`)
    return (
      !Number.isNaN(parsed.valueOf()) &&
      parsed.toISOString().slice(0, 10) === value
    )
  }, "Choose a valid calendar date.")
const optionalDate = z.union([dateSchema, z.literal("")])
const shortText = z.string().trim().max(200)
export const evidenceSchema = z.object({
  label: z.string().trim().min(1).max(300),
  url: z.union([
    z.literal(""),
    z
      .url()
      .max(2000)
      .refine(
        (url) => ["https:", "http:"].includes(new URL(url).protocol),
        "Use an HTTP or HTTPS link."
      ),
  ]),
})
export const contributionSchema = z.object({
  id: z.uuid(),
  description: z.string().trim().min(1).max(3000),
  category: z.enum(categories),
  status: z.enum(statuses),
  contribution: z.string().trim().max(3000),
  outcome: z.string().trim().max(3000),
  workKey: shortText,
  evidence: z.array(evidenceSchema).max(20),
  updates: z
    .array(
      z.object({
        id: z.uuid(),
        date: dateSchema,
        text: z.string().trim().min(1).max(3000),
      })
    )
    .max(50),
})
export type Contribution = z.infer<typeof contributionSchema>
export const entrySchema = z
  .object({
    id: z.uuid(),
    revision: z.number().int().nonnegative(),
    workDate: dateSchema,
    companyId: z.uuid(),
    projectId: z.uuid().nullable(),
    notes: z.string().trim().max(15000),
    reflection: z.string().trim().max(10000),
    contributions: z.array(contributionSchema).min(1).max(50),
    summary: z.string().trim().max(20000),
    summarySourceHash: z.string().max(64).nullable(),
  })
  .refine(
    (entry) =>
      new Set(entry.contributions.map((item) => item.id)).size ===
      entry.contributions.length,
    "Contribution IDs must be unique."
  )
export type EntryInput = z.infer<typeof entrySchema>
export const companySchema = z
  .object({
    id: z.uuid(),
    revision: z.number().int().nonnegative(),
    name: shortText.min(1),
    role: shortText,
    startDate: optionalDate,
    endDate: optionalDate,
    archived: z.boolean(),
  })
  .refine(
    (company) =>
      !company.startDate ||
      !company.endDate ||
      company.startDate <= company.endDate,
    "End date must follow start date."
  )
export const projectSchema = z.object({
  id: z.uuid(),
  revision: z.number().int().nonnegative(),
  companyId: z.uuid(),
  name: shortText.min(1),
  description: z.string().trim().max(3000),
  archived: z.boolean(),
})
export const settingsSchema = z.object({
  timezone: z
    .string()
    .max(100)
    .refine((timezone) => {
      try {
        new Intl.DateTimeFormat("en", { timeZone: timezone }).format()
        return true
      } catch {
        return false
      }
    }, "Choose an IANA timezone, such as Asia/Dhaka."),
  weekStartsOn: z.number().int().min(0).max(6),
})
export const historySchema = z
  .object({
    from: optionalDate.default(""),
    to: optionalDate.default(""),
    companyId: z.union([z.uuid(), z.literal("")]).default(""),
    projectId: z.union([z.uuid(), z.literal("")]).default(""),
    query: z.string().trim().max(120).default(""),
    category: z.union([z.enum(categories), z.literal("")]).default(""),
    status: z.union([z.enum(statuses), z.literal("")]).default(""),
    page: z.number().int().min(1).default(1),
  })
  .refine(
    (filter) => !filter.from || !filter.to || filter.from <= filter.to,
    "End date must follow start date."
  )
export type HistoryFilter = z.infer<typeof historySchema>
export const reviewCreateSchema = z
  .object({
    id: z.uuid(),
    title: shortText.min(1),
    from: dateSchema,
    to: dateSchema,
    companyId: z.uuid(),
    projectId: z.uuid().nullable(),
    audience: z.enum(audiences),
    includeReflections: z.boolean(),
    includeLinks: z.boolean(),
    selected: z
      .array(
        z.object({
          entryId: z.uuid(),
          contributionIds: z.array(z.uuid()).min(1).max(50),
        })
      )
      .min(1)
      .max(1000),
  })
  .refine(
    (review) => review.from <= review.to,
    "End date must follow start date."
  )
export type ReviewSource = {
  entryId: string
  sourceHash: string
  workDate: string
  company: string
  project: string | null
  reflection: string
  contributions: Contribution[]
}
export type GeneratedReport = {
  sections: {
    heading: string
    points: { text: string; sourceIds: string[] }[]
  }[]
}
export const generatedReportSchema = z.object({
  sections: z
    .array(
      z.object({
        heading: z.string().min(1).max(160),
        points: z
          .array(
            z.object({
              text: z.string().min(1).max(2000),
              sourceIds: z.array(z.string()).min(1).max(100),
            })
          )
          .min(1)
          .max(40),
      })
    )
    .min(1)
    .max(8),
})
export class JournalError extends Error {}
export function todayIn(timezone: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now)
  const part = (type: string) => parts.find((item) => item.type === type)!.value
  return `${part("year")}-${part("month")}-${part("day")}`
}
export function periodRange(
  period: "week" | "month" | "year",
  date: string,
  weekStartsOn = 1
) {
  const start = new Date(`${date}T12:00:00Z`)
  const end = new Date(start)
  if (period === "week") {
    start.setUTCDate(
      start.getUTCDate() - ((start.getUTCDay() - weekStartsOn + 7) % 7)
    )
    end.setTime(start.getTime())
    end.setUTCDate(end.getUTCDate() + 6)
  } else if (period === "month") {
    start.setUTCDate(1)
    end.setUTCMonth(end.getUTCMonth() + 1, 0)
  } else {
    start.setUTCMonth(0, 1)
    end.setUTCMonth(11, 31)
  }
  return {
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10),
  }
}
export function sourceReference(entryId: string, contributionId: string) {
  return `${entryId}/${contributionId}`
}
export function reportMarkdown(
  report: GeneratedReport,
  sources: ReviewSource[]
) {
  const allowed = new Set(
    sources.flatMap((source) =>
      source.contributions.map((item) =>
        sourceReference(source.entryId, item.id)
      )
    )
  )
  return report.sections
    .map(
      (section) =>
        `## ${section.heading}\n\n${section.points
          .map((point) => {
            if (point.sourceIds.some((id) => !allowed.has(id)))
              throw new JournalError(
                "The generated draft referenced unknown contributions. Please retry."
              )
            return `- ${point.text} [Sources: ${point.sourceIds.join(", ")}]`
          })
          .join("\n")}`
    )
    .join("\n\n")
}
// Bound every provider request by content size, not just entry count.
export function sourceBatches(sources: ReviewSource[], limit = 18000) {
  const batches: ReviewSource[][] = []
  let batch: ReviewSource[] = []
  let size = 0
  for (const source of sources)
    for (const item of source.contributions) {
      const single = { ...source, contributions: [item] }
      const length = JSON.stringify(single).length
      if (length > limit)
        throw new JournalError(
          "One contribution is too large to summarize. Shorten its evidence or outcome history first."
        )
      if (size + length > limit) {
        batches.push(batch)
        batch = []
        size = 0
      }
      batch.push(single)
      size += length
    }
  if (batch.length) batches.push(batch)
  return batches
}
export function evidenceAppendix(sources: ReviewSource[]) {
  return sources
    .map(
      (source) =>
        `### ${source.workDate} · ${source.company}${source.project ? ` · ${source.project}` : ""}\n\n${source.contributions.map((item) => `- ${item.description} (${item.status})\n  Reference: ${sourceReference(source.entryId, item.id)}${item.evidence.map((evidence) => `\n  Evidence: ${evidence.label}${evidence.url ? ` — ${evidence.url}` : ""}`).join("")}`).join("\n")}`
    )
    .join("\n\n")
}
