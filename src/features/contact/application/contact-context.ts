import { createServerFn } from "@tanstack/react-start"
import { contactSearchSchema } from "@/features/contact/domain/contact"
import { loadContactContext } from "./contact-context.server"

export const getContactContext = createServerFn({ method: "GET" })
  .validator((input: unknown) => contactSearchSchema.parse(input))
  .handler(({ data }) => loadContactContext(data))
