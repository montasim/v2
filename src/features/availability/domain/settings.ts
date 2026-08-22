import { z } from "zod"

import { profileCatalog } from "@/lib/content/profile"

export const availabilitySettingsSchema = z.object({
  enabled: z.boolean(),
  sectionTitle: z.string().trim().min(1).max(80),
  cardTitle: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(240),
  ctaLabel: z.string().trim().min(1).max(60),
  availability: z.string().trim().min(1).max(120),
  workSetup: z.string().trim().min(1).max(160),
  location: z.string().trim().min(1).max(160),
  timeZone: z.string().trim().min(1).max(80),
  timeZoneDetail: z.string().trim().min(1).max(200),
  relocationVisa: z.string().trim().min(1).max(160),
})

export type AvailabilitySettings = z.infer<typeof availabilitySettingsSchema>

const preferences = profileCatalog.profile.workPreferences

export const defaultAvailabilitySettings: AvailabilitySettings = {
  enabled: true,
  sectionTitle: "Availability",
  cardTitle: "Working preferences",
  description: "Current preferences for new opportunities.",
  ctaLabel: "Discuss a role",
  availability: preferences.availability ?? "Ask me",
  workSetup: preferences.workArrangement ?? "Ask me",
  location: profileCatalog.profile.location,
  timeZone: preferences.timeZone,
  timeZoneDetail: preferences.timeZoneOverlap
    ? `${preferences.timeZoneOverlap} overlap`
    : "Share team hours to confirm overlap",
  relocationVisa:
    [preferences.relocation, preferences.visaStatus]
      .filter(Boolean)
      .join("; ") || "Ask me",
}
