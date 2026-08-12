import { z } from "zod"
import educationJson from "@/data/education.json"
import type { CatalogFilter } from "@/lib/content/shared"
import { optionalUrlSchema } from "@/lib/content/shared"

const educationTypeSchema = z.enum(["bsc", "hsc", "ssc"])
const educationSchema = z.object({
  id: z.string().min(1),
  type: educationTypeSchema,
  institution: z.string().min(1),
  institutionUrl: optionalUrlSchema,
  degree: z.string().min(1),
  period: z.string().min(1),
  details: z.string().min(1),
  highlights: z.array(z.string()),
  logo: z.string().min(1),
  logoUrl: z.string().startsWith("/"),
})

export type Education = z.infer<typeof educationSchema>
export type EducationFilter = "all" | z.infer<typeof educationTypeSchema>

const records = z.array(educationSchema).parse(educationJson)
const filters: readonly CatalogFilter<EducationFilter>[] = [
  { value: "all", label: "All education" },
  { value: "bsc", label: "B.Sc." },
  { value: "hsc", label: "HSC" },
  { value: "ssc", label: "SSC" },
]

export const educationCatalog = {
  records,
  featured: records[0],
  filters,
  filterSchema: z.enum(["all", "bsc", "hsc", "ssc"]),
  matches(record: Education, filter: EducationFilter) {
    return filter === "all" || record.type === filter
  },
} as const
