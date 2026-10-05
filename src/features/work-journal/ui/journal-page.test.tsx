// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"
import {
  createBrowserHistory,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Link,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router"
import { JournalPage } from "./journal-page"
import { NewEntryPage } from "./new-entry-page"
import { todayIn } from "../domain/journal"
import type { Setup } from "./journal-page"

const records = vi.hoisted(() => ({
  history: vi.fn(),
  entry: vi.fn(),
  save: vi.fn(),
}))

vi.mock("../application/journal", () => ({
  getJournalEntry: records.entry,
  saveJournalEntry: records.save,
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
const browserHistories: ReturnType<typeof createBrowserHistory>[] = []
async function renderJournal(
  initial = setup,
  path = "/dashboard/work-journal",
  useBrowserHistory = false
) {
  vi.spyOn(window, "scrollTo").mockImplementation(() => {})
  if (useBrowserHistory) window.history.replaceState(null, "", path)
  const history = useBrowserHistory
    ? createBrowserHistory()
    : createMemoryHistory({ initialEntries: [path] })
  if (useBrowserHistory) browserHistories.push(history)
  const root = createRootRoute({
    component: () => (
      <>
        <Link to="/dashboard">Dashboard overview</Link>
        <Outlet />
      </>
    ),
  })
  const journal = createRoute({
    getParentRoute: () => root,
    path: "/dashboard/work-journal",
    component: () => <JournalPage initial={initial} />,
  })
  const newEntry = createRoute({
    getParentRoute: () => root,
    path: "/dashboard/work-journal/new",
    component: () => <NewEntryPage initial={initial} />,
  })
  const overview = createRoute({
    getParentRoute: () => root,
    path: "/dashboard",
    component: () => <h2>Overview</h2>,
  })
  const router = createRouter({
    routeTree: root.addChildren([journal, newEntry, overview]),
    history,
    defaultPendingMinMs: 0,
  })
  render(<RouterProvider router={router} />)
  await screen.findByRole("heading", {
    name: path.endsWith("/new")
      ? "New journal"
      : path.includes("tab=reviews")
        ? "Prepare a review"
        : path.includes("tab=manage")
          ? "Companies"
          : "Your contribution history",
  })
  return router
}
afterEach(() => {
  cleanup()
  browserHistories.splice(0).forEach((history) => history.destroy())
  vi.restoreAllMocks()
  vi.clearAllMocks()
})
it("starts on History, opens the remaining tabs, and navigates to New journal without prompting for unchanged forms", async () => {
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false)
  const router = await renderJournal()
  const nav = within(
    screen.getByRole("navigation", { name: "Work journal views" })
  )
  expect(
    nav.getByRole("tab", { name: "History" }).getAttribute("aria-selected")
  ).toBe("true")
  expect(nav.getAllByRole("tab")).toHaveLength(3)
  expect(nav.queryByRole("tab", { name: "Today" })).toBeNull()
  expect(nav.queryByRole("link", { name: "New journal" })).toBeNull()
  expect(await screen.findByText("No entries match this view")).toBeTruthy()
  fireEvent.click(nav.getByRole("tab", { name: "Reviews" }))
  expect(
    await screen.findByRole("heading", { name: "Prepare a review" })
  ).toBeTruthy()
  fireEvent.click(nav.getByRole("tab", { name: "Companies & projects" }))
  expect(await screen.findByRole("heading", { name: "Companies" })).toBeTruthy()
  fireEvent.click(screen.getByRole("link", { name: "New journal" }))
  expect(await screen.findByLabelText("Original notes")).toBeTruthy()
  expect(router.state.location.pathname).toBe("/dashboard/work-journal/new")
  expect(screen.queryByRole("tablist")).toBeNull()
  fireEvent.click(screen.getByRole("link", { name: "Back to Work Journal" }))
  await screen.findByText("No entries match this view")
  expect(confirm).not.toHaveBeenCalled()
})

it("shows an in-page choice for unsaved edits, preserves them on cancel, and switches on discard", async () => {
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false)
  const router = await renderJournal()
  const nav = within(
    screen.getByRole("navigation", { name: "Work journal views" })
  )
  fireEvent.click(nav.getByRole("tab", { name: "Companies & projects" }))
  fireEvent.change(screen.getByLabelText("Company name"), {
    target: { value: "New company draft" },
  })
  await waitFor(() =>
    expect(router.state.location.search).toMatchObject({ tab: "manage" })
  )
  fireEvent.click(nav.getByRole("tab", { name: "History" }))
  let dialog = within(
    screen.getByRole("dialog", { name: "Discard unsaved changes?" })
  )
  fireEvent.click(dialog.getByRole("button", { name: "Keep editing" }))
  expect(router.state.location.search).toMatchObject({ tab: "manage" })
  expect(screen.getByLabelText<HTMLInputElement>("Company name").value).toBe(
    "New company draft"
  )
  fireEvent.click(nav.getByRole("tab", { name: "History" }))
  dialog = within(
    screen.getByRole("dialog", { name: "Discard unsaved changes?" })
  )
  fireEvent.click(dialog.getByRole("button", { name: "Discard and switch" }))
  expect(
    await screen.findByRole("heading", { name: "Your contribution history" })
  ).toBeTruthy()
  await waitFor(() =>
    expect(router.state.location.search).toMatchObject({ tab: "history" })
  )
  expect(confirm).not.toHaveBeenCalled()
})

it("does not reset or prompt when clicking the current tab", async () => {
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(true)
  await renderJournal()
  fireEvent.click(screen.getByRole("tab", { name: "Companies & projects" }))
  fireEvent.change(screen.getByLabelText("Company name"), {
    target: { value: "Keep this draft" },
  })
  fireEvent.click(screen.getByRole("tab", { name: "Companies & projects" }))
  expect(screen.getByLabelText<HTMLInputElement>("Company name").value).toBe(
    "Keep this draft"
  )
  expect(confirm).not.toHaveBeenCalled()
})

it("supports keyboard tab navigation without switching until activated", async () => {
  await renderJournal()
  const history = screen.getByRole("tab", { name: "History" })
  const reviews = screen.getByRole("tab", { name: "Reviews" })
  const manage = screen.getByRole("tab", { name: "Companies & projects" })
  history.focus()
  fireEvent.keyDown(history, { key: "ArrowRight" })
  expect(document.activeElement).toBe(reviews)
  expect(history.getAttribute("aria-selected")).toBe("true")
  fireEvent.keyDown(reviews, { key: "End" })
  expect(document.activeElement).toBe(manage)
  fireEvent.keyDown(manage, { key: "ArrowRight" })
  expect(document.activeElement).toBe(history)
  fireEvent.keyDown(history, { key: "ArrowLeft" })
  expect(document.activeElement).toBe(manage)
  fireEvent.keyDown(manage, { key: "Home" })
  expect(document.activeElement).toBe(history)
  fireEvent.click(reviews)
  expect(reviews.getAttribute("aria-selected")).toBe("true")
  expect(screen.getByRole("tabpanel").getAttribute("aria-labelledby")).toBe(
    reviews.id
  )
  await screen.findByRole("heading", { name: "Prepare a review" })
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
    companyName,
    projectName,
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
  await renderJournal({
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
  })
  const history = screen.getByRole("tab", { name: "History" })
  fireEvent.click(history)
  const summary = (
    await screen.findByText("A complete task description", { selector: "span" })
  ).closest("summary")!
  fireEvent.click(summary)
  expect(summary.closest("details")?.open).toBe(true)
  expect(screen.getByText(companyName)).toBeTruthy()
  expect(summary.textContent).toContain(projectName)
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
  await screen.findByText("No entries match this view")
})

it("loads the complete new-entry form directly with today's editable work date", async () => {
  await renderJournal(setup, "/dashboard/work-journal/new")
  const date = screen.getByLabelText<HTMLInputElement>("Work date")
  expect(date.value).toBe(todayIn(setup.settings.timezone))
  fireEvent.change(date, { target: { value: "2026-09-30" } })
  expect(date.value).toBe("2026-09-30")
  for (const label of [
    "Original notes",
    "Task 1",
    "Private reflection",
    "Daily summary",
  ]) {
    expect(screen.getByLabelText(label)).toBeTruthy()
  }
  expect(screen.queryByRole("tablist")).toBeNull()
  expect(
    screen.getByRole("button", { name: "Save entry" }).hasAttribute("disabled")
  ).toBe(true)
  expect(
    screen
      .getByRole("button", { name: "Generate daily draft" })
      .hasAttribute("disabled")
  ).toBe(true)
  expect(
    screen.getByText(/Open Companies & projects in Work Journal/)
  ).toBeTruthy()
})

it.each(["back link", "sidebar", "browser Back"])(
  "protects unsaved new entries through %s and preserves canceled edits",
  async (exit) => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false)
    const router = await renderJournal(
      setup,
      "/dashboard/work-journal",
      exit === "browser Back"
    )
    fireEvent.click(screen.getByRole("link", { name: "New journal" }))
    const notes =
      await screen.findByLabelText<HTMLTextAreaElement>("Original notes")
    fireEvent.change(notes, { target: { value: "Unsaved work" } })
    const leave = async () => {
      if (exit === "browser Back")
        await act(async () => {
          router.history.back()
        })
      else
        fireEvent.click(
          screen.getByRole("link", {
            name:
              exit === "sidebar"
                ? "Dashboard overview"
                : "Back to Work Journal",
          })
        )
    }
    await leave()
    await waitFor(() => expect(confirm).toHaveBeenCalledOnce())
    expect(router.state.location.pathname).toBe("/dashboard/work-journal/new")
    expect(notes.value).toBe("Unsaved work")
    confirm.mockReturnValue(true)
    await leave()
    await screen.findByRole("heading", {
      name: exit === "sidebar" ? "Overview" : "Your contribution history",
    })
  }
)

