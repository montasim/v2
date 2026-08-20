// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { AppContextMenu } from "@/components/shared/app-context-menu"

const navigate = vi.hoisted(() => vi.fn())
const toggleTheme = vi.hoisted(() => vi.fn())

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
}))

vi.mock("@/components/theme-provider", () => ({
  useTheme: () => ({ theme: "light", toggleTheme }),
}))

describe("AppContextMenu", () => {
  beforeEach(() => {
    navigate.mockClear()
    vi.spyOn(window, "open").mockImplementation(() => null)
  })
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it("shows the v1 portfolio actions on right click", () => {
    render(
      <AppContextMenu>
        <main>Portfolio content</main>
      </AppContextMenu>
    )

    fireEvent.contextMenu(screen.getByText("Portfolio content"))

    for (const label of [
      "Copy",
      "Paste",
      "Select All",
      "Buy me a coffee",
      "About",
      "Experience",
      "Education",
      "Skills",
      "Projects",
      "Recommendations",
      "Back",
      "Forward",
      "Reload",
    ]) {
      expect(
        screen.getByRole("menuitem", { name: new RegExp(label) })
      ).not.toBeNull()
    }
  })

  it("keeps the document scrollbar available while open", () => {
    render(
      <AppContextMenu>
        <main>Portfolio content</main>
      </AppContextMenu>
    )

    fireEvent.contextMenu(screen.getByText("Portfolio content"))

    expect(document.body.hasAttribute("data-scroll-locked")).toBe(false)
  })

  it("navigates homepage sections using their URL hashes", () => {
    render(
      <AppContextMenu>
        <main>Portfolio content</main>
      </AppContextMenu>
    )

    fireEvent.contextMenu(screen.getByText("Portfolio content"))
    fireEvent.click(screen.getByRole("menuitem", { name: /Projects/ }))

    expect(navigate).toHaveBeenCalledWith({ to: "/", hash: "projects" })
  })

  it("runs the coffee action from the right-click menu", () => {
    render(
      <AppContextMenu>
        <main>Portfolio content</main>
      </AppContextMenu>
    )

    fireEvent.contextMenu(screen.getByText("Portfolio content"))
    fireEvent.click(screen.getByRole("menuitem", { name: /Buy me a coffee/ }))

    expect(window.open).toHaveBeenCalledWith(
      "https://www.supportkori.com/montasim",
      "_blank",
      "noopener,noreferrer"
    )
  })

  it("uses a compact context-menu surface", () => {
    render(
      <AppContextMenu>
        <main>Portfolio content</main>
      </AppContextMenu>
    )

    fireEvent.contextMenu(screen.getByText("Portfolio content"))

    const menu = screen.getByRole("menu")
    const about = screen.getByRole("menuitem", { name: /About/ })

    expect(menu.className).toContain("w-60")
    expect(about.className).toContain("min-h-8")
    expect(about.className).toContain("text-sm")
  })
})
