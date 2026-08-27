// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { AvailabilityCard } from "@/components/portfolio/availability-card"
import { PORTFOLIO_CHAT_UNAVAILABLE_MESSAGE } from "@/features/chat/domain/portfolio-chat"
import { PortfolioAssistant } from "@/features/chat/ui/portfolio-assistant"
import { TEMPORARY_EMAIL_ERROR } from "@/features/email-verification/domain/email-verification"

const sendMessage = vi.hoisted(() => vi.fn())
const setMessages = vi.hoisted(() => vi.fn())
const submitInquiry = vi.hoisted(() => vi.fn())
const verifyVisitorEmail = vi.hoisted(() => vi.fn())
const chatState = vi.hoisted(
  (): {
    status: "submitted" | "streaming" | "ready" | "error"
    error?: Error
    messages: Array<{
      id: string
      role: "user" | "assistant"
      parts: Array<{ type: "text"; text: string }>
      metadata?: {
        source?: string
        citations?: Array<{ label: string; href: string }>
        contactAction?: "hire" | "project" | "funding" | "general"
        provider?: "openrouter" | "gemini" | "groq"
        model?: string
        responseKind?: "exact" | "generated" | "handoff"
        fallbackDepth?: number
      }
    }>
  } => ({
    status: "ready",
    error: undefined,
    messages: [],
  })
)

vi.mock("@ai-sdk/react", () => ({
  useChat: () => ({
    messages: chatState.messages,
    sendMessage,
    setMessages,
    status: chatState.status,
    error: chatState.error,
    regenerate: vi.fn(),
    stop: vi.fn(),
    clearError: vi.fn(),
  }),
}))

vi.mock("@/features/chat/application/submit-inquiry", () => ({
  submitInquiry,
}))

vi.mock(
  "@/features/email-verification/application/verify-visitor-email",
  () => ({ verifyVisitorEmail })
)

vi.mock("@tanstack/react-start", () => ({
  useServerFn: (serverFn: unknown) => serverFn,
}))

