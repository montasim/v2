// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { CommandPalette } from "@/components/shared/command-palette"

const navigate = vi.hoisted(() => vi.fn())
const toggleTheme = vi.hoisted(() => vi.fn())

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
}))

vi.mock("@/components/theme-provider", () => ({
  useTheme: () => ({ theme: "light", toggleTheme }),
}))

describe("CommandPalette", () => {
  beforeEach(() => {
    navigate.mockClear()
    toggleTheme.mockClear()
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

  function openCommandMenu() {
    fireEvent.keyDown(document, { key: "k", ctrlKey: true })
  }

  it("opens with the v1 keyboard shortcut and shows both command groups", () => {
    render(<CommandPalette />)

    openCommandMenu()

    expect(
      screen.getByRole("dialog", { name: "Portfolio command menu" })
    ).not.toBeNull()
    expect(screen.getByText("Navigation")).not.toBeNull()
    expect(screen.getByText("Actions")).not.toBeNull()
    expect(screen.getByRole("option", { name: /Projects/ })).not.toBeNull()
    expect(
      screen.getByRole("option", { name: /Buy me a coffee/ })
    ).not.toBeNull()
  })

  it("toggles with the displayed Command+K shortcut", () => {
    render(<CommandPalette />)

    fireEvent.keyDown(document, { key: "k", metaKey: true })
    expect(screen.queryByRole("dialog")).not.toBeNull()

    fireEvent.keyDown(document, { key: "k", metaKey: true })
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("ignores keydown events without a key value", () => {
    render(<CommandPalette />)

    document.dispatchEvent(new Event("keydown"))

    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("keeps the document scrollbar available while open", () => {
    render(<CommandPalette />)

    openCommandMenu()

    expect(document.body.hasAttribute("data-scroll-locked")).toBe(false)
  })

  it("uses a comfortably sized desktop command surface", () => {
    render(<CommandPalette />)
    openCommandMenu()

    const dialog = screen.getByRole("dialog", {
      name: "Portfolio command menu",
    })
    const input = screen.getByPlaceholderText("Type a command or search...")
    const project = screen.getByRole("option", { name: /Projects/ })

    expect(dialog.querySelector("[cmdk-root]")?.className).toContain(
      "max-w-2xl"
    )
    expect(input.className).toContain("h-14")
    expect(project.className).toContain("min-h-11")
    expect(project.className).toContain("text-base")
  })

  it("filters commands and navigates to homepage section hashes", () => {
    render(<CommandPalette />)
    openCommandMenu()

    fireEvent.change(
      screen.getByPlaceholderText("Type a command or search..."),
      {
        target: { value: "Projects" },
      }
    )
    fireEvent.click(screen.getByRole("option", { name: /Projects/ }))

    expect(navigate).toHaveBeenCalledWith({ to: "/", hash: "projects" })
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("runs the current theme action", () => {
    render(<CommandPalette />)
    openCommandMenu()

    fireEvent.click(screen.getByRole("option", { name: /Dark Mode/ }))

    expect(toggleTheme).toHaveBeenCalledOnce()
  })
})
