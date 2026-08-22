import { createServerFn } from "@tanstack/react-start"

import { availabilitySettingsSchema } from "@/features/availability/domain/settings"
import {
  loadAvailabilitySettings,
  storeAvailabilitySettings,
} from "@/features/availability/infrastructure/settings.server"
import { requirePortfolioOwner } from "@/features/owner-auth/infrastructure/neon-auth.server"

export const getPublicAvailabilitySettings = createServerFn({
  method: "GET",
}).handler(() => loadAvailabilitySettings())

export const updateOwnerAvailabilitySettings = createServerFn({
  method: "POST",
})
  .validator((input: unknown) => availabilitySettingsSchema.parse(input))
  .handler(async ({ data }) => {
    await requirePortfolioOwner()
    return storeAvailabilitySettings(data)
  })
