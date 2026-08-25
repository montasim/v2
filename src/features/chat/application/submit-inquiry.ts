import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"

import { submitInquiryOnServer } from "@/features/chat/application/submit-inquiry-runtime.server"
import { inquirySubmissionSchema } from "@/features/chat/domain/inquiry"
import { INVALID_INQUIRY_REQUEST_ERROR } from "@/features/chat/domain/inquiry-errors"

export {
  INQUIRY_SUBMISSION_UNAVAILABLE_ERROR,
  INVALID_INQUIRY_REQUEST_ERROR,
} from "@/features/chat/domain/inquiry-errors"

export const inquiryRequestSchema = z.object({
  inquiry: inquirySubmissionSchema,
  website: z.string().trim().max(200).default(""),
})

export const MAX_INQUIRY_REQUEST_BYTES = 4_096
export function parseInquiryRequest(input: unknown) {
  let serialized: string | undefined
  try {
    serialized = JSON.stringify(input)
  } catch {
    throw new Error("The inquiry request is invalid.")
  }

  if (
    new TextEncoder().encode(serialized).byteLength > MAX_INQUIRY_REQUEST_BYTES
  ) {
    throw new Error("The inquiry request is too large.")
  }

  try {
    return inquiryRequestSchema.parse(input)
  } catch {
    throw new Error(INVALID_INQUIRY_REQUEST_ERROR)
  }
}

// TanStack Start applies its default CSRF request middleware to server functions.
// Do not instantiate createCsrfMiddleware here: its browser stub is undefined.
export const submitInquiry = createServerFn({ method: "POST" })
  .validator(parseInquiryRequest)
  .handler(({ data }) => submitInquiryOnServer(data))
