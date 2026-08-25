import { containsOffensiveLanguage } from "@/lib/content-moderation"

export const CHAT_MODERATION_ERROR =
  "Please revise your message. Offensive or abusive language is not allowed."

export async function getChatModerationError(message: string) {
  return (await containsOffensiveLanguage(message))
    ? CHAT_MODERATION_ERROR
    : null
}
