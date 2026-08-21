import { createServerFn } from "@tanstack/react-start"

import { visitorEmailSchema } from "@/features/email-verification/domain/email-verification"
import { requirePermanentEmail } from "@/features/email-verification/infrastructure/disposable-email.server"

export const verifyVisitorEmail = createServerFn({ method: "POST" })
  .validator((input: unknown) => visitorEmailSchema.parse(input))
  .handler(async ({ data: email }) => {
    await requirePermanentEmail(email)
    return { accepted: true as const }
  })
