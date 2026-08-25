import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  ChatQuestionReplayConflictError,
  DatabaseChatQuestionRecorder,
} from "@/features/chat/infrastructure/chat-questions.server"

const database = vi.hoisted(() => {
  const existing: { question: string }[] = []
  const inserted: { question: string }[] = []
  const returning = vi.fn(async () => inserted)
  const onConflictDoNothing = vi.fn(() => ({ returning }))
  const values = vi.fn(() => ({ onConflictDoNothing }))
  const insert = vi.fn(() => ({ values }))
  const limit = vi.fn(async () => existing)
  const where = vi.fn(() => ({ limit }))
  const from = vi.fn(() => ({ where }))
  const select = vi.fn(() => ({ from }))

  return {
    existing,
    inserted,
    returning,
    onConflictDoNothing,
    values,
    insert,
    limit,
    where,
    from,
    select,
  }
})

vi.mock("@/db/client.server", () => ({
  getDatabase: () => database,
}))

const question = {
  conversationId: "conversation-1",
  clientMessageId: "message-1",
  question: "What is his strongest work?",
}

describe("database chat question recorder", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    database.existing.length = 0
    database.inserted.splice(0, database.inserted.length, {
      question: question.question,
    })
  })

  it("stores a validated question independently of any answer", async () => {
    await new DatabaseChatQuestionRecorder().recordQuestion(question)

    expect(database.values).toHaveBeenCalledWith(question)
    expect(database.onConflictDoNothing).toHaveBeenCalledOnce()
    expect(database.select).not.toHaveBeenCalled()
  })

  it("treats a normalized retry as the same question", async () => {
    database.inserted.length = 0
    database.existing.push({ question: "  What   is his strongest work?  " })

    await expect(
      new DatabaseChatQuestionRecorder().recordQuestion(question)
    ).resolves.toBeUndefined()
  })

  it("rejects reuse of a message ID for a different question", async () => {
    database.inserted.length = 0
    database.existing.push({ question: "What is his latest project?" })

    await expect(
      new DatabaseChatQuestionRecorder().recordQuestion(question)
    ).rejects.toBeInstanceOf(ChatQuestionReplayConflictError)
  })
})
