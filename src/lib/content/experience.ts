import { z } from "zod"
import experienceJson from "@/data/experience.json"
import { optionalUrlSchema } from "@/lib/content/shared"

const experienceSchema = z.object({
  id: z.string().min(1),
  company: z.string().min(1),
  category: z.enum(["employment", "independent"]),
  companyUrl: optionalUrlSchema.optional(),
  logo: z.string().min(1).optional(),
  logoUrl: z.string().startsWith("/").optional(),
  role: z.string().min(1),
  period: z.string().min(1).optional(),
  startDate: z.iso.date().optional(),
  endDate: z.iso.date().optional(),
  location: z.string().min(1).optional(),
  description: z.string().min(1),
  summary: z.string().min(1).optional(),
  technologies: z.array(z.string().min(1)),
})

export type Experience = z.infer<typeof experienceSchema>

const records = z.array(experienceSchema).parse(experienceJson)
const currentRecord =
  records.find((experience) => experience.period?.includes("Present")) ??
  records.at(0)

if (!currentRecord?.period)
  throw new Error("The current experience record requires a period")

const current = { ...currentRecord, period: currentRecord.period }

const filterSchema = z
  .enum(["employment", "client", "independent"])
  .transform((filter) =>
    filter === "independent" ? ("client" as const) : filter
  )
export type ExperienceFilter = z.infer<typeof filterSchema>

export const experienceCatalog = {
  current,
  records,
  filterSchema,
  filters: [
    { value: "employment", label: "Employment" },
    { value: "client", label: "Client work & Ventures" },
  ],
  matches(record: Experience, filter: ExperienceFilter) {
    return record.category === (filter === "client" ? "independent" : filter)
  },
} as const
