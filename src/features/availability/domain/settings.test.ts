import { describe, expect, it } from "vitest"

import {
  availabilitySettingsSchema,
  defaultAvailabilitySettings,
} from "@/features/availability/domain/settings"

describe("availability settings", () => {
  it("provides a valid public fallback", () => {
    expect(
      availabilitySettingsSchema.parse(defaultAvailabilitySettings)
    ).toEqual(defaultAvailabilitySettings)
  })

  it("supports hiding the section while retaining its configured content", () => {
    expect(
      availabilitySettingsSchema.parse({
        ...defaultAvailabilitySettings,
        enabled: false,
        availability: "Open from October",
      })
    ).toMatchObject({ enabled: false, availability: "Open from October" })
  })
})
