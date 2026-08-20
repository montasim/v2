// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { PortfolioAssistant } from "@/features/chat/ui/portfolio-assistant"

const sendMessage = vi.hoisted(() => vi.fn())
const setMessages = vi.hoisted(() => vi.fn())
const submitInquiry = vi.hoisted(() => vi.fn())
const chatState = vi.hoisted(
  (): {
    status: "submitted" | "streaming" | "ready" | "error"
    messages: Array<{
      id: string
      role: "user" | "assistant"
      parts: Array<{ type: "text"; text: string }>
      metadata?: { source?: string }
    }>
  } => ({
    status: "ready",
    messages: [],
  })
)

vi.mock("@ai-sdk/react", () => ({
  useChat: () => ({
    messages: chatState.messages,
    sendMessage,
    setMessages,
    status: chatState.status,
    error: undefined,
    regenerate: vi.fn(),
    stop: vi.fn(),
    clearError: vi.fn(),
  }),
}))

vi.mock("@/features/chat/application/submit-inquiry", () => ({
  submitInquiry,
}))

vi.mock("@tanstack/react-start", () => ({
  useServerFn: (serverFn: unknown) => serverFn,
}))

describe("PortfolioAssistant chat navigation", () => {
  beforeEach(() => {
    sendMessage.mockClear()
    setMessages.mockClear()
    submitInquiry.mockReset()
    submitInquiry.mockResolvedValue({ delivered: true })
    chatState.status = "ready"
    chatState.messages = []
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(() => ({ completed: true })),
    })
  })

  afterEach(() => cleanup())

  it("keeps the document scrollbar available while open", () => {
    render(<PortfolioAssistant />)

    fireEvent.click(screen.getByRole("button", { name: "Ask about Montasim" }))

    expect(document.body.hasAttribute("data-scroll-locked")).toBe(false)
  })

  it("can leave chat even when scrollIntoView returns a value", () => {
    render(<PortfolioAssistant />)
    fireEvent.click(screen.getByRole("button", { name: "Ask about Montasim" }))
    fireEvent.click(screen.getByRole("button", { name: /Why hire him/ }))

    expect(() =>
      fireEvent.click(screen.getByRole("button", { name: "Back to assistant" }))
    ).not.toThrow()
    expect(screen.getByText("Explore his background")).not.toBeNull()
    expect(screen.queryByText("What would you like to know?")).toBeNull()
  })

  it("returns to assistant home when chat already has messages", () => {
    chatState.messages = [
      {
        id: "answer",
        role: "assistant",
        parts: [{ type: "text", text: "An existing answer" }],
      },
    ]
    render(<PortfolioAssistant />)
    fireEvent.click(screen.getByRole("button", { name: "Ask about Montasim" }))
    fireEvent.click(screen.getByRole("button", { name: /Why hire him/ }))

    fireEvent.click(screen.getByRole("button", { name: "Back to assistant" }))

    expect(screen.getByText("Explore his background")).not.toBeNull()
  })

  it("returns focus to the composer after an AI response completes", () => {
    chatState.status = "streaming"
    chatState.messages = [
      {
        id: "question",
        role: "user",
        parts: [{ type: "text", text: "Tell me about his experience" }],
      },
      {
        id: "answer",
        role: "assistant",
        parts: [{ type: "text", text: "He builds reliable products." }],
      },
    ]
    const view = render(<PortfolioAssistant />)
    fireEvent.click(screen.getByRole("button", { name: "Ask about Montasim" }))
    fireEvent.click(screen.getByRole("button", { name: /Why hire him/ }))

    const composer = screen.getByRole("textbox", {
      name: "Message",
    })
    expect(composer.hasAttribute("disabled")).toBe(true)

    chatState.status = "ready"
    view.rerender(<PortfolioAssistant />)

    expect(composer.hasAttribute("disabled")).toBe(false)
    expect(document.activeElement).toBe(composer)
  })

  it("matches the prototype icon sizes", () => {
    chatState.messages = [
      {
        id: "answer",
        role: "assistant",
        parts: [{ type: "text", text: "An existing answer" }],
        metadata: { source: "Experience and recommendations" },
      },
    ]
    render(<PortfolioAssistant />)
    const launcher = screen.getByRole("button", {
      name: "Ask about Montasim",
    })

    expect(launcher.className).toContain("size-14")
    expect(launcher.className).toContain("rounded-full")
    expect(launcher.className).toContain("chat-launcher-float")
    expect(launcher.parentElement?.className).toContain("chat-launcher-enter")
    expect(launcher.textContent).toBe("")

    fireEvent.click(launcher)
    fireEvent.click(screen.getByRole("button", { name: /Why hire him/ }))

    const closeIcon = screen
      .getByRole("button", { name: "Close assistant" })
      .querySelector("svg")
    const copyIcon = screen
      .getByRole("button", { name: "Copy answer" })
      .querySelector("svg")

    expect(closeIcon?.getAttribute("class")).toContain("size-5")
    expect(copyIcon?.getAttribute("class")).toContain("size-[15px]")
  })

  it("renders assistant Markdown as formatted content", async () => {
    chatState.messages = [
      {
        id: "markdown-answer",
        role: "assistant",
        metadata: { source: "Experience" },
        parts: [
          {
            type: "text",
            text: [
              "## Recent experience",
              "**Senior Software Engineer**",
              "- Frontend architecture",
              "- Production reliability",
              "[View portfolio](https://example.com)",
              "<button>Unsafe action</button>",
            ].join("\n\n"),
          },
        ],
      },
    ]
    render(<PortfolioAssistant />)

    fireEvent.click(screen.getByRole("button", { name: "Ask about Montasim" }))
    fireEvent.click(screen.getByRole("button", { name: /Why hire him/ }))

    const role = await screen.findByText("Senior Software Engineer")
    const heading = screen.getByRole("heading", { name: "Recent experience" })
    const link = screen.getByRole("link", { name: "View portfolio" })

    expect(role.tagName).toBe("STRONG")
    expect(heading.tagName).toBe("H2")
    expect(screen.getAllByRole("listitem")).toHaveLength(2)
    expect(link.getAttribute("target")).toBe("_blank")
    expect(screen.queryByText("**Senior Software Engineer**")).toBeNull()
    expect(screen.queryByRole("button", { name: "Unsafe action" })).toBeNull()
  })

  it.each([
    ["Why hire him?", "Experience and recommendations"],
    ["Project impact", "Experience and projects"],
    ["Technical expertise", "Skills and experience"],
  ])("uses a prepared answer for %s without calling AI", (title, source) => {
    render(<PortfolioAssistant />)
    fireEvent.click(screen.getByRole("button", { name: "Ask about Montasim" }))

    fireEvent.click(screen.getByRole("button", { name: new RegExp(title) }))

    expect(sendMessage).not.toHaveBeenCalled()
    expect(setMessages).toHaveBeenCalledOnce()
    const update = setMessages.mock.calls[0]?.[0] as (
      messages: unknown[]
    ) => Array<{
      role: string
      metadata?: { source?: string }
      parts: Array<{ text: string }>
    }>
    const messages = update([])
    expect(messages).toHaveLength(2)
    expect(messages[0]?.role).toBe("user")
    expect(messages[1]?.role).toBe("assistant")
    expect(messages[1]?.metadata?.source).toBe(source)
    expect(messages[1]?.parts[0]?.text.length).toBeGreaterThan(300)
  })

  it("answers an approved typed FAQ without calling the AI transport", () => {
    render(<PortfolioAssistant />)
    fireEvent.click(screen.getByRole("button", { name: "Ask about Montasim" }))

    fireEvent.change(screen.getByLabelText("Message"), {
      target: { value: "What is Montasim's current role?" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Send message" }))

    expect(sendMessage).not.toHaveBeenCalled()
    expect(setMessages).toHaveBeenCalledOnce()
    const update = setMessages.mock.calls[0]?.[0] as (
      messages: unknown[]
    ) => Array<{
      role: string
      metadata?: { source?: string }
      parts: Array<{ text: string }>
    }>
    const messages = update([])
    expect(messages[0]?.parts[0]?.text).toBe("What is Montasim's current role?")
    expect(messages[1]?.metadata?.source).toBe("Profile and experience")
    expect(messages[1]?.parts[0]?.text).toContain("Senior Software Engineer")
  })

  it.each([
    {
      question: "We would like to hire Montasim for an open position.",
      heading: "Interested in hiring Montasim?",
      action: "Discuss a role",
    },
    {
      question: "Can we discuss a new project with Montasim?",
      heading: "Have a project for Montasim?",
      action: "Discuss a project",
    },
  ])(
    "shows direct contact paths for $action intent",
    ({ question, heading, action }) => {
      chatState.messages = [
        {
          id: "intent-question",
          role: "user",
          parts: [{ type: "text", text: question }],
        },
        {
          id: "intent-answer",
          role: "assistant",
          parts: [{ type: "text", text: "A grounded answer." }],
          metadata: { source: "Profile" },
        },
      ]

      render(<PortfolioAssistant />)
      fireEvent.click(
        screen.getByRole("button", { name: "Ask about Montasim" })
      )
      fireEvent.click(screen.getByRole("button", { name: /Why hire him/ }))

      expect(screen.getByText(heading)).not.toBeNull()
      expect(screen.getByRole("button", { name: action })).not.toBeNull()
      expect(
        screen
          .getByRole("link", { name: "montasimmamun@gmail.com" })
          .getAttribute("href")
      ).toBe("mailto:montasimmamun@gmail.com")
      expect(
        screen.getByRole("link", { name: "WhatsApp" }).getAttribute("href")
      ).toBe("https://wa.me/8801722815469")
    }
  )

  it("answers hiring intent locally without calling the AI transport", () => {
    render(<PortfolioAssistant />)
    fireEvent.click(screen.getByRole("button", { name: "Ask about Montasim" }))

    fireEvent.change(screen.getByLabelText("Message"), {
      target: { value: "How do I hire him?" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Send message" }))

    expect(sendMessage).not.toHaveBeenCalled()
    expect(setMessages).toHaveBeenCalledOnce()
    const update = setMessages.mock.calls[0]?.[0] as (
      messages: unknown[]
    ) => Array<{
      role: string
      metadata?: { source?: string }
      parts: Array<{ text: string }>
    }>
    const messages = update([])

    expect(messages[0]?.parts[0]?.text).toBe("How do I hire him?")
    expect(messages[1]?.parts[0]?.text).toBe(
      "Here are the quickest ways to discuss hiring Montasim."
    )
    expect(messages[1]?.metadata?.source).toBe("Contact preferences")
  })

  it("uses the same local intent path for chat follow-up questions", () => {
    chatState.messages = [
      {
        id: "existing-answer",
        role: "assistant",
        parts: [{ type: "text", text: "An existing answer." }],
        metadata: { source: "Profile" },
      },
    ]
    render(<PortfolioAssistant />)
    fireEvent.click(screen.getByRole("button", { name: "Ask about Montasim" }))
    fireEvent.click(screen.getByRole("button", { name: /Why hire him/ }))
    sendMessage.mockClear()
    setMessages.mockClear()

    fireEvent.change(screen.getByLabelText("Message"), {
      target: { value: "We have a new job opportunity for him." },
    })
    fireEvent.click(screen.getByRole("button", { name: "Send message" }))

    expect(sendMessage).not.toHaveBeenCalled()
    expect(setMessages).toHaveBeenCalledOnce()
  })

  it("shows SupportKori directly for funding intent", () => {
    chatState.messages = [
      {
        id: "funding-question",
        role: "user",
        parts: [{ type: "text", text: "How can I support Montasim?" }],
      },
      {
        id: "funding-answer",
        role: "assistant",
        parts: [
          {
            type: "text",
            text: "Here is the direct support option for Montasim's independent work.",
          },
        ],
        metadata: { source: "Support preferences" },
      },
    ]
    render(<PortfolioAssistant />)
    fireEvent.click(screen.getByRole("button", { name: "Ask about Montasim" }))
    fireEvent.click(screen.getByRole("button", { name: /Why hire him/ }))

    expect(screen.getByText("Want to support Montasim's work?")).not.toBeNull()
    expect(
      screen
        .getByRole("link", { name: /Support on SupportKori/ })
        .getAttribute("href")
    ).toBe("https://www.supportkori.com/montasim")
    expect(screen.getByText("supportkori.com/montasim")).not.toBeNull()
  })

  it("matches the prototype through a successful role inquiry", async () => {
    render(<PortfolioAssistant />)
    fireEvent.click(screen.getByRole("button", { name: "Ask about Montasim" }))

    const dialog = screen.getByRole("dialog")
    expect(dialog.className).toContain("sm:w-[440px]")
    expect(dialog.className).toContain("sm:h-[min(720px,calc(100dvh-1rem))]")

    fireEvent.click(screen.getByRole("button", { name: /Discuss a role/ }))
    expect(screen.getByText("Question 1 of 4")).not.toBeNull()
    expect(screen.getByText("What role are you hiring for?")).not.toBeNull()

    fireEvent.click(
      screen.getByRole("button", { name: "Senior Frontend Engineer" })
    )
    expect(screen.getByText("Question 2 of 4")).not.toBeNull()
    expect(screen.getByText("What is the work arrangement?")).not.toBeNull()
    expect(
      screen.getByText("This helps Montasim confirm fit and availability.")
    ).not.toBeNull()
    expect(
      (
        screen
          .getByText("Review earlier answers")
          .closest("details") as HTMLDetailsElement
      ).open
    ).toBe(false)

    fireEvent.click(screen.getByRole("button", { name: "Remote" }))
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Montasim Mamun" },
    })
    fireEvent.click(screen.getByRole("button", { name: /Continue/ }))
    fireEvent.change(screen.getByLabelText("Work email"), {
      target: { value: "mamun@yopmail.com" },
    })
    fireEvent.click(screen.getByRole("button", { name: /Send inquiry/ }))

    expect(screen.getByText("Sending inquiry")).not.toBeNull()
    expect(
      screen.getByText("Please keep this window open for a moment.")
    ).not.toBeNull()

    await waitFor(() =>
      expect(screen.getByText("Role inquiry sent")).not.toBeNull()
    )
    expect(screen.getByText("Confirmation")).not.toBeNull()
    expect(screen.getByText("Your inquiry was sent.")).not.toBeNull()
    expect(screen.getByText("mamun@yopmail.com")).not.toBeNull()
    expect(screen.getByText("Senior Frontend Engineer")).not.toBeNull()
    expect(screen.getByText("Montasim Mamun")).not.toBeNull()
    expect(
      screen.getByRole("button", { name: /Continue asking questions/ })
    ).not.toBeNull()
    expect(
      screen.getByText(
        "Contact details stay separate from AI conversation history."
      )
    ).not.toBeNull()
  })

  it("matches the prototype error recovery and returns to email editing", async () => {
    submitInquiry.mockRejectedValueOnce(new Error("Delivery failed"))
    render(<PortfolioAssistant />)
    fireEvent.click(screen.getByRole("button", { name: "Ask about Montasim" }))
    fireEvent.click(screen.getByRole("button", { name: /Discuss a project/ }))
    fireEvent.click(screen.getByRole("button", { name: "SaaS platform" }))
    fireEvent.click(screen.getByRole("button", { name: "Flexible" }))
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Amina Rahman" },
    })
    fireEvent.click(screen.getByRole("button", { name: /Continue/ }))
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "amina@example.com" },
    })
    fireEvent.click(screen.getByRole("button", { name: /Send inquiry/ }))

    await waitFor(() =>
      expect(screen.getByText("Could not send inquiry")).not.toBeNull()
    )
    expect(screen.getByText("Your answers are still saved")).not.toBeNull()
    expect(screen.getByText("Your inquiry was not sent.")).not.toBeNull()
    expect(screen.getByRole("button", { name: "Change email" })).not.toBeNull()
    expect(screen.getByRole("link", { name: "Email directly" })).not.toBeNull()

    fireEvent.click(screen.getByRole("button", { name: "Change email" }))
    expect(screen.getByText("Question 4 of 4")).not.toBeNull()
    expect(screen.getByDisplayValue("amina@example.com")).not.toBeNull()
  })
})
