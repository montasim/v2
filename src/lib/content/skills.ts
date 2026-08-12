import { z } from "zod"
import skillsJson from "@/data/skills.json"

const skillGroupSchema = z.object({
  id: z.string().min(1),
  category: z.string().min(1),
  items: z.array(z.string().min(1)),
})

export type SkillGroup = z.infer<typeof skillGroupSchema>
export const skillCatalog = {
  records: z.array(skillGroupSchema).parse(skillsJson),
} as const
