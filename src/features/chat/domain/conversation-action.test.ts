import { describe, expect, it } from "vitest"

import { inferConversationAction } from "@/features/chat/domain/conversation-action"

describe("inferConversationAction", () => {
  it.each([
    ["I want to hire Montasim for an open position.", "hire"],
    ["How can we contact him about a senior role?", "hire"],
    ["Is Montasim available for an engineering role?", "hire"],
    ["How can a recruiter contact Montasim?", "hire"],
    ["We would like to discuss a client project with Montasim.", "project"],
    ["I have a product I want him to build.", "project"],
    ["Could we work together?", "project"],
    ["We need a developer to help with our product.", "project"],
    ["How can a client contact Montasim?", "project"],
    ["How can I sponsor his work?", "funding"],
    ["I want to support Montasim's projects.", "funding"],
  ] as const)("maps an explicit next step: %s", (question, expected) => {
    expect(inferConversationAction(question)).toBe(expected)
  })

  it.each([
    "Why should we hire Montasim?",
    "What makes him a strong candidate?",
    "Which projects has he built?",
    "How does he manage projects?",
    "What role does he have?",
    "What funding model does PostCraft use?",
  ])(
    "does not turn an evaluation into a contact-only action: %s",
    (question) => {
      expect(inferConversationAction(question)).toBeUndefined()
    }
  )
})
