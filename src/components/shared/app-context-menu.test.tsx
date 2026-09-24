// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { AppContextMenu } from "@/components/shared/app-context-menu"

const navigate = vi.hoisted(() => vi.fn())
const toggleTheme = vi.hoisted(() => vi.fn())
const writeText = vi.hoisted(() => vi.fn())
const readText = vi.hoisted(() => vi.fn())
const toastSuccess = vi.hoisted(() => vi.fn())

vi.mock("sonner", () => ({
  toast: { success: toastSuccess },
}))

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
}))

vi.mock("@/components/theme-provider", () => ({
  useTheme: () => ({ theme: "light", toggleTheme }),
}))

describe("AppContextMenu", () => {
  beforeEach(() => {
    navigate.mockClear()
    writeText.mockReset()
    readText.mockReset()
    toastSuccess.mockReset()
    writeText.mockResolvedValue(undefined)
    readText.mockResolvedValue("")
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { readText, writeText },
    })
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

  it.each([
    ["internal", "/projects", "http://localhost:3000/projects"],
    ["external", "https://example.com/docs", "https://example.com/docs"],
    ["email", "mailto:owner@example.com", "owner@example.com"],
  ])(
    "copies an %s link opened through a nested target",
    async (_, href, expected) => {
      render(
        <AppContextMenu>
          <a href={href}>
            <span>Linked content</span>
          </a>
        </AppContextMenu>
      )

      fireEvent.contextMenu(screen.getByText("Linked content"))
      const copy = screen.getByRole("menuitem", { name: /Copy/ })

      expect(copy.hasAttribute("data-disabled")).toBe(false)
      fireEvent.click(copy)

      expect(writeText).toHaveBeenCalledWith(expected)
      await waitFor(() =>
        expect(toastSuccess).toHaveBeenCalledWith(
          href.startsWith("mailto:") ? "Email copied" : "Link copied"
        )
      )
    }
  )

  it("removes mailto parameters when copying an email link", async () => {
    render(
      <AppContextMenu>
        <a href="mailto:owner%2Bportfolio@example.com?subject=Hello">Email</a>
      </AppContextMenu>
    )

    fireEvent.contextMenu(screen.getByText("Email"))
    fireEvent.click(screen.getByRole("menuitem", { name: /Copy/ }))

    expect(writeText).toHaveBeenCalledWith("owner+portfolio@example.com")
    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith("Email copied")
    )
  })

  it("keeps copy disabled outside links when no text is selected", () => {
    render(
      <AppContextMenu>
        <main>Portfolio content</main>
      </AppContextMenu>
    )

    fireEvent.contextMenu(screen.getByText("Portfolio content"))

    expect(
      screen
        .getByRole("menuitem", { name: /Copy/ })
        .hasAttribute("data-disabled")
    ).toBe(true)
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