it("protects unsaved company edits when following New journal", async () => {
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false)
  await renderJournal()
  fireEvent.click(screen.getByRole("tab", { name: "Companies & projects" }))
  fireEvent.change(screen.getByLabelText("Company name"), {
    target: { value: "Company draft" },
  })
  fireEvent.click(screen.getByRole("link", { name: "New journal" }))
  await waitFor(() => expect(confirm).toHaveBeenCalledOnce())
  expect(screen.getByLabelText<HTMLInputElement>("Company name").value).toBe(
    "Company draft"
  )
  confirm.mockReturnValue(true)
  fireEvent.click(screen.getByRole("link", { name: "New journal" }))
  await screen.findByLabelText("Original notes")
})

it("requests browser unload confirmation only while the new entry is dirty", async () => {
  await renderJournal(setup, "/dashboard/work-journal/new", true)
  const unload = () => {
    const event = new Event("beforeunload", { cancelable: true })
    window.dispatchEvent(event)
    return event.defaultPrevented
  }
  expect(unload()).toBe(false)
  const notes = screen.getByLabelText("Original notes")
  fireEvent.change(notes, { target: { value: "Unsaved work" } })
  expect(unload()).toBe(true)
  fireEvent.change(notes, { target: { value: "" } })
  expect(unload()).toBe(false)
})

