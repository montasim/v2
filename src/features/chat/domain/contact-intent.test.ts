import { describe, expect, it } from "vitest"

import { getContactGuidance } from "@/features/chat/domain/contact-intent"

describe("contact intent", () => {
  it.each([
    "We would like to hire Montasim.",
    "We have a senior frontend job opportunity for him.",
    "Could Montasim join our team?",
    "Would he be suitable for this position?",
  ])("recognizes role intent in: %s", (question) => {
    expect(getContactGuidance({ question })?.intent).toBe("hire")
  })

  it.each([
    "Can we discuss a new project?",
    "We need a developer to help with our product.",
    "I have a freelance opportunity for Montasim.",
    "Could we work together?",
  ])("recognizes project intent in: %s", (question) => {
    expect(getContactGuidance({ question })?.intent).toBe("project")
  })

  it.each([
    "How can I fund Montasim's work?",
    "Can I sponsor his projects?",
    "I would like to support Montasim.",
    "Where can I donate?",
  ])("recognizes funding intent in: %s", (question) => {
    expect(getContactGuidance({ question })?.intent).toBe("funding")
  })

  it("does not treat informational questions as contact intent", () => {
    expect(
      getContactGuidance({ question: "What is Montasim's current role?" })
    ).toBeUndefined()
    expect(
      getContactGuidance({ question: "Tell me about PostCraft." })
    ).toBeUndefined()
  })

  it("preserves actions for existing prepared answers", () => {
    expect(
      getContactGuidance({
        question: "Which work best shows his impact?",
        source: "Experience and projects",
      })?.intent
    ).toBe("project")
    expect(
      getContactGuidance({
        question: "What makes him a strong engineer?",
        source: "Experience and recommendations",
      })?.intent
    ).toBe("hire")
  })
})
