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

    expect(screen.getByTestId("reveal").dataset.motionState).toBe("revealed")
  })
})
