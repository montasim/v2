import { z } from "zod"
import awardsJson from "@/data/awards.json"

const awardSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}$/),
  month: z.string().min(1),
  year: z.string().regex(/^\d{4}$/),
  issuer: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  documentUrl: z.string().startsWith("/documents/").optional(),
  documentLabel: z.string().min(1).optional(),
})

export type Award = z.infer<typeof awardSchema>

export const awardCatalog = {
  records: z.array(awardSchema).parse(awardsJson),
} as const
