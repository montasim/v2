import { describe, expect, it } from "vitest"

import {
  InvalidChatRequestError,
  MAX_CHAT_HISTORY_CHARACTERS,
  MAX_CHAT_MESSAGE_CHARACTERS,
  validateChatRequest,
} from "@/features/chat/domain/chat"

describe("validateChatRequest", () => {
  it("accepts a bounded text-only conversation", async () => {
    const result = await validateChatRequest({
      messages: [
        {
          id: "one",
          role: "user",
          parts: [{ type: "text", text: "What has he built?" }],
        },
      ],
    })

    expect(result.question).toBe("What has he built?")
    expect(result.messages[0]?.parts).toEqual([
      { type: "text", text: "What has he built?" },
    ])
  })

  it("accepts regeneration history containing assistant transport markers", async () => {
    const result = await validateChatRequest({
      trigger: "regenerate-message",
      messages: [
        {
          id: "previous-question",
          role: "user",
          parts: [{ type: "text", text: "Tell me more" }],
        },
        {
          id: "previous-answer",
          role: "assistant",
          parts: [
            { type: "step-start" },
            { type: "text", text: "A grounded portfolio answer." },
          ],
        },
        {
          id: "latest-question",
          role: "user",
          parts: [{ type: "text", text: "What is his recent work?" }],
        },
      ],
    })

    expect(result.question).toBe("What is his recent work?")
    expect(result.messages[1]?.parts).toEqual([
      { type: "text", text: "A grounded portfolio answer." },
    ])
  })

  it("drops the oldest messages when valid chat history exceeds the context budget", async () => {
    const result = await validateChatRequest({
      trigger: "regenerate-message",
      messages: [
        ...Array.from({ length: 10 }, (_, index) => ({
          id: `history-${index}`,
          role: index % 2 === 0 ? ("user" as const) : ("assistant" as const),
          parts: [{ type: "text" as const, text: "x".repeat(900) }],
        })),
        {
          id: "latest-question",
          role: "user",
          parts: [{ type: "text", text: "What is his recent work?" }],
        },
      ],
    })

    const retainedCharacters = result.messages.reduce(
      (total, message) =>
        total +
        message.parts.reduce(
          (messageTotal, part) =>
            messageTotal + (part.type === "text" ? part.text.length : 0),
          0
        ),
      0
    )

    expect(result.question).toBe("What is his recent work?")
    expect(retainedCharacters).toBeLessThanOrEqual(MAX_CHAT_HISTORY_CHARACTERS)
    expect(result.messages.at(-1)?.id).toBe("latest-question")
    expect(result.messages[0]?.id).not.toBe("history-0")
  })

  it("rejects non-text parts", async () => {
    await expect(
      validateChatRequest({
        messages: [
          {
            id: "one",
            role: "user",
            parts: [
              {
                type: "file",
                mediaType: "image/png",
                url: "data:image/png;base64,AA==",
              },
            ],
          },
        ],
      })
    ).rejects.toBeInstanceOf(InvalidChatRequestError)
  })

  it("rejects oversized latest questions", async () => {
    await expect(
      validateChatRequest({
        messages: [
          {
            id: "one",
            role: "user",
            parts: [
              {
                type: "text",
                text: "x".repeat(MAX_CHAT_MESSAGE_CHARACTERS + 1),
              },
            ],
          },
        ],
      })
    ).rejects.toThrow(`between 1 and ${MAX_CHAT_MESSAGE_CHARACTERS}`)
  })
})
