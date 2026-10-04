// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  CaseStudySwitcher,
  ProjectSwitcher,
  caseStudySwitcherOptions,
  projectSwitcherOptions,
} from "@/components/portfolio/project-switcher"
import { projectCaseStudyCatalog } from "@/lib/content/project-case-studies"
import { projectCatalog } from "@/lib/content/projects"

const navigate = vi.hoisted(() => vi.fn())

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
}))

const current = projectCatalog.findBySlug("postcraft")!

function openSwitcher() {
  render(<ProjectSwitcher current={current} label={current.title} />)
  fireEvent.click(screen.getByRole("button", { name: /PostCraft/ }))
}

describe("ProjectSwitcher", () => {
  beforeEach(() => {
    navigate.mockClear()
    // cmdk and Radix popper rely on these browser APIs, missing in jsdom.
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
    })
    Object.defineProperty(window, "ResizeObserver", {
      configurable: true,
      value: class MockResizeObserver {
        observe = vi.fn()
        unobserve = vi.fn()
        disconnect = vi.fn()
      },
    })
  })

  afterEach(cleanup)

  it("lists only projects that have a detail page, with route slugs", () => {
    expect(projectSwitcherOptions.length).toBeGreaterThan(1)
    for (const option of projectSwitcherOptions) {
      const project = projectCatalog.findBySlug(option.value)
      expect(project?.title).toBe(option.title)
      expect(projectCaseStudyCatalog.findByProjectId(project!.id)).toBeDefined()
    }
  })

  it("opens a searchable list with the current project marked", () => {
    openSwitcher()

    expect(
      screen
        .getByRole("button", { name: /PostCraft/ })
        .getAttribute("aria-current")
    ).toBe("page")
    const search = screen.getByPlaceholderText("Find a project…")
    expect(document.activeElement).toBe(search)
    expect(
      screen.getByRole("option", { name: /PostCraft/ }).dataset.current
    ).toBe("true")
    expect(screen.getAllByRole("option")).toHaveLength(
      projectSwitcherOptions.length
    )
  })

  it("filters projects as you type", () => {
    openSwitcher()

    fireEvent.change(screen.getByPlaceholderText("Find a project…"), {
      target: { value: "bugrec" },
    })

    expect(screen.getByRole("option", { name: /BugReceipt/ })).toBeTruthy()
    expect(screen.queryByRole("option", { name: /PostCraft/ })).toBeNull()
  })

  it("shows an empty state when nothing matches", () => {
    openSwitcher()

    fireEvent.change(screen.getByPlaceholderText("Find a project…"), {
      target: { value: "zzzz-no-project" },
    })

    expect(screen.getByText("No projects found.")).toBeTruthy()
  })

  it("navigates to the chosen project's page", () => {
    openSwitcher()

    fireEvent.click(screen.getByRole("option", { name: /BugReceipt/ }))

    expect(navigate).toHaveBeenCalledWith({
      to: "/projects/$slug",
      params: { slug: "bugreceipt" },
    })
  })

  it("does not navigate when the current project is chosen", () => {
    openSwitcher()

    fireEvent.click(screen.getByRole("option", { name: /PostCraft/ }))

    expect(navigate).not.toHaveBeenCalled()
  })

  it("switches between case studies", () => {
    const caseStudy = projectCaseStudyCatalog.findBySlug("postcraft")!
    const target = caseStudySwitcherOptions.find(
      (option) => option.value !== caseStudy.slug
    )!
    render(
      <CaseStudySwitcher
        current={caseStudy}
        label={`${caseStudy.project.title} case study`}
      />
    )
    fireEvent.click(
      screen.getByRole("button", { name: /PostCraft case study/ })
    )

    expect(screen.getAllByRole("option")).toHaveLength(
      projectCaseStudyCatalog.records.length
    )
    fireEvent.click(
      screen.getByRole("option", { name: new RegExp(target.title) })
    )

    expect(navigate).toHaveBeenCalledWith({
      to: "/case-studies/$slug",
      params: { slug: target.value },
    })
  })
})
