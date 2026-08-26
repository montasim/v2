import { z } from "zod"
import profileJson from "@/data/profile.json"

const profileSchema = z.object({
  name: z.string().min(1),
  title: z.string().min(1),
  tagline: z.string().min(1),
  location: z.string().min(1),
  email: z.email(),
  avatarUrl: z.string().startsWith("/"),
  resumeUrl: z.url(),
  resumeDownloadUrl: z.url(),
  supportUrl: z.url(),
  workPreferences: z.object({
    availability: z.string().min(1).nullable(),
    preferredRoles: z.array(z.string().min(1)),
    workArrangement: z.string().min(1).nullable(),
    timeZone: z.string().min(1),
    timeZoneOverlap: z.string().min(1).nullable(),
    relocation: z.string().min(1).nullable(),
    visaStatus: z.string().min(1).nullable(),
    earliestStartDate: z.string().min(1).nullable(),
  }),
  about: z.string().min(1),
  socialLinks: z.array(
    z.object({
      platform: z.enum(["linkedin", "github", "whatsapp", "email"]),
      url: z.string().min(1),
      label: z.string().min(1),
    })
  ),
})

const profile = profileSchema.parse(profileJson)

export const profileCatalog = {
  profile,
  socialUrl(platform: (typeof profile.socialLinks)[number]["platform"]) {
    const link = profile.socialLinks.find((item) => item.platform === platform)
    if (!link) throw new Error(`Missing social link: ${platform}`)
    return link.url
  },
} as const
