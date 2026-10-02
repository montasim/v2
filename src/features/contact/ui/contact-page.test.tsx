// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ContactPage } from "./contact-page"

import { TEMPORARY_EMAIL_ERROR } from "@/features/email-verification/domain/email-verification"
import { INQUIRY_MODERATION_ERROR } from "@/features/chat/domain/inquiry-moderation"

const { submit, verifyEmail } = vi.hoisted(() => ({
  submit: vi.fn(),
  verifyEmail: vi.fn(),
}))
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }))
vi.mock(
  "@/features/email-verification/application/verify-visitor-email",
  () => ({
    verifyVisitorEmail: verifyEmail,
  })
)
vi.mock("@/features/chat/application/submit-inquiry", () => ({
  submitInquiry: submit,
}))
vi.mock("@/features/chat/ui/portfolio-assistant", () => ({
  PortfolioAssistant: () => <button type="button">Ask about Montasim</button>,
}))
const initial = {
  topic: "general" as const,
  projectId: "",
  unknownApp: false,
  related: undefined,
  projects: [
    {
      id: "project-example",
      title: "Example app",
      description: "A useful example app.",
      iconUrl: undefined,
      type: "extension" as const,
      releaseUrl: undefined,
      href: "/projects/example",
      microsoftStoreUrl: undefined,
      snapcraftUrl: undefined,
      chromeWebStoreUrl: "https://chromewebstore.google.com/example",
      npmUrl: undefined,
      links: [],
    },
  ],
}
beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  )
  submit.mockReset()
  verifyEmail.mockReset().mockResolvedValue({ accepted: true })
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: vi.fn(),
  })
  vi.stubGlobal("requestAnimationFrame", (callback: () => void) => {
    callback()
    return 0
  })
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})
function fillMessage() {
  fireEvent.change(screen.getByLabelText("Your email"), {
    target: { value: "person@example.com" },
  })
  fireEvent.change(screen.getByLabelText("Your message"), {
    target: { value: "A question about your experience." },
  })
}
describe("ContactPage", () => {
  it("shows the selected product's available links", () => {
    render(
      <ContactPage
        initial={{ ...initial, topic: "support", projectId: "project-example" }}
      />
    )
    expect(
      screen
        .getByRole("link", {
          name: "Get Example app from the Chrome Web Store",
        })
        .getAttribute("href")
    ).toBe("https://chromewebstore.google.com/example")
    expect(
      screen.getByRole("link", { name: "View product" }).getAttribute("href")
    ).toBe("/projects/example")
    expect(
      screen
        .getByRole("img", { name: "Get Example app from the Chrome Web Store" })
        .getAttribute("src")
    ).toBe("/images/store-badges/chrome-web-store.png")
    expect(screen.queryByRole("link", { name: "App Store" })).toBeNull()
  })

  it("sends directly, prevents duplicate clicks, and confirms durable acceptance without chat", async () => {
    let finish!: (value: { delivered: true }) => void
    submit.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve
        })
    )
    const chatEvent = vi.fn()
    window.addEventListener("portfolio:assistant-inquiry", chatEvent)
    render(<ContactPage initial={initial} />)
    fillMessage()
    fireEvent.click(screen.getByRole("button", { name: "Send message" }))
    fireEvent.submit(
      screen.getByRole("button", { name: "Sending…" }).closest("form")!
    )
    await waitFor(() => expect(submit).toHaveBeenCalledTimes(1))
    expect(submit.mock.calls[0][0].data.inquiry).toMatchObject({
      type: "contact",
      topic: "general",
      name: undefined,
    })
    await act(async () => finish({ delivered: true }))
    expect(
      screen.getByRole("heading", { name: "Your message is saved." })
    ).toBeTruthy()
    expect(chatEvent).not.toHaveBeenCalled()
    fireEvent.click(
      screen.getByRole("button", { name: "Send another message" })
    )
    expect(
      screen.getByLabelText("Your message").getAttribute("value")
    ).toBeNull()
    expect(chatEvent).not.toHaveBeenCalled()
    window.removeEventListener("portfolio:assistant-inquiry", chatEvent)
  })
  it("retains input and id on unchanged retries, but changes id after editing", async () => {
    submit.mockRejectedValue(new Error("Temporarily unavailable"))
    render(<ContactPage initial={initial} />)
    fillMessage()
    fireEvent.click(screen.getByRole("button", { name: "Send message" }))
    await screen.findByRole("alert")
    const firstId = submit.mock.calls[0][0].data.inquiry.id
    fireEvent.click(screen.getByRole("button", { name: "Try sending again" }))
    await waitFor(() => expect(submit).toHaveBeenCalledTimes(2))
    await screen.findByRole("alert")
    expect(submit.mock.calls[1][0].data.inquiry.id).toBe(firstId)
    fireEvent.change(screen.getByLabelText("Your message"), {
      target: { value: "An updated question about your experience." },
    })
    fireEvent.click(screen.getByRole("button", { name: "Try sending again" }))
    await waitFor(() => expect(submit).toHaveBeenCalledTimes(3))
    expect(submit.mock.calls[2][0].data.inquiry.id).not.toBe(firstId)
  })
  it("shows app context and drops support-only fields after changing topics", async () => {
    submit.mockResolvedValue({ delivered: true })
    render(
      <ContactPage
        initial={{
          ...initial,
          topic: "support",
          projectId: "project-example",
          related: { path: "/experience", title: "Experience" },
        }}
      />
    )
    expect(
      screen.getByRole("heading", { name: "Contact Example app support" })
    ).toBeTruthy()
    fireEvent.change(screen.getByLabelText("Device or platform (optional)"), {
      target: { value: "Android" },
    })
    fireEvent.keyDown(
      screen.getByRole("combobox", { name: "What would you like to discuss?" }),
      { key: "ArrowDown" }
    )
    fireEvent.click(
      await screen.findByRole("option", { name: "Suggestion or feedback" })
    )
    fireEvent.click(screen.getByRole("button", { name: "Remove" }))
    fillMessage()
    fireEvent.click(screen.getByRole("button", { name: "Send message" }))
    await screen.findByRole("heading", { name: "Your message is saved." })
    expect(submit.mock.calls[0][0].data.inquiry).toMatchObject({
      topic: "feedback",
      platform: undefined,
      relatedPath: undefined,
    })
  })
  it.each([
    "Your message",
    "Your name (optional)",
    "Device or platform (optional)",
    "App version (optional)",
  ])("blocks offensive language in %s before submission", async (label) => {
    render(
      <ContactPage
        initial={{ ...initial, topic: "support", projectId: "project-example" }}
      />
    )
    fillMessage()
    fireEvent.change(screen.getByLabelText(label), {
      target: { value: "You are a fucking idiot." },
    })
    fireEvent.click(screen.getByRole("button", { name: "Send message" }))
    expect(await screen.findByText(INQUIRY_MODERATION_ERROR)).toBeTruthy()
    expect(screen.getByLabelText(label).getAttribute("aria-invalid")).toBe(
      "true"
    )
    expect(document.activeElement).toBe(screen.getByLabelText(label))
    expect(submit).not.toHaveBeenCalled()
    expect(verifyEmail).not.toHaveBeenCalled()
    fireEvent.change(screen.getByLabelText(label), {
      target: {
        value:
          label === "Your message"
            ? "A constructive question about your work."
            : "Nadia",
      },
    })
    submit.mockResolvedValue({ delivered: true })
    fireEvent.click(screen.getByRole("button", { name: "Send message" }))
    await screen.findByRole("heading", { name: "Your message is saved." })
  })
  it("shows temporary-email errors at the email field and allows correction", async () => {
    verifyEmail.mockRejectedValueOnce(new Error(TEMPORARY_EMAIL_ERROR))
    render(<ContactPage initial={initial} />)
    fillMessage()
    fireEvent.change(screen.getByLabelText("Your email"), {
      target: { value: "person@temporary.example" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Send message" }))
    expect(await screen.findByText(TEMPORARY_EMAIL_ERROR)).toBeTruthy()
    expect(
      screen.getByLabelText("Your email").getAttribute("aria-invalid")
    ).toBe("true")
    expect(submit).not.toHaveBeenCalled()
    expect(
      screen.getByLabelText<HTMLTextAreaElement>("Your message").value
    ).toBe("A question about your experience.")
    fireEvent.change(screen.getByLabelText("Your email"), {
      target: { value: "person@example.com" },
    })
    submit.mockResolvedValue({ delivered: true })
    fireEvent.click(screen.getByRole("button", { name: "Send message" }))
    await screen.findByRole("heading", { name: "Your message is saved." })
    expect(verifyEmail).toHaveBeenLastCalledWith({ data: "person@example.com" })
  })
  it("adapts support to hiring without losing the message or submitting hidden context", async () => {
    submit.mockResolvedValue({ delivered: true })
    render(
      <ContactPage
        initial={{ ...initial, topic: "support", projectId: "project-example" }}
      />
    )
    expect(
      screen.getByRole("heading", { name: "Contact Example app support" })
    ).toBeTruthy()
    expect(screen.queryByText("A little about me")).toBeNull()
    expect(
      screen.queryByRole("button", { name: "Ask about Montasim" })
    ).toBeNull()
    expect(screen.getByRole("button", { name: "Change app" })).toBeTruthy()
    fillMessage()
    fireEvent.keyDown(
      screen.getByRole("combobox", { name: "What would you like to discuss?" }),
      { key: "ArrowDown" }
    )
    fireEvent.click(
      await screen.findByRole("option", { name: "Hiring or collaboration" })
    )
    expect(screen.getByText("A little about me")).toBeTruthy()
    expect(screen.getByRole("link", { name: /View my projects/ })).toBeTruthy()
    expect(
      screen.queryByRole("button", { name: "Ask about Montasim" })
    ).toBeNull()
    expect(screen.queryByRole("button", { name: "Change app" })).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: "Send message" }))
    await screen.findByRole("heading", { name: "Your message is saved." })
    expect(submit.mock.calls[0][0].data.inquiry).toMatchObject({
      topic: "collaboration",
      context: "A question about your experience.",
      projectId: undefined,
      platform: undefined,
    })
  })
  it("keeps general contact short and offers optional project context for feedback", async () => {
    render(<ContactPage initial={initial} />)
    expect(screen.queryByRole("combobox", { name: /Related app/ })).toBeNull()
    fireEvent.keyDown(
      screen.getByRole("combobox", { name: "What would you like to discuss?" }),
      { key: "ArrowDown" }
    )
    fireEvent.click(
      await screen.findByRole("option", { name: "Suggestion or feedback" })
    )
    fireEvent.click(
      screen.getByRole("button", { name: "Add an app or project (optional)" })
    )
    expect(screen.getByRole("combobox", { name: /Related app/ })).toBeTruthy()
  })
  it("synchronizes topic and app links without clearing the draft on route updates", async () => {
    const onSelectionChange = vi.fn()
    const view = render(
      <ContactPage initial={initial} onSelectionChange={onSelectionChange} />
    )
    fillMessage()
    fireEvent.keyDown(
      screen.getByRole("combobox", { name: "What would you like to discuss?" }),
      { key: "ArrowDown" }
    )
    fireEvent.click(
      await screen.findByRole("option", { name: "App or project support" })
    )
    expect(onSelectionChange).toHaveBeenLastCalledWith({
      topic: "support",
      app: undefined,
      from: undefined,
    })
    fireEvent.keyDown(
      screen.getByRole("combobox", { name: "Which app or project?" }),
      { key: "ArrowDown" }
    )
    fireEvent.click(await screen.findByRole("option", { name: "Example app" }))
    expect(onSelectionChange).toHaveBeenLastCalledWith({
      topic: "support",
      app: "example",
      from: undefined,
    })
    view.rerender(
      <ContactPage
        initial={{ ...initial, topic: "support", projectId: "project-example" }}
        onSelectionChange={onSelectionChange}
      />
    )
    expect(
      screen.getByLabelText<HTMLTextAreaElement>("Your message").value
    ).toBe("A question about your experience.")
    expect(screen.getByLabelText<HTMLInputElement>("Your email").value).toBe(
      "person@example.com"
    )
    fireEvent.keyDown(
      screen.getByRole("combobox", { name: "What would you like to discuss?" }),
      { key: "ArrowDown" }
    )
    fireEvent.click(
      await screen.findByRole("option", { name: "General conversation" })
    )
    expect(onSelectionChange).toHaveBeenLastCalledWith({
      topic: "general",
      app: undefined,
      from: undefined,
    })
  })
  it("keeps invalid app links usable and validates required fields before sending", () => {
    render(
      <ContactPage
        initial={{ ...initial, topic: "support", unknownApp: true }}
      />
    )
    expect(screen.getByText(/app in this link wasn’t found/)).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Send message" }))
    expect(submit).not.toHaveBeenCalled()
    expect(
      screen.getByLabelText("Your email").getAttribute("aria-invalid")
    ).toBe("true")
  })
})
