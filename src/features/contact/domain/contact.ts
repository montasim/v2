import { z } from "zod"
import { visitorEmailSchema } from "@/features/email-verification/domain/email-verification"

export const contactTopics = [
  "support",
  "feedback",
  "question",
  "collaboration",
  "general",
] as const
export const contactTopicSchema = z.enum(contactTopics)
export type ContactTopic = z.infer<typeof contactTopicSchema>
export const contactTopicLabels: Record<ContactTopic, string> = {
  support: "App or project support",
  feedback: "Suggestion or feedback",
  question: "Question about my work",
  collaboration: "Hiring or collaboration",
  general: "General conversation",
}
const normalizedText = z
  .string()
  .transform((value) => value.normalize("NFC").replace(/\r\n?/g, "\n").trim())
const optionalText = (length: number) =>
  normalizedText
    .pipe(
      z
        .string()
        .max(length)
        .refine((value) => !/\p{Cc}/u.test(value), {
          message: "Use a single line without control characters.",
        })
    )
    .transform((value) => value || undefined)
    .optional()
export const contactSubmissionSchema = z
  .object({
    id: z.uuid(),
    type: z.literal("contact"),
    name: optionalText(80),
    email: visitorEmailSchema,
    context: normalizedText.pipe(
      z
        .string()
        .min(10, "Please write at least 10 characters.")
        .max(5_000)
        .refine((value) => !/\p{Cc}/u.test(value.replace(/[\n\t]/g, "")), {
          message: "Remove unsupported control characters from your message.",
        })
    ),
    topic: contactTopicSchema,
    projectId: optionalText(200),
    projectTitle: optionalText(300),
    relatedPath: optionalText(300),
    relatedTitle: optionalText(300),
    unlistedProject: optionalText(160),
    platform: optionalText(100),
    appVersion: optionalText(100),
  })
  .superRefine((value, ctx) => {
    if (
      value.topic === "support" &&
      !value.projectId &&
      !value.unlistedProject
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["projectId"],
        message: "Choose a project or enter its name below.",
      })
    }
  })
export type ContactSubmission = z.infer<typeof contactSubmissionSchema>
export const contactSearchSchema = z.object({
  topic: contactTopicSchema.optional().catch(undefined),
  app: z.string().trim().max(200).optional().catch(undefined),
  from: z.string().trim().max(500).optional().catch(undefined),
})
export type ContactSearch = z.infer<typeof contactSearchSchema>
export function contactHref(search: ContactSearch = {}) {
  const params = new URLSearchParams()
  const parsed = contactSearchSchema.parse(search)
  for (const [key, value] of Object.entries(parsed))
    if (value) params.set(key, value)
  return `/contact${params.size ? `?${params}` : ""}`
}
