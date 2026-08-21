import { z } from "zod"

import { visitorEmailSchema } from "@/features/email-verification/domain/email-verification"
import { blogPostSlugSchema } from "@/lib/content/blog"

export const blogCommentSchema = z.object({
  id: z.uuid(),
  postSlug: blogPostSlugSchema,
  name: z.string().min(1).max(80),
  message: z.string().min(1).max(2_000),
  createdAt: z.iso.datetime(),
  replyTo: z.uuid().nullable(),
})

export const blogCommentMessageSchema = z
  .string()
  .trim()
  .min(1, "Enter a comment before posting.")
  .max(2_000, "Keep your comment under 2,000 characters.")

export const blogCommentSubmissionSchema = z.object({
  postSlug: blogPostSlugSchema,
  name: z.string().trim().min(2).max(80),
  email: visitorEmailSchema,
  message: blogCommentMessageSchema,
  replyTo: z.uuid().nullable(),
})

export const blogCommentRequestSchema = z.object({
  comment: blogCommentSubmissionSchema,
  website: z.string().trim().max(200).default(""),
})

export type BlogComment = z.infer<typeof blogCommentSchema>
export type BlogCommentSubmission = z.infer<typeof blogCommentSubmissionSchema>
