// @vitest-environment jsdom

import * as React from "react"
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  RecommendationCarousel,
  RecommendationDetails,
} from "@/components/portfolio/recommendations"
import { recommendationCatalog } from "@/lib/content/recommendations"

const carouselApi = vi.hoisted(() => ({
  canScrollPrev: vi.fn(() => true),
  canScrollNext: vi.fn(() => true),
  on: vi.fn(),
  off: vi.fn(),
  scrollPrev: vi.fn(),
  scrollNext: vi.fn(),
  selectedScrollSnap: vi.fn(() => 0),
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

  it("renders recommendation spacing as paragraphs", async () => {
    const { container } = render(<RecommendationCarousel />)
    await act(async () => {})

    const firstQuote = container.querySelector("blockquote")
    expect(firstQuote?.querySelectorAll("p").length).toBeGreaterThan(1)
  })

  it("keeps the badge and recommendation number grouped on the right", async () => {
    render(<RecommendationCarousel />)
    await act(async () => {})

    const number = screen.getByLabelText("Recommendation 1")
    expect(number.parentElement?.className).toContain("flex")
    expect(number.parentElement?.parentElement?.className).toContain(
      "justify-between"
    )
  })

  it("shows one timed progress indicator on the active card", async () => {
    const { container } = render(<RecommendationCarousel />)
    await act(async () => {})

    const progress = container.querySelector<HTMLElement>(
      ".recommendation-carousel-progress"
    )
    expect(progress).toBeTruthy()
    expect(
      container.querySelectorAll(".recommendation-carousel-progress")
    ).toHaveLength(1)
    expect(progress?.style.animationPlayState).toBe("paused")

    act(() =>
      intersectionCallback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver
      )
    )

    expect(
      container.querySelector<HTMLElement>(".recommendation-carousel-progress")
        ?.style.animationPlayState
    ).toBe("running")
  })

  it("places the detail-card badge and number on the right", () => {
    const firstRecommendation = recommendationCatalog.records[0]

    render(<RecommendationDetails item={firstRecommendation} index={0} />)

    const number = screen.getByLabelText("Recommendation 1")
    expect(number.parentElement?.textContent).toBe(
      `${firstRecommendation.hiringSignal}#1`
    )
    expect(number.parentElement?.parentElement?.className).toContain(
      "justify-between"
    )
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
