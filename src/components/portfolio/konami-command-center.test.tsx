// @vitest-environment jsdom

import * as React from "react"
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { KonamiCommandCenter } from "@/components/portfolio/konami-command-center"
import { KONAMI_SEQUENCE } from "@/hooks/use-konami-code"

const navigate = vi.hoisted(() => vi.fn())

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    children,
    ...props
  }: {
    to: string
    children: React.ReactNode
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useNavigate: () => navigate,
}))

function enterKonamiCode(target: Window | HTMLElement = window) {
  for (const key of KONAMI_SEQUENCE) fireEvent.keyDown(target, { key })
}

describe("KonamiCommandCenter", () => {
  beforeEach(() => navigate.mockClear())
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it("opens only after the complete Konami sequence", () => {
    render(<KonamiCommandCenter />)

    for (const key of KONAMI_SEQUENCE.slice(0, -1)) {
      fireEvent.keyDown(window, { key })
    }
    expect(screen.queryByRole("dialog")).toBeNull()

    fireEvent.keyDown(window, { key: KONAMI_SEQUENCE.at(-1) })

    expect(screen.getByRole("dialog")).not.toBeNull()
    expect(
      screen.getByRole("heading", { name: "Developer command center" })
    ).not.toBeNull()
  })

  it("shows accepted keys while the sequence is being entered", () => {
    render(<KonamiCommandCenter />)

    fireEvent.keyDown(window, { key: "ArrowUp" })
    fireEvent.keyDown(window, { key: "ArrowUp" })

    expect(screen.getByRole("status").textContent).toContain("↑ ↑")

    fireEvent.keyDown(window, { key: "x" })
    expect(screen.queryByRole("status")).toBeNull()
  })

  it("hides partial input after a short pause", () => {
    vi.useFakeTimers()
    render(<KonamiCommandCenter />)

    fireEvent.keyDown(window, { key: "ArrowUp" })
    expect(screen.getByRole("status")).not.toBeNull()

    act(() => vi.advanceTimersByTime(1800))
    expect(screen.queryByRole("status")).toBeNull()
  })

  it("ignores the sequence while a visitor is typing", () => {
    render(
      <>
        <input aria-label="Message" />
        <KonamiCommandCenter />
      </>
    )

    enterKonamiCode(screen.getByRole("textbox", { name: "Message" }))

    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("resets after an incorrect key", () => {
    render(<KonamiCommandCenter />)

    fireEvent.keyDown(window, { key: "ArrowUp" })
    fireEvent.keyDown(window, { key: "x" })
    for (const key of KONAMI_SEQUENCE.slice(1))
      fireEvent.keyDown(window, { key })

    expect(screen.queryByRole("dialog")).toBeNull()

    enterKonamiCode()
    expect(screen.getByRole("dialog")).not.toBeNull()
  })

  it("runs the keyboard shortcuts shown in the command center", () => {
    render(<KonamiCommandCenter />)
    enterKonamiCode()

    fireEvent.keyDown(window, { key: "p" })

    expect(navigate).toHaveBeenCalledWith({ to: "/projects" })
    expect(screen.queryByRole("dialog")).toBeNull()
  })
})
