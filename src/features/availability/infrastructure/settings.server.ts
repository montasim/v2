import { eq } from "drizzle-orm"

import { getDatabase } from "@/db/client.server"
import { availabilitySettings as availabilitySettingsTable } from "@/db/schema"
import {
  availabilitySettingsSchema,
  defaultAvailabilitySettings,
} from "@/features/availability/domain/settings"
import type { AvailabilitySettings } from "@/features/availability/domain/settings"
import { logger } from "@/lib/logger.server"

const settingsId = "primary"

export async function loadAvailabilitySettings() {
  try {
    const stored = await getDatabase()
      .select()
      .from(availabilitySettingsTable)
      .where(eq(availabilitySettingsTable.id, settingsId))
      .limit(1)

    if (!stored.length) return defaultAvailabilitySettings
    return availabilitySettingsSchema.parse(stored[0])
  } catch (error) {
    logger.warn(
      { errorType: getErrorType(error) },
      "Availability settings unavailable"
    )
    return defaultAvailabilitySettings
  }
}

export async function storeAvailabilitySettings(input: AvailabilitySettings) {
  const settings = availabilitySettingsSchema.parse(input)
  const [stored] = await getDatabase()
    .insert(availabilitySettingsTable)
    .values({ id: settingsId, ...settings, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: availabilitySettingsTable.id,
      set: { ...settings, updatedAt: new Date() },
    })
    .returning()

  return availabilitySettingsSchema.parse(stored)
}

function getErrorType(error: unknown) {
  return error instanceof Error ? error.name : "UnknownError"
}