it("keeps failed saves editable, updates the same entry on repeat saves, and refreshes History on return", async () => {
  const companyId = "11111111-1111-4111-8111-111111111111"
  const initial: Setup = {
    ...setup,
    defaultCompanyId: companyId,
    companies: [
      {
        id: companyId,
        revision: 1,
        name: "Company A",
        role: "",
        startDate: null,
        endDate: null,
        archived: false,
      },
    ],
  }
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false)
  records.save.mockRejectedValueOnce(new Error("Temporary save failure"))
  records.save.mockImplementation(async ({ data }) => ({
    ...data,
    revision: data.revision + 1,
    sourceHash: "hash",
    draft: null,
    draftSourceHash: null,
  }))
  const router = await renderJournal(initial)
  fireEvent.click(screen.getByRole("link", { name: "New journal" }))
  const task = await screen.findByLabelText<HTMLTextAreaElement>("Task 1")
  fireEvent.change(task, { target: { value: "Saved via New journal" } })
  fireEvent.click(screen.getByRole("button", { name: "Save entry" }))
  await screen.findByText("Temporary save failure")
  expect(task.value).toBe("Saved via New journal")
  fireEvent.click(screen.getByRole("button", { name: "Save entry" }))
  await screen.findByText("Entry saved.")
  expect(router.state.location.pathname).toBe("/dashboard/work-journal/new")
  const firstSave = records.save.mock.calls[1][0].data
  fireEvent.change(screen.getByLabelText("Daily summary"), {
    target: { value: "Accepted summary" },
  })
  fireEvent.click(screen.getByRole("button", { name: "Save entry" }))
  await waitFor(() => expect(records.save).toHaveBeenCalledTimes(3))
  await waitFor(() =>
    expect(
      screen
        .getByRole("button", { name: "Save entry" })
        .hasAttribute("disabled")
    ).toBe(false)
  )
  expect(records.save.mock.calls[2][0].data).toMatchObject({
    id: firstSave.id,
    revision: 1,
    summary: "Accepted summary",
  })
  records.history.mockResolvedValueOnce({
    items: [{ ...firstSave, companyName: "Company A", projectName: null }],
    page: 1,
    pageCount: 1,
    total: 1,
  })
  fireEvent.click(screen.getByRole("link", { name: "Back to Work Journal" }))
  await screen.findByText("Saved via New journal", { selector: "span" })
  expect(confirm).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole("link", { name: "New journal" }))
  expect(
    (await screen.findByLabelText<HTMLTextAreaElement>("Task 1")).value
  ).toBe("")
})

it.each([
  ["history", "History"],
  ["reviews", "Reviews"],
  ["manage", "Companies & projects"],
])("opens the tab from a direct %s URL", async (tab, label) => {
  await renderJournal(setup, `/dashboard/work-journal?tab=${tab}`)
  expect(
    screen.getByRole("tab", { name: label }).getAttribute("aria-selected")
  ).toBe("true")
})

it("writes the current tab to the URL and restores it with Back and Forward", async () => {
  const router = await renderJournal()
  await waitFor(() =>
    expect(router.state.location.search).toMatchObject({ tab: "history" })
  )
  fireEvent.click(screen.getByRole("tab", { name: "Reviews" }))
  await waitFor(() =>
    expect(router.state.location.search).toMatchObject({ tab: "reviews" })
  )
  fireEvent.click(screen.getByRole("tab", { name: "Companies & projects" }))
  await waitFor(() =>
    expect(router.state.location.search).toMatchObject({ tab: "manage" })
  )
  await act(async () => {
    router.history.back()
  })
  await screen.findByRole("heading", { name: "Prepare a review" })
  expect(router.state.location.search).toMatchObject({ tab: "reviews" })
  await act(async () => {
    router.history.forward()
  })
  await screen.findByRole("heading", { name: "Companies" })
  expect(router.state.location.search).toMatchObject({ tab: "manage" })
})
