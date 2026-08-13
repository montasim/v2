// @vitest-environment jsdom

import * as React from "react"
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { RecommendationCarousel } from "@/components/portfolio/recommendations"

const carouselApi = vi.hoisted(() => ({
  canScrollPrev: vi.fn(() => true),
  canScrollNext: vi.fn(() => true),
  on: vi.fn(),
  off: vi.fn(),
  scrollPrev: vi.fn(),
  scrollNext: vi.fn(),
}))

let intersectionCallback: IntersectionObserverCallback

vi.mock("@/components/ui/carousel", () => ({
  Carousel: ({
    setApi,
    children,
    ...props
  }: React.ComponentProps<"div"> & { setApi?: (api: unknown) => void }) => {
    React.useEffect(() => setApi?.(carouselApi), [setApi])
    return <div {...props}>{children}</div>
  },
  CarouselContent: (props: React.ComponentProps<"div">) => <div {...props} />,
  CarouselItem: (props: React.ComponentProps<"div">) => <div {...props} />,
}))

describe("RecommendationCarousel movement", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => ({ matches: false })),
    })
    Object.defineProperty(window, "IntersectionObserver", {
      configurable: true,
      value: class MockIntersectionObserver {
        constructor(callback: IntersectionObserverCallback) {
          intersectionCallback = callback
        }

        observe = vi.fn()
        disconnect = vi.fn()
      },
    })
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it("moves cards in the direction communicated by each arrow", async () => {
    render(<RecommendationCarousel />)
    await act(async () => {})

    fireEvent.click(screen.getByRole("button", { name: /right/i }))
    expect(carouselApi.scrollPrev).toHaveBeenCalledOnce()

    fireEvent.click(screen.getByRole("button", { name: /left/i }))
    expect(carouselApi.scrollNext).toHaveBeenCalledOnce()
  })

  it("keeps arrow positioning separate from button hover transforms", async () => {
    render(<RecommendationCarousel />)
    await act(async () => {})

    for (const direction of ["left", "right"]) {
      const button = screen.getByRole("button", {
        name: new RegExp(direction, "i"),
      })
      expect(button.className).not.toContain("-translate-y-1/2")
      expect(button.parentElement?.className).toContain("-translate-y-1/2")
    }
  })

  it("automatically advances cards to the right after seven seconds", async () => {
    render(<RecommendationCarousel />)
    await act(async () => {})

    act(() =>
      intersectionCallback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver
      )
    )
    act(() => vi.advanceTimersByTime(7000))

    expect(carouselApi.scrollPrev).toHaveBeenCalledOnce()
  })

  it("does not auto-advance while the carousel is outside the viewport", async () => {
    render(<RecommendationCarousel />)
    await act(async () => {})

    act(() =>
      intersectionCallback(
        [{ isIntersecting: false } as IntersectionObserverEntry],
        {} as IntersectionObserver
      )
    )
    act(() => vi.advanceTimersByTime(7000))

    expect(carouselApi.scrollPrev).not.toHaveBeenCalled()
  })
})
