// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { ReactNode } from "react"
import type { OwnerDashboardData } from "@/features/owner-dashboard/infrastructure/dashboard.server"
import { Comments, Conversations, Inquiries } from "./dashboard-records"

const { remove } = vi.hoisted(() => ({ remove: vi.fn() }))
vi.mock("@tanstack/react-start", () => ({ useServerFn: () => remove }))
vi.mock("@/features/blog-comments/application/comments", () => ({
  deleteBlogComment: vi.fn(),
}))
vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    params,
  }: {
    children: ReactNode
    params: { slug: string }
  }) => <a href={`/blog/${params.slug}`}>{children}</a>,
}))
vi.mock("@/features/chat/ui/chat-markdown", () => ({
  ChatMarkdown: ({ source }: { source: string }) => <p>{source}</p>,
}))
vi.mock("@/lib/content/blog", () => ({
  blogCatalog: { find: () => ({ title: "Reliable interfaces" }) },
}))
afterEach(cleanup)
beforeEach(() => {
  remove.mockReset()
})

const createdAt = "2026-10-02T09:00:00.000Z"
const inquiry: OwnerDashboardData["inquiries"][number] = {
  id: "contact-1",
  type: "contact",
  name: "Reader",
  email: "reader@example.com",
  context: "The full message remains readable.",
  topic: "support",
  projectId: "app",
  projectTitle: "App",
  relatedPath: "/projects/app",
  relatedTitle: "App details",
  unlistedProject: null,
  platform: "Android",
  appVersion: "2.1",
  role: null,
  arrangement: null,
  projectType: null,
  timeline: null,
  visitorHash: null,
  emailHash: null,
  resendOwnerState: "sent",
  resendOwnerLastError: null,
  resendOwnerUpdatedAt: null,
  resendAcknowledgementState: "sent",
  resendAcknowledgementLastError: null,
  resendAcknowledgementUpdatedAt: null,
  sheetsState: "sent",
  sheetsLastError: null,
  sheetsUpdatedAt: null,
  createdAt,
}
const comment: OwnerDashboardData["comments"][number] = {
  id: "comment-1",
  postSlug: "reliable-interfaces",
  parentId: null,
  name: "Reader",
  email: "reader@example.com",
  message: "Helpful article",
  createdAt,
}
const conversation: OwnerDashboardData["conversations"][number] = {
  id: "exchange-1",
  conversationId: "conversation-1",
  clientMessageId: null,
  question: "How do you build reliable interfaces?",
  answer: "Full **answer** with evidence.",
  source: "portfolio",
  responseKind: "generated",
  contactAction: null,
  handoffReason: null,
  provider: "groq",
  model: "requested-model",
  servedModel: "served-model",
  usedFallback: true,
  fallbackDepth: 1,
  citations: null,
  evidenceIds: null,
  retrievalMetadata: null,
  providerAttempts: [
    {
      provider: "groq",
      requestedModel: "requested-model",
      servedModel: "served-model",
      outcome: "accepted",
    },
  ],
  validationStatus: "accepted",
  latencyMs: null,
  inputTokens: null,
  outputTokens: null,
  costUsd: null,
  policyVersion: null,
  corpusVersion: null,
  createdAt,
}

function expand(container: HTMLElement) {
  const disclosure = container.querySelector("details")!
  expect(disclosure.open).toBe(false)
  fireEvent.click(disclosure.querySelector("summary")!)
  expect(disclosure.open).toBe(true)
}

describe("compact dashboard records", () => {
  it("expands contact metadata and keeps the reply destination", () => {
    const { container } = render(<Inquiries data={[inquiry]} />)
    expand(container)
    expect(screen.getByRole("heading", { name: "Reader" })).not.toBeNull()
    expect(screen.getByText("Android")).not.toBeNull()
    expect(screen.getByText("2.1")).not.toBeNull()
    expect(screen.getByText("App details (/projects/app)")).not.toBeNull()
    expect(
      screen.getByText("The full message remains readable.")
    ).not.toBeNull()
    expect(
      screen.getByRole("link", { name: "Reply" }).getAttribute("href")
    ).toBe("mailto:reader@example.com")
  })

  it("expands the full exchange with requested, served and fallback provenance", async () => {
    const { container } = render(<Conversations data={[conversation]} />)
    expand(container)
    expect(await screen.findByText(conversation.answer)).not.toBeNull()
    expect(screen.getByText("Requested model: requested-model")).not.toBeNull()
    expect(screen.getByText("Served model: served-model")).not.toBeNull()
    expect(screen.getByText(/^Route: groq/)).not.toBeNull()
    expect(
      screen.getAllByText(/groq · served-model · fallback · portfolio/)
    ).toHaveLength(2)
  })

  it("requires confirmation, permits cancellation, and disables deletion while pending", async () => {
    let finish: (() => void) | undefined
    remove.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve
        })
    )
    const refresh = vi.fn().mockResolvedValue(undefined)
    const { container } = render(
      <Comments data={[comment]} refresh={refresh} />
    )
    expand(container)
    expect(
      screen
        .getByRole("link", { name: "Reliable interfaces" })
        .getAttribute("href")
    ).toBe("/blog/reliable-interfaces")
    fireEvent.click(
      screen.getByRole("button", { name: "Delete comment by Reader" })
    )
    expect(remove).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
    expect(remove).not.toHaveBeenCalled()
    fireEvent.click(
      screen.getByRole("button", { name: "Delete comment by Reader" })
    )
    fireEvent.click(screen.getByRole("button", { name: "Delete" }))
    expect(remove).toHaveBeenCalledWith({
      data: { id: "comment-1", postSlug: "reliable-interfaces" },
    })
    expect(
      screen.getByRole("button", { name: "Deleting…" }).hasAttribute("disabled")
    ).toBe(true)
    expect(refresh).not.toHaveBeenCalled()
    finish?.()
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce())
  })

  it("keeps the comment and offers retry if deletion fails", async () => {
    remove.mockRejectedValue(new Error("offline"))
    const refresh = vi.fn()
    const { container } = render(
      <Comments data={[comment]} refresh={refresh} />
    )
    expand(container)
    fireEvent.click(
      screen.getByRole("button", { name: "Delete comment by Reader" })
    )
    fireEvent.click(screen.getByRole("button", { name: "Delete" }))
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Try again"
    )
    expect(screen.getByText("Helpful article")).not.toBeNull()
    expect(
      screen.getByRole("button", { name: "Delete" }).hasAttribute("disabled")
    ).toBe(false)
    expect(refresh).not.toHaveBeenCalled()
  })
})
