import type { InquirySubmission } from "@/features/chat/domain/inquiry"
import { containsOffensiveLanguage } from "@/lib/content-moderation"

export const INQUIRY_MODERATION_ERROR =
  "Please revise this field. Offensive or abusive language is not allowed."

export async function getInquiryMessageModerationError(message: string) {
  return (await containsOffensiveLanguage(message))
    ? INQUIRY_MODERATION_ERROR
    : null
}

export async function getInquiryModerationError(inquiry: InquirySubmission) {
  const values = [
    inquiry.name,
    inquiry.context,
    inquiry.type === "hire" ? inquiry.role : undefined,
    inquiry.type === "hire" ? inquiry.arrangement : undefined,
    inquiry.type === "project" ? inquiry.projectType : undefined,
    inquiry.type === "project" ? inquiry.timeline : undefined,
  ]

  for (const value of values) {
    if (value && (await containsOffensiveLanguage(value))) {
      return INQUIRY_MODERATION_ERROR
    }
  }

  return null
}
