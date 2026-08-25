import { containsOffensiveLanguage } from "@/lib/content-moderation"

const MODERATION_ERROR =
  "Please revise your comment. Offensive or abusive language is not allowed."
const NAME_MODERATION_ERROR =
  "Please revise your name. Offensive or abusive language is not allowed."

export interface CommentModerationInput {
  name: string
  message: string
}

export async function getCommentModerationError(message: string) {
  return (await containsOffensiveLanguage(message)) ? MODERATION_ERROR : null
}

export async function getCommentSubmissionModerationError({
  name,
  message,
}: CommentModerationInput) {
  if (await containsOffensiveLanguage(name)) {
    return { field: "name" as const, message: NAME_MODERATION_ERROR }
  }
  if (await containsOffensiveLanguage(message)) {
    return { field: "message" as const, message: MODERATION_ERROR }
  }
  return null
}

export { MODERATION_ERROR, NAME_MODERATION_ERROR }
