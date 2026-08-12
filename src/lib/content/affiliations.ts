import { z } from "zod"
import organizationsJson from "@/data/organizations.json"
import volunteeringJson from "@/data/volunteering.json"
import { optionalUrlSchema } from "@/lib/content/shared"

const organizationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: z.string().min(1),
  period: z.string(),
  associatedWith: z.string().min(1),
  description: z.string().min(1),
  logo: z.string().min(1),
  logoUrl: z.string().startsWith("/"),
  url: optionalUrlSchema,
})

const volunteeringSchema = z.object({
  id: z.string().min(1),
  organization: z.string().min(1),
  organizationUrl: optionalUrlSchema,
  role: z.string().min(1),
  period: z.string().min(1),
  location: z.string().min(1),
  description: z.string().min(1),
  logo: z.string().min(1),
  logoUrl: z.string().startsWith("/"),
})

export type Organization = z.infer<typeof organizationSchema>
export type Volunteering = z.infer<typeof volunteeringSchema>

export const affiliationCatalog = {
  organizations: z.array(organizationSchema).parse(organizationsJson),
  volunteering: z.array(volunteeringSchema).parse(volunteeringJson),
} as const
