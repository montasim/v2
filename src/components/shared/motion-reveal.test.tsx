// @vitest-environment jsdom

import { act, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { MotionReveal } from "@/components/shared/motion-reveal"

describe("MotionReveal", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it("paints the pending state before observing an initially visible element", () => {
    let frameCallback: FrameRequestCallback | undefined

    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })
    )
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn((callback: FrameRequestCallback) => {
        frameCallback = callback
        return 1
      })
    )
    vi.stubGlobal("cancelAnimationFrame", vi.fn())
    vi.stubGlobal(
      "IntersectionObserver",
      class MockIntersectionObserver {
        constructor(private callback: IntersectionObserverCallback) {}

        observe(element: Element) {
          this.callback(
            [
              {
                isIntersecting: true,
                target: element,
              } as IntersectionObserverEntry,
            ],
            this as unknown as IntersectionObserver
          )
        }

        disconnect() {}
        unobserve() {}
      }
    )

    render(<MotionReveal data-testid="reveal">About</MotionReveal>)

    expect(screen.getByTestId("reveal").dataset.motionState).toBe("pending")

    act(() => frameCallback?.(0))

    const reveal = screen.getByTestId("reveal")
    expect(reveal.dataset.motionState).toBe("revealed")
    // On screen at page open, so it waits for the hero entrance to lead.
    expect(reveal.style.getPropertyValue("--motion-reveal-delay")).toBe("400ms")
  })

  it("keeps the plain delay for elements revealed later by scrolling", () => {
    let reveal: IntersectionObserverCallback | undefined
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })
    )
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn((callback: FrameRequestCallback) => {
        callback(0)
        return 1
      })
    )
    vi.stubGlobal("cancelAnimationFrame", vi.fn())
    vi.stubGlobal(
      "IntersectionObserver",
      class MockIntersectionObserver {
        constructor(callback: IntersectionObserverCallback) {
          reveal = callback
        }
        observe() {}
        disconnect() {}
        unobserve() {}
      }
    )
    const now = vi.spyOn(performance, "now").mockReturnValue(0)

    const element = render(<MotionReveal delay={80}>Projects</MotionReveal>)
      .container.firstElementChild as HTMLElement
    now.mockReturnValue(5000)
    act(() =>
      reveal?.(
        [
          {
            isIntersecting: true,
            target: element,
          } as unknown as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver
      )
    )

    expect(element.dataset.motionState).toBe("revealed")
    expect(element.style.getPropertyValue("--motion-reveal-delay")).toBe("80ms")
  })
})
