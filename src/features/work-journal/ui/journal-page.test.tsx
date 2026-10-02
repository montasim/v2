// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"
import { JournalPage } from "./journal-page"
import type { Setup } from "./journal-page"

const records = vi.hoisted(() => ({ history: vi.fn(), entry: vi.fn() }))

vi.mock("@tanstack/react-router", () => ({ useBlocker: vi.fn() }))
vi.mock("../application/journal", () => ({
  getJournalEntry: records.entry,
  getJournalHistory: records.history.mockImplementation(async () => ({
    items: [],
    page: 1,
    pageCount: 1,
    total: 0,
  })),
  getJournalReviews: vi.fn(async () => ({
    items: [],
    page: 1,
    pageCount: 1,
    total: 0,
  })),
}))
const setup: Setup = {
  companies: [],
  projects: [],
  portfolioProjects: [],
  defaultCompanyId: "",
  settings: { timezone: "Asia/Dhaka", weekStartsOn: 1 },
  ai: { enabled: false, provider: null, model: null },
}
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})
it("opens every journal view and returns to today without prompting for unchanged forms", async () => {
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false)
  render(<JournalPage initial={setup} />)
  const nav = within(
    screen.getByRole("navigation", { name: "Work journal views" })
  )
  fireEvent.click(nav.getByRole("tab", { name: "History" }))
  expect(
    await screen.findByText(
      "No entries match this view. Record your day or change the filters."
    )
  ).toBeTruthy()
  fireEvent.click(nav.getByRole("tab", { name: "Reviews" }))
  expect(
    await screen.findByRole("heading", { name: "Prepare a review" })
  ).toBeTruthy()
  fireEvent.click(nav.getByRole("tab", { name: "Companies & projects" }))
  expect(await screen.findByRole("heading", { name: "Companies" })).toBeTruthy()
  fireEvent.click(nav.getByRole("tab", { name: "Today" }))
  expect(screen.getByLabelText("Original notes")).toBeTruthy()
  expect(confirm).not.toHaveBeenCalled()
})

it("shows an in-page choice for unsaved edits, preserves them on cancel, and switches on discard", async () => {
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false)
  render(<JournalPage initial={setup} />)
  const nav = within(
    screen.getByRole("navigation", { name: "Work journal views" })
  )
  fireEvent.change(screen.getByLabelText("Original notes"), {
    target: { value: "Investigated retries" },
  })
  fireEvent.click(nav.getByRole("tab", { name: "History" }))
  let dialog = within(
    screen.getByRole("dialog", { name: "Discard unsaved changes?" })
  )
  fireEvent.click(dialog.getByRole("button", { name: "Keep editing" }))
  expect(
    screen.getByLabelText<HTMLTextAreaElement>("Original notes").value
  ).toBe("Investigated retries")
  fireEvent.click(nav.getByRole("tab", { name: "History" }))
  dialog = within(
    screen.getByRole("dialog", { name: "Discard unsaved changes?" })
  )
  fireEvent.click(dialog.getByRole("button", { name: "Discard and switch" }))
  expect(
    await screen.findByRole("heading", { name: "Your contribution history" })
  ).toBeTruthy()
  expect(confirm).not.toHaveBeenCalled()
})

it("does not reset or prompt when clicking the current tab", () => {
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(true)
  render(<JournalPage initial={setup} />)
  fireEvent.change(screen.getByLabelText("Original notes"), {
    target: { value: "Keep this draft" },
  })
  fireEvent.click(screen.getByRole("tab", { name: "Today" }))
  expect(
    screen.getByLabelText<HTMLTextAreaElement>("Original notes").value
  ).toBe("Keep this draft")
  expect(confirm).not.toHaveBeenCalled()
})

it("supports keyboard tab navigation without switching until activated", async () => {
  render(<JournalPage initial={setup} />)
  const today = screen.getByRole("tab", { name: "Today" })
  const history = screen.getByRole("tab", { name: "History" })
  today.focus()
  fireEvent.keyDown(today, { key: "ArrowRight" })
  expect(document.activeElement).toBe(history)
  expect(today.getAttribute("aria-selected")).toBe("true")
  fireEvent.click(history)
  expect(history.getAttribute("aria-selected")).toBe("true")
  expect(screen.getByRole("tabpanel").getAttribute("aria-labelledby")).toBe(
    history.id
  )
  await screen.findByText(
    "No entries match this view. Record your day or change the filters."
  )
})

it("guards unsaved history entry edits when returning to the selected parent tab", async () => {
  const companyName =
    "A company with a long complete name that must remain available"
  const projectName =
    "A project with a long complete name that must remain available"
  const companyId = "11111111-1111-4111-8111-111111111111"
  const projectId = "22222222-2222-4222-8222-222222222222"
  const entry = {
    id: "33333333-3333-4333-8333-333333333333",
    revision: 1,
    workDate: "2026-10-02",
    companyId,
    projectId,
    notes: "Saved notes",
    reflection: "",
    summary: "",
    summarySourceHash: null,
    sourceHash: "source",
    draft: null,
    draftSourceHash: null,
    contributions: [
      {
        id: "44444444-4444-4444-8444-444444444444",
        description: "A complete task description",
        category: "delivery",
        status: "completed",
        contribution: "",
        outcome: "",
        workKey: "",
        evidence: [],
        updates: [],
      },
    ],
  }
  records.history.mockResolvedValueOnce({
    items: [entry],
    page: 1,
    pageCount: 1,
    total: 1,
  })
  records.entry.mockResolvedValueOnce(entry)
  render(
    <JournalPage
      initial={{
        ...setup,
        defaultCompanyId: companyId,
        companies: [
          {
            id: companyId,
            revision: 1,
            name: companyName,
            role: "",
            startDate: null,
            endDate: null,
            archived: false,
          },
        ],
        projects: [
          {
            id: projectId,
            revision: 1,
            companyId,
            name: projectName,
            description: "",
            archived: false,
          },
        ],
      }}
    />
  )
  const history = screen.getByRole("tab", { name: "History" })
  fireEvent.click(history)
  const summary = (
    await screen.findByText("A complete task description", { selector: "span" })
  ).closest("summary")!
  fireEvent.click(summary)
  expect(summary.closest("details")?.open).toBe(true)
  expect(
    screen.getAllByText(`${companyName} · ${projectName}`).length
  ).toBeGreaterThan(0)
  fireEvent.click(
    screen.getByRole("button", { name: "Open entry for 2026-10-02" })
  )
  const notes =
    await screen.findByLabelText<HTMLTextAreaElement>("Original notes")
  expect(history.getAttribute("aria-selected")).toBe("true")
  fireEvent.change(notes, { target: { value: "Keep the edited notes" } })
  fireEvent.click(history)
  const dialog = within(
    screen.getByRole("dialog", { name: "Discard unsaved changes?" })
  )
  fireEvent.click(dialog.getByRole("button", { name: "Keep editing" }))
  expect(notes.value).toBe("Keep the edited notes")
  fireEvent.click(history)
  fireEvent.click(screen.getByRole("button", { name: "Discard and switch" }))
  await screen.findByText(
    "No entries match this view. Record your day or change the filters."
  )
})