describe("PortfolioAssistant chat navigation", () => {
  beforeEach(() => {
    sendMessage.mockClear()
    setMessages.mockClear()
    submitInquiry.mockReset()
    submitInquiry.mockResolvedValue({ delivered: true })
    verifyVisitorEmail.mockReset()
    verifyVisitorEmail.mockResolvedValue({ accepted: true })
    chatState.status = "ready"
    chatState.error = undefined
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

  it("blocks offensive assistant messages before sending", async () => {
    render(<PortfolioAssistant />)
    fireEvent.click(screen.getByRole("button", { name: "Ask about Montasim" }))
    fireEvent.click(screen.getByRole("button", { name: /Why hire him/ }))
    sendMessage.mockClear()

    fireEvent.change(screen.getByRole("textbox", { name: "Message" }), {
      target: { value: "You are a fucking idiot." },
    })
    fireEvent.click(screen.getByRole("button", { name: "Send message" }))

    await waitFor(() =>
      expect(
        screen.getByText(
          "Please revise your message. Offensive or abusive language is not allowed."
        )
      ).not.toBeNull()
    )
    expect(sendMessage).not.toHaveBeenCalled()
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
    expect(launcher.className).not.toContain("chat-launcher-float")
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

    const role = await screen.findByText(
      "Senior Software Engineer",
      undefined,
      { timeout: 3000 }
    )
    const heading = screen.getByRole("heading", { name: "Recent experience" })
    const link = screen.getByRole("link", { name: "View portfolio" })

    expect(role.tagName).toBe("STRONG")
    expect(heading.tagName).toBe("H2")
    expect(screen.getAllByRole("listitem")).toHaveLength(2)
    expect(link.getAttribute("target")).toBe("_blank")
    expect(screen.queryByText("**Senior Software Engineer**")).toBeNull()
    expect(screen.queryByRole("button", { name: "Unsafe action" })).toBeNull()
  })

  it("renders links to supporting portfolio evidence", () => {
    const citationLabel =
      "I Refused to Make WebGL the Only Way In: The Architecture Behind Fallback Rendering"
    chatState.messages = [
      {
        id: "cited-answer",
        role: "assistant",
        metadata: {
          source: "Projects",
          citations: [
            {
              label: citationLabel,
              href: "/projects#project-postcraft",
            },
          ],
        },
        parts: [{ type: "text", text: "PostCraft is a shipped AI product." }],
      },
    ]
    render(<PortfolioAssistant />)
    fireEvent.click(screen.getByRole("button", { name: "Ask about Montasim" }))
    fireEvent.click(screen.getByRole("button", { name: /Why hire him/ }))

    const citation = screen.getByRole("link", { name: citationLabel })
    const citationClasses = citation.className.split(" ")

    expect(citation.getAttribute("href")).toBe("/projects#project-postcraft")
    expect(citationClasses).toContain("max-w-full")
    expect(citationClasses).toContain("min-w-0")
    expect(citationClasses).toContain("shrink")
    expect(citationClasses).toContain("whitespace-normal")
    expect(citationClasses).not.toContain("shrink-0")
    expect(citationClasses).not.toContain("whitespace-nowrap")
    expect(citation.querySelector("span")?.className.split(" ")).toContain(
      "break-words"
    )
    expect(screen.getByText("Supporting evidence")).not.toBeNull()
  })

  it("shows the model that produced a generated answer", () => {
    chatState.messages = [
      {
        id: "generated-answer",
        role: "assistant",
        metadata: {
          source: "Experience",
          provider: "openrouter",
          model: "z-ai/glm-5.2:free",
          responseKind: "generated",
          fallbackDepth: 0,
        },
        parts: [{ type: "text", text: "A validated generated answer." }],
      },
    ]

    render(<PortfolioAssistant />)
    fireEvent.click(screen.getByRole("button", { name: "Ask about Montasim" }))
    fireEvent.click(screen.getByRole("button", { name: /Why hire him/ }))

    expect(
      screen.getByText("openrouter · z-ai/glm-5.2:free · Experience")
    ).not.toBeNull()
  })

  it.each([
    [
      "Why hire him?",
      "Why should a hiring manager consider Montasim for a senior engineering role?",
    ],
    [
      "Project impact",
      "Which small set of outcomes best represents Montasim's career impact?",
    ],
    ["Technical expertise", "What is Montasim's core engineering stack?"],
  ])("sends the prepared question for %s to the server", (title, question) => {
    render(<PortfolioAssistant />)
    fireEvent.click(screen.getByRole("button", { name: "Ask about Montasim" }))

    fireEvent.click(screen.getByRole("button", { name: new RegExp(title) }))

    expect(sendMessage).toHaveBeenCalledOnce()
    expect(sendMessage).toHaveBeenCalledWith({ text: question })
    expect(setMessages).not.toHaveBeenCalled()
  })

  it("sends an approved typed FAQ to the server", async () => {
    render(<PortfolioAssistant />)
    fireEvent.click(screen.getByRole("button", { name: "Ask about Montasim" }))

    fireEvent.change(screen.getByLabelText("Message"), {
      target: { value: "What is Montasim's current role?" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Send message" }))

    await waitFor(() => expect(sendMessage).toHaveBeenCalledOnce())
    expect(sendMessage).toHaveBeenCalledWith({
      text: "What is Montasim's current role?",
    })
    expect(setMessages).not.toHaveBeenCalled()
  })

  it.each([
    {
      question: "We would like to hire Montasim for an open position.",
      contactAction: "hire" as const,
      heading: "Interested in hiring Montasim?",
      action: "Discuss a role",
    },
    {
      question: "Can we discuss a new project with Montasim?",
      contactAction: "project" as const,
      heading: "Have a project for Montasim?",
      action: "Discuss a project",
    },
  ])(
    "shows server-selected direct contact paths for $contactAction intent",
    ({ question, contactAction, heading, action }) => {
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
          metadata: { source: "Profile", contactAction },
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
      ).toBe("https://wa.me/montasimalmamun")
    }
  )

  it("sends hiring intent to the server", async () => {
    render(<PortfolioAssistant />)
    fireEvent.click(screen.getByRole("button", { name: "Ask about Montasim" }))

    fireEvent.change(screen.getByLabelText("Message"), {
      target: { value: "How do I hire him?" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Send message" }))

    await waitFor(() => expect(sendMessage).toHaveBeenCalledOnce())
    expect(sendMessage).toHaveBeenCalledWith({ text: "How do I hire him?" })
    expect(setMessages).not.toHaveBeenCalled()
  })

  it("sends contact follow-up questions to the server", async () => {
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

    await waitFor(() => expect(sendMessage).toHaveBeenCalledOnce())
    expect(sendMessage).toHaveBeenCalledWith({
      text: "We have a new job opportunity for him.",
    })
    expect(setMessages).not.toHaveBeenCalled()
  })

  it("sends funding questions to the server", async () => {
    render(<PortfolioAssistant />)
    fireEvent.click(screen.getByRole("button", { name: "Ask about Montasim" }))

    fireEvent.change(screen.getByLabelText("Message"), {
      target: { value: "How can I support Montasim?" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Send message" }))

    await waitFor(() => expect(sendMessage).toHaveBeenCalledOnce())
    expect(sendMessage).toHaveBeenCalledWith({
      text: "How can I support Montasim?",
    })
    expect(setMessages).not.toHaveBeenCalled()
  })

  it("shows SupportKori for a server-selected funding action", () => {
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
        metadata: {
          source: "Support preferences",
          contactAction: "funding",
        },
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

  it("shows direct contact paths for a server-selected general action", () => {
    chatState.messages = [
      {
        id: "general-question",
        role: "user",
        parts: [
          { type: "text", text: "What is Montasim's current availability?" },
        ],
      },
      {
        id: "general-answer",
        role: "assistant",
        parts: [
          {
            type: "text",
            text: "Please contact Montasim directly for a verified detail.",
          },
        ],
        metadata: { source: "Portfolio", contactAction: "general" },
      },
    ]
    render(<PortfolioAssistant />)
    fireEvent.click(screen.getByRole("button", { name: "Ask about Montasim" }))
    fireEvent.click(screen.getByRole("button", { name: /Why hire him/ }))

    expect(screen.getByText("Need a verified detail?")).not.toBeNull()
    expect(
      screen.getByText(
        "Contact Montasim directly for information that is not published in this portfolio."
      )
    ).not.toBeNull()
    expect(
      screen
        .getByRole("link", { name: "montasimmamun@gmail.com" })
        .getAttribute("href")
    ).toBe("mailto:montasimmamun@gmail.com")
    expect(
      screen.getByRole("link", { name: "WhatsApp" }).getAttribute("href")
    ).toBe("https://wa.me/montasimalmamun")
  })

  it("shows the direct contact handoff for every failed chat response", () => {
    chatState.status = "error"
    chatState.error = new Error("Provider unreachable")

    render(<PortfolioAssistant />)
    fireEvent.click(screen.getByRole("button", { name: "Ask about Montasim" }))
    fireEvent.click(screen.getByRole("button", { name: /Why hire him/ }))

    const handoff = screen.getByRole("alert")
    expect(screen.getByText(PORTFOLIO_CHAT_UNAVAILABLE_MESSAGE)).not.toBeNull()
    expect(handoff.className).not.toContain("destructive")
    expect(screen.queryByText("Could not load the answer")).toBeNull()
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull()
    expect(
      screen
        .getByRole("link", { name: "montasimmamun@gmail.com" })
        .getAttribute("href")
    ).toBe("mailto:montasimmamun@gmail.com")
    expect(
      screen.getByRole("link", { name: "WhatsApp" }).getAttribute("href")
    ).toBe("https://wa.me/montasimalmamun")
  })

  it("opens the role inquiry directly from the availability card", () => {
    render(
      <>
        <AvailabilityCard />
        <PortfolioAssistant />
      </>
    )

    fireEvent.click(screen.getByRole("button", { name: "Discuss a role" }))

    expect(screen.getByRole("dialog")).not.toBeNull()
    expect(screen.getByText("Question 1 of 4")).not.toBeNull()
    expect(screen.getByText("What role are you hiring for?")).not.toBeNull()
    expect(
      screen.getByRole("button", { name: "Senior Frontend Engineer" })
    ).not.toBeNull()
  })

  it("collects a specific custom project type instead of a generic option", async () => {
    render(<PortfolioAssistant />)
    fireEvent.click(screen.getByRole("button", { name: "Ask about Montasim" }))
    fireEvent.click(screen.getByRole("button", { name: /Discuss a project/ }))
    fireEvent.click(screen.getByRole("button", { name: "Something else" }))

    fireEvent.change(screen.getByLabelText("Project type"), {
      target: { value: "Developer tooling" },
    })
    fireEvent.click(screen.getByRole("button", { name: /Continue/ }))

    await waitFor(() =>
      expect(screen.getByText("When would you like to start?")).not.toBeNull()
    )
    expect(screen.getByText("Developer tooling")).not.toBeNull()
  })

  it("submits a general query through the Something else flow", async () => {
    render(<PortfolioAssistant />)
    fireEvent.click(screen.getByRole("button", { name: "Ask about Montasim" }))
    fireEvent.click(screen.getByRole("button", { name: "Something else" }))

    expect(screen.getByText("Question 1 of 3")).not.toBeNull()
    expect(screen.getByText("What would you like to discuss?")).not.toBeNull()
    fireEvent.change(screen.getByLabelText("Your query"), {
      target: { value: "Could you review my architecture proposal?" },
    })
    fireEvent.click(screen.getByRole("button", { name: /Continue/ }))
    await waitFor(() =>
      expect(screen.getByText("Who should Montasim reply to?")).not.toBeNull()
    )
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Nadia Ahmed" },
    })
    fireEvent.click(screen.getByRole("button", { name: /Continue/ }))
    await waitFor(() => expect(screen.getByLabelText("Email")).not.toBeNull())
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "nadia@example.com" },
    })
    fireEvent.click(screen.getByRole("button", { name: /Send inquiry/ }))

    await waitFor(() =>
      expect(submitInquiry).toHaveBeenCalledWith({
        data: {
          inquiry: expect.objectContaining({
            type: "general",
            context: "Could you review my architecture proposal?",
            name: "Nadia Ahmed",
            email: "nadia@example.com",
          }),
          website: "",
        },
      })
    )
    await waitFor(() => expect(screen.getByText("Query sent")).not.toBeNull())
    expect(screen.getByText("General inquiry")).not.toBeNull()
    expect(
      screen.getByText("Could you review my architecture proposal?")
    ).not.toBeNull()
  })

  it("blocks offensive language before advancing a general query", async () => {
    render(<PortfolioAssistant />)
    fireEvent.click(screen.getByRole("button", { name: "Ask about Montasim" }))
    fireEvent.click(screen.getByRole("button", { name: "Something else" }))
    fireEvent.change(screen.getByLabelText("Your query"), {
      target: { value: "You are a fucking idiot." },
    })
    fireEvent.click(screen.getByRole("button", { name: /Continue/ }))

    await waitFor(() =>
      expect(
        screen.getByText(
          "Please revise this field. Offensive or abusive language is not allowed."
        )
      ).not.toBeNull()
    )
    expect(screen.getByText("Question 1 of 3")).not.toBeNull()
    expect(submitInquiry).not.toHaveBeenCalled()
  })

  it("blocks a temporary email before submitting a general query", async () => {
    verifyVisitorEmail.mockRejectedValueOnce(new Error(TEMPORARY_EMAIL_ERROR))
    render(<PortfolioAssistant />)
    fireEvent.click(screen.getByRole("button", { name: "Ask about Montasim" }))
    fireEvent.click(screen.getByRole("button", { name: "Something else" }))
    fireEvent.change(screen.getByLabelText("Your query"), {
      target: { value: "Could we discuss an engineering question?" },
    })
    fireEvent.click(screen.getByRole("button", { name: /Continue/ }))
    await waitFor(() =>
      expect(screen.getByText("Who should Montasim reply to?")).not.toBeNull()
    )
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Nadia Ahmed" },
    })
    fireEvent.click(screen.getByRole("button", { name: /Continue/ }))
    await waitFor(() => expect(screen.getByLabelText("Email")).not.toBeNull())
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "nadia@temporary.example" },
    })
    fireEvent.click(screen.getByRole("button", { name: /Send inquiry/ }))

    await waitFor(() =>
      expect(screen.getByText(TEMPORARY_EMAIL_ERROR)).not.toBeNull()
    )
    expect(submitInquiry).not.toHaveBeenCalled()
  })

  it("matches the prototype through a successful role inquiry", async () => {
    let resolveSubmission!: (value: { delivered: true }) => void
    submitInquiry.mockImplementationOnce(
      () =>
        new Promise<{ delivered: true }>((resolve) => {
          resolveSubmission = resolve
        })
    )
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
      screen
        .getByRole("button", { name: "Review earlier answers" })
        .getAttribute("aria-expanded")
    ).toBe("false")

    fireEvent.click(screen.getByRole("button", { name: "Remote" }))
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Montasim Mamun" },
    })
    fireEvent.click(screen.getByRole("button", { name: /Continue/ }))
    await waitFor(() =>
      expect(screen.getByLabelText("Work email")).not.toBeNull()
    )
    fireEvent.change(screen.getByLabelText("Work email"), {
      target: { value: "mamun@yopmail.com" },
    })
    expect(
      screen
        .getByRole("button", { name: "Review earlier answers" })
        .getAttribute("aria-expanded")
    ).toBe("true")
    fireEvent.change(screen.getByLabelText(/Company or job link/), {
      target: { value: "https://example.com/jobs/senior-frontend" },
    })
    fireEvent.click(screen.getByRole("button", { name: /Send inquiry/ }))

    await waitFor(() =>
      expect(submitInquiry).toHaveBeenCalledWith({
        data: {
          inquiry: expect.objectContaining({
            id: expect.any(String),
            context: "https://example.com/jobs/senior-frontend",
            role: "Senior Frontend Engineer",
          }),
          website: "",
        },
      })
    )

    expect(screen.getByText("Sending inquiry")).not.toBeNull()
    expect(
      screen.getByText("Please keep this window open for a moment.")
    ).not.toBeNull()

    resolveSubmission({ delivered: true })
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
    await waitFor(() => expect(screen.getByLabelText("Email")).not.toBeNull())
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
