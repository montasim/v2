import { and, eq } from "drizzle-orm"

import { getDatabase } from "@/db/client.server"
import { assistantChatQuestions } from "@/db/schema"
import type {
  ChatQuestion,
  ChatQuestionRecorder,
} from "@/features/chat/application/ports/chat-question-recorder"

export class DatabaseChatQuestionRecorder implements ChatQuestionRecorder {
  async recordQuestion(question: ChatQuestion) {
    const inserted = await getDatabase()
      .insert(assistantChatQuestions)
      .values(question)
      .onConflictDoNothing({
        target: [
          assistantChatQuestions.conversationId,
          assistantChatQuestions.clientMessageId,
        ],
      })
      .returning({ question: assistantChatQuestions.question })

    if (inserted[0]) return

    const existing = await getDatabase()
      .select({ question: assistantChatQuestions.question })
      .from(assistantChatQuestions)
      .where(
        and(
          eq(assistantChatQuestions.conversationId, question.conversationId),
          eq(assistantChatQuestions.clientMessageId, question.clientMessageId)
        )
      )
      .limit(1)

    if (
      !existing[0] ||
      normalizeQuestion(existing[0].question) !==
        normalizeQuestion(question.question)
    ) {
      throw new ChatQuestionReplayConflictError()
    }
  }
}

export class ChatQuestionReplayConflictError extends Error {
  readonly code = "chat-question-replay-conflict"

  constructor() {
    super("A client message ID cannot be reused for a different question.")
    this.name = "ChatQuestionReplayConflictError"
  }
}

function normalizeQuestion(value: string) {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ")
}
