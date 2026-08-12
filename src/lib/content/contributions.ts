import { z } from "zod"
import contributionsJson from "@/data/contributions.json"

const contributionsSchema = z.object({
  totalContributions: z.number().int().nonnegative(),
  weeks: z.array(
    z.object({
      contributionDays: z.array(
        z.object({
          contributionCount: z.number().int().nonnegative(),
          date: z.iso.date(),
        })
      ),
    })
  ),
})

export const contributionCatalog = contributionsSchema.parse(contributionsJson)
