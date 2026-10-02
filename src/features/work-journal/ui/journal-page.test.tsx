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

vi.mock("@tanstack/react-router", () => ({ useBlocker: vi.fn() }))
vi.mock("../application/journal", () => ({
  getJournalHistory: vi.fn(async () => ({
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
  fireEvent.click(nav.getByRole("button", { name: "History" }))
  expect(
    await screen.findByText(
      "No entries match this view. Record your day or change the filters."
    )
  ).toBeTruthy()
  fireEvent.click(nav.getByRole("button", { name: "Reviews" }))
  expect(
    await screen.findByRole("heading", { name: "Prepare a review" })
  ).toBeTruthy()
  fireEvent.click(nav.getByRole("button", { name: "Companies & projects" }))
  expect(await screen.findByRole("heading", { name: "Companies" })).toBeTruthy()
  fireEvent.click(nav.getByRole("button", { name: "Today" }))
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
  fireEvent.click(nav.getByRole("button", { name: "History" }))
  let dialog = within(
    screen.getByRole("dialog", { name: "Discard unsaved changes?" })
  )
  fireEvent.click(dialog.getByRole("button", { name: "Keep editing" }))
  expect(
    screen.getByLabelText<HTMLTextAreaElement>("Original notes").value
  ).toBe("Investigated retries")
  fireEvent.click(nav.getByRole("button", { name: "History" }))
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
  fireEvent.click(screen.getByRole("button", { name: "Today" }))
  expect(
    screen.getByLabelText<HTMLTextAreaElement>("Original notes").value
  ).toBe("Keep this draft")
  expect(confirm).not.toHaveBeenCalled()
})
