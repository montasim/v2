// @vitest-environment jsdom

import { act, cleanup, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useLandingNavigation } from "@/components/layout/use-landing-navigation"
import { landingSectionIds } from "@/lib/site"

let intersectionCallback: IntersectionObserverCallback
const observe = vi.fn()
const disconnect = vi.fn()
const scrollIntoView = vi.fn()

describe("useLandingNavigation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.history.replaceState({}, "", "/")
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    })
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    })

    for (const sectionId of landingSectionIds) {
      const section = document.createElement("section")
      section.id = sectionId
      document.body.append(section)
    }

    Object.defineProperty(window, "IntersectionObserver", {
      configurable: true,
      value: class MockIntersectionObserver {
        constructor(callback: IntersectionObserverCallback) {
          intersectionCallback = callback
        }

        observe = observe
        disconnect = disconnect
      },
    })
  })

  afterEach(() => {
    cleanup()
    document.body.replaceChildren()
  })

  it("observes every landing-page section", () => {
    renderHook(() => useLandingNavigation("/", ""))

    expect(observe.mock.calls.map(([element]) => element.id)).toEqual(
      landingSectionIds
    )
  })

  it("replaces the URL hash when the visible section changes", () => {
    const initialHistoryLength = window.history.length
    const { result } = renderHook(() => useLandingNavigation("/", ""))
    const projects = document.getElementById("projects")!

    act(() =>
      intersectionCallback(
        [
          {
            isIntersecting: true,
            target: projects,
            boundingClientRect: { top: 120 },
          } as unknown as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver
      )
    )

    expect(result.current.activeSection).toBe("projects")
    expect(window.location.hash).toBe("#projects")
    expect(window.history.length).toBe(initialHistoryLength)
  })

  it("keeps the destination hash stable during smooth navigation", () => {
    const { result } = renderHook(() => useLandingNavigation("/", ""))
    const experience = document.getElementById("experience")!
    const projects = document.getElementById("projects")!

    act(() => expect(result.current.navigateToSection("projects")).toBe(true))

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    })
    expect(result.current.activeSection).toBe("projects")
    expect(window.location.hash).toBe("#projects")

    act(() =>
      intersectionCallback(
        [
          {
            isIntersecting: true,
            target: experience,
            boundingClientRect: { top: 120 },
          } as unknown as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver
      )
    )

    expect(result.current.activeSection).toBe("projects")
    expect(window.location.hash).toBe("#projects")

    act(() =>
      intersectionCallback(
        [
          {
            isIntersecting: true,
            target: projects,
            boundingClientRect: { top: 56 },
          } as unknown as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver
      )
    )

    expect(result.current.activeSection).toBe("projects")
    expect(window.location.hash).toBe("#projects")
  })

  it("adds the hash when navigating to the already-active first section", () => {
    const { result } = renderHook(() => useLandingNavigation("/", ""))

    act(() => result.current.navigateToSection("about"))

    expect(window.location.hash).toBe("#about")
  })

  it("uses instant navigation when reduced motion is requested", () => {
    vi.mocked(window.matchMedia).mockReturnValue({
      matches: true,
    } as MediaQueryList)
    const { result } = renderHook(() => useLandingNavigation("/", ""))

    act(() => result.current.navigateToSection("skills"))

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "auto",
      block: "start",
    })
  })
})
