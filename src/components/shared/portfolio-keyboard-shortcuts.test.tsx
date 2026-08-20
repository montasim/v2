// @vitest-environment jsdom

import { cleanup, fireEvent, render } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { PortfolioKeyboardShortcuts } from "@/components/shared/portfolio-keyboard-shortcuts"

const navigate = vi.hoisted(() => vi.fn())
const toggleTheme = vi.hoisted(() => vi.fn())

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
}))

vi.mock("@/components/theme-provider", () => ({
  useTheme: () => ({ theme: "light", toggleTheme }),
}))

describe("PortfolioKeyboardShortcuts", () => {
  beforeEach(() => {
    navigate.mockClear()
    toggleTheme.mockClear()
    vi.spyOn(window, "open").mockImplementation(() => null)
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it.each([
    ["1", { to: "/", hash: "about" }],
    ["2", { to: "/", hash: "experience" }],
    ["3", { to: "/education", hash: undefined }],
    ["4", { to: "/", hash: "skills" }],
    ["5", { to: "/", hash: "projects" }],
    ["6", { to: "/", hash: "recommendations" }],
  ])("maps %s to its displayed navigation destination", (key, destination) => {
    render(<PortfolioKeyboardShortcuts />)

    fireEvent.keyDown(document, { key })

    expect(navigate).toHaveBeenCalledWith(destination)
  })

  it("runs the theme shortcut", () => {
    render(<PortfolioKeyboardShortcuts />)

    fireEvent.keyDown(document, { key: "t" })

    expect(toggleTheme).toHaveBeenCalledOnce()
  })

  it("toggles the assistant using the visible close control first", () => {
    const openAssistant = vi.fn()
    const closeAssistant = vi.fn()
    render(
      <>
        <button aria-label="Ask about Montasim" onClick={openAssistant} />
        <button aria-label="Close assistant" onClick={closeAssistant} />
        <PortfolioKeyboardShortcuts />
      </>
    )

    fireEvent.keyDown(document, { key: "c" })

    expect(closeAssistant).toHaveBeenCalledOnce()
    expect(openAssistant).not.toHaveBeenCalled()
  })

  it.each([
    [
      "p",
      "https://drive.google.com/file/d/1v0RP3PyBB6KdsfXhonIHJXU-wgAUSIRT/view?usp=sharing",
    ],
    ["l", "https://linkedin.com/in/montasim"],
    ["g", "https://github.com/montasim"],
    ["e", "mailto:montasimmamun@gmail.com"],
  ])("runs the %s action shortcut", (key, url) => {
    render(<PortfolioKeyboardShortcuts />)

    fireEvent.keyDown(document, { key })

    expect(window.open).toHaveBeenCalledWith(
      url,
      ...(key === "e" ? [] : ["_blank", "noopener,noreferrer"])
    )
  })

  it("opens SupportKori with Ctrl or Command+B", () => {
    render(<PortfolioKeyboardShortcuts />)

    fireEvent.keyDown(document, { key: "b", ctrlKey: true })

    expect(window.open).toHaveBeenCalledWith(
      "https://www.supportkori.com/montasim",
      "_blank",
      "noopener,noreferrer"
    )
  })

  it("does not trigger single-key shortcuts while typing", () => {
    const { getByRole } = render(
      <>
        <input aria-label="Message" />
        <PortfolioKeyboardShortcuts />
      </>
    )

    fireEvent.keyDown(getByRole("textbox", { name: "Message" }), { key: "t" })
    fireEvent.keyDown(getByRole("textbox", { name: "Message" }), { key: "5" })

    expect(toggleTheme).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
  })
})
