// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { EntryEditor } from "./entry-editor"
import type { Setup } from "./journal-page"

const mocks = vi.hoisted(() => ({
  save: vi.fn(),
  generate: vi.fn(),
  addProject: vi.fn(),
}))
vi.mock("@tanstack/react-router", () => ({ useBlocker: vi.fn() }))
vi.mock("../application/journal", () => ({
  addJournalPortfolioProject: mocks.addProject,
  saveJournalEntry: mocks.save,
  generateJournalEntry: mocks.generate,
  getJournalEntry: vi.fn(),
}))
const setup: Setup = {
  companies: [
    {
      id: "11111111-1111-4111-8111-111111111111",
      revision: 1,
      name: "Company A",
      role: "Engineer",
      startDate: null,
      endDate: null,
      archived: false,
    },
  ],
  defaultCompanyId: "11111111-1111-4111-8111-111111111111",
  portfolioProjects: [
    {
      id: "project-existing",
      title: "Existing portfolio app",
      description: "An existing project",
    },
  ],
  projects: [],
  settings: { timezone: "Asia/Dhaka", weekStartsOn: 1 },
  ai: { enabled: false, provider: null, model: null },
}
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})
describe("daily capture", () => {
  it("offers portfolio projects directly and links a selection to the chosen company", async () => {
    const refresh = vi.fn().mockResolvedValue(undefined)
    mocks.addProject.mockResolvedValue({
      id: "22222222-2222-4222-8222-222222222222",
      companyId: setup.defaultCompanyId,
      name: "Existing portfolio app",
      description: "An existing project",
      revision: 1,
      archived: false,
    })
    render(
      <EntryEditor setup={setup} onDirty={() => undefined} refresh={refresh} />
    )
    fireEvent.click(
      screen.getByRole("combobox", { name: /Project \(optional\)/ })
    )
    fireEvent.click(
      screen.getByRole("option", { name: "Existing portfolio app" })
    )
    await waitFor(() =>
      expect(mocks.addProject).toHaveBeenCalledWith({
        data: {
          companyId: setup.defaultCompanyId,
          portfolioProjectId: "project-existing",
        },
      })
    )
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce())
  })

  it("keeps original notes, creates tasks from bullets and saves without AI", async () => {
    mocks.save.mockImplementation(async ({ data }) => ({
      ...data,
      revision: 1,
      sourceHash: "hash",
      draft: null,
      draftSourceHash: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }))
    render(
      <EntryEditor
        setup={setup}
        onDirty={() => undefined}
        refresh={async () => undefined}
      />
    )
    fireEvent.change(screen.getByLabelText("Original notes"), {
      target: { value: "- Fixed retries\n- Reviewed a PR" },
    })
    fireEvent.click(
      screen.getByRole("button", { name: "Add note lines as tasks" })
    )
    expect(screen.getByLabelText("Task 1").getAttribute("maxlength")).toBe(
      "3000"
    )
    fireEvent.click(screen.getByRole("button", { name: "Save entry" }))
    await screen.findByText("Entry saved.")
    expect(mocks.save.mock.calls[0][0].data.notes).toBe(
      "- Fixed retries\n- Reviewed a PR"
    )
    expect(mocks.save.mock.calls[0][0].data.contributions).toHaveLength(2)
    expect(mocks.generate).not.toHaveBeenCalled()
  })
  it("keeps unsaved task text after a failed save", async () => {
    mocks.save.mockRejectedValue(new Error("Temporary database failure"))
    const onDirty = vi.fn()
    render(
      <EntryEditor
        setup={setup}
        onDirty={onDirty}
        refresh={async () => undefined}
      />
    )
    fireEvent.change(screen.getByLabelText("Task 1"), {
      target: { value: "Investigated timeout" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Save entry" }))
    await screen.findByText("Temporary database failure")
    expect(screen.getByLabelText<HTMLTextAreaElement>("Task 1").value).toBe(
      "Investigated timeout"
    )
    await waitFor(() => expect(onDirty).toHaveBeenLastCalledWith(true))
  })
})
