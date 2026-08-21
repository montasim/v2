import { z } from "zod"

import {
  EMAIL_VERIFICATION_UNAVAILABLE_ERROR,
  TEMPORARY_EMAIL_ERROR,
  visitorEmailSchema,
} from "@/features/email-verification/domain/email-verification"

const disposableEmailResponseSchema = z.object({
  disposable: z.enum(["true", "false"]),
})

const CHECK_TIMEOUT_MS = 4_000

async function lookupDisposableDomain(domain: string) {
  const endpoint = new URL("https://disposable.debounce.io/")
  endpoint.searchParams.set("email", domain)

  const response = await fetch(endpoint, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(CHECK_TIMEOUT_MS),
  })

  if (!response.ok) throw new Error("Disposable email lookup failed.")

  const result = disposableEmailResponseSchema.parse(await response.json())
  return result.disposable === "true"
}

export async function requirePermanentEmail(email: string) {
  const normalizedEmail = visitorEmailSchema.parse(email)
  const domain = normalizedEmail.slice(normalizedEmail.lastIndexOf("@") + 1)

  try {
    if (await lookupDisposableDomain(domain)) {
      throw new Error(TEMPORARY_EMAIL_ERROR)
    }
  } catch (error) {
    if (error instanceof Error && error.message === TEMPORARY_EMAIL_ERROR) {
      throw error
    }

    throw new Error(EMAIL_VERIFICATION_UNAVAILABLE_ERROR)
  }
}
