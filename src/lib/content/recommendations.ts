import { z } from "zod"
import recommendationsJson from "@/data/recommendations.json"
import type { CatalogFilter } from "@/lib/content/shared"
import { uniqueDescending } from "@/lib/content/shared"

const recommendationSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  relationship: z.string().min(1),
  date: z.string().min(1),
  text: z.string().min(1),
})

export type RecommendationFilter = "all" | number

const displayPriority = [
  "Shoriful Islam",
  "Tabbi Quadir",
  "Md. Tamim Tanvir, MBA",
  "Shahriar Iqbal",
  "Mahmudul Ahsan",
  "Syed Mahedi Hasen",
] as const

const displayRank = new Map<string, number>(
  displayPriority.map((name, index) => [name, index])
)

const hiringSignals: Record<string, string> = {
  "Md. Tamim Tanvir, MBA": "Design systems & UX",
  "Mahmudul Ahsan": "Leadership & mentoring",
  "Shoriful Islam": "Executive endorsement",
  "Tabbi Quadir": "Manager endorsement",
  "Syed Mahedi Hasen": "Leadership & mentoring",
  "Md. Sazzad Hossain": "Frontend & real-time systems",
  "Md. Rifaet Ullah": "AI-to-production delivery",
  "Md. Rashedul Islam": "Measured product impact",
  "Shahriar Iqbal": "Engineering quality",
  "Imam Mahadi Hasan": "Design collaboration",
  "Sakkhar Saha CSM®, SFPC™, SFC™": "Reliable delivery",
  "Md. Azharul Sharif": "Product improvement",
  "Abu Saleh Musa Miah": "Technical leadership",
  "Rana Hamid": "Collaboration & growth",
  "Abid Hasan": "Programming foundation",
  "Md. Mahmudul Haque Joy": "Learning agility",
}

const records = z
  .array(recommendationSchema)
  .parse(recommendationsJson)
  .map((record) => ({
    ...record,
    year: record.date.slice(-4),
    hiringSignal: hiringSignals[record.name] ?? "Professional endorsement",
  }))
  .sort((left, right) => {
    const leftRank = displayRank.get(left.name) ?? Number.MAX_SAFE_INTEGER
    const rightRank = displayRank.get(right.name) ?? Number.MAX_SAFE_INTEGER

    return leftRank - rightRank
  })

export type Recommendation = (typeof records)[number]
const years = uniqueDescending(records.map((record) => record.year))
const filters: readonly CatalogFilter<RecommendationFilter>[] = [
  { value: "all", label: "All years" },
  ...years.map((year) => ({ value: Number(year), label: year })),
]

export const recommendationCatalog = {
  records,
  featured: records.slice(0, 5),
  filters,
  filterSchema: z.union([
    z.literal("all"),
    z
      .number()
      .int()
      .refine((value) => years.includes(String(value))),
  ]),
  matches(record: Recommendation, filter: RecommendationFilter) {
    return filter === "all" || record.year === String(filter)
  },
} as const

export const linkedInRecommendationsUrl =
  "https://www.linkedin.com/in/montasim/details/recommendations/"
