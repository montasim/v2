import { afterEach, describe, expect, it, vi } from "vitest"

import {
  EMAIL_VERIFICATION_UNAVAILABLE_ERROR,
  TEMPORARY_EMAIL_ERROR,
} from "@/features/email-verification/domain/email-verification"
import { requirePermanentEmail } from "@/features/email-verification/infrastructure/disposable-email.server"

describe("requirePermanentEmail", () => {
  afterEach(() => vi.unstubAllGlobals())

  it("checks only the normalized domain and accepts permanent email", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ disposable: "false" }), { status: 200 })
      )
    vi.stubGlobal("fetch", fetchMock)

    await expect(
      requirePermanentEmail(" Person@Company.com ")
    ).resolves.toBeUndefined()

    const requestedUrl = new URL(String(fetchMock.mock.calls[0]?.[0]))
    expect(requestedUrl.searchParams.get("email")).toBe("company.com")
    expect(requestedUrl.toString()).not.toContain("person%40")
  })

  it("rejects an address when the real-time checker marks its domain disposable", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ disposable: "true" }), { status: 200 })
        )
    )

    await expect(requirePermanentEmail("person@example.com")).rejects.toThrow(
      TEMPORARY_EMAIL_ERROR
    )
  })

  it("does not accept an unchecked address when the checker is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")))

    await expect(requirePermanentEmail("person@example.com")).rejects.toThrow(
      EMAIL_VERIFICATION_UNAVAILABLE_ERROR
    )
  })
})
