import { z } from "zod"
import experienceJson from "@/data/experience.json"
import { optionalUrlSchema } from "@/lib/content/shared"

const experienceSchema = z.object({
  id: z.string().min(1),
  company: z.string().min(1),
  category: z.enum(["employment", "independent"]),
  companyUrl: optionalUrlSchema,
  logo: z.string().min(1),
  logoUrl: z.string().startsWith("/"),
  role: z.string().min(1),
  period: z.string().min(1),
  location: z.string().min(1),
  description: z.string().min(1),
  technologies: z.array(z.string().min(1)),
})

export type Experience = z.infer<typeof experienceSchema>

const records = z.array(experienceSchema).parse(experienceJson)
const current =
  records.find((experience) => experience.period.includes("Present")) ??
  records.at(0)

if (!current) throw new Error("At least one experience record is required")

const filterSchema = z.enum(["all", "employment", "independent"])
export type ExperienceFilter = z.infer<typeof filterSchema>

export const experienceCatalog = {
  current,
  records,
  filterSchema,
  filters: [
    { value: "all", label: "All experience" },
    { value: "employment", label: "Employment" },
    { value: "independent", label: "Independent Work & Ventures" },
  ],
  matches(record: Experience, filter: ExperienceFilter) {
    return filter === "all" || record.category === filter
  },
} as const
