import { z } from "zod"

export const visitorEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email().max(254))

export const TEMPORARY_EMAIL_ERROR =
  "Use a permanent email address. Temporary email services are not accepted."

export const EMAIL_VERIFICATION_UNAVAILABLE_ERROR =
  "We could not verify this email right now. Try again in a moment."

export function getEmailVerificationError(error: unknown) {
  if (!(error instanceof Error)) return null

  return error.message === TEMPORARY_EMAIL_ERROR ||
    error.message === EMAIL_VERIFICATION_UNAVAILABLE_ERROR
    ? error.message
    : null
}
