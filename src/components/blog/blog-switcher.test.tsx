// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  BlogSwitcher,
  blogSwitcherOptions,
} from "@/components/blog/blog-switcher"
import { blogCatalog } from "@/lib/content/blog"

const navigate = vi.hoisted(() => vi.fn())

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
}))

describe("BlogSwitcher", () => {
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

  it("lists every article and navigates to the chosen one", () => {
    const [current, target] = blogCatalog.posts
    render(<BlogSwitcher current={current} />)

    fireEvent.click(screen.getByRole("button", { name: current.title }))
    expect(screen.getAllByRole("option")).toHaveLength(
      blogSwitcherOptions.length
    )
    expect(
      screen.getByRole("option", { name: current.title }).dataset.current
    ).toBe("true")

    fireEvent.click(screen.getByRole("option", { name: target.title }))

    expect(navigate).toHaveBeenCalledWith({
      to: "/blog/$slug",
      params: { slug: target.slug },
    })
  })
})
