// @vitest-environment jsdom

import { act, cleanup, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useLandingNavigation } from "@/components/layout/use-landing-navigation"
import { landingSectionIds } from "@/lib/site"

let intersectionCallback: IntersectionObserverCallback
const observe = vi.fn()
const disconnect = vi.fn()
const scrollTo = vi.fn()
const cancelAnimationFrame = vi.fn()
const animationFrames: FrameRequestCallback[] = []
let currentScrollY = 0
const sectionTops: Record<string, number> = {}
const requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
  animationFrames.push(callback)
  return animationFrames.length
})

describe("useLandingNavigation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    animationFrames.length = 0
    currentScrollY = 0
    window.history.replaceState({}, "", "/")
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    })
    Object.defineProperty(window, "scrollTo", {
      configurable: true,
      value: scrollTo,
    })
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      get: () => currentScrollY,
    })
    scrollTo.mockImplementation((options: ScrollToOptions) => {
      currentScrollY = options.top ?? 0
    })
    Object.defineProperty(window, "requestAnimationFrame", {
      configurable: true,
      value: requestAnimationFrame,
    })
    Object.defineProperty(window, "cancelAnimationFrame", {
      configurable: true,
      value: cancelAnimationFrame,
    })

    landingSectionIds.forEach((sectionId, index) => {
      sectionTops[sectionId] = index * 1_000
      const section = document.createElement("section")
      section.id = sectionId
      Object.defineProperty(section, "getBoundingClientRect", {
        configurable: true,
        value: () =>
          ({ top: sectionTops[sectionId] - currentScrollY }) as DOMRect,
      })
      document.body.append(section)
    })

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

  it("keeps the destination hash stable during bounded smooth navigation", () => {
    const { result } = renderHook(() => useLandingNavigation("/", ""))
    const experience = document.getElementById("experience")!
    const projects = document.getElementById("projects")!

    act(() => expect(result.current.navigateToSection("projects")).toBe(true))

    expect(requestAnimationFrame).toHaveBeenCalledTimes(1)
    expect(result.current.activeSection).toBe("projects")
    expect(window.location.hash).toBe("#projects")

    act(() => animationFrames.shift()?.(0))
    act(() => animationFrames.shift()?.(350))

    expect(currentScrollY).toBeGreaterThan(0)
    expect(currentScrollY).toBeLessThan(sectionTops.projects)

    act(() => animationFrames.shift()?.(700))

    expect(currentScrollY).toBe(sectionTops.projects)

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

    expect(scrollTo).toHaveBeenCalledWith({
      left: 0,
      top: sectionTops.skills,
      behavior: "instant",
    })
  })

  it("finishes a long upward section scroll within a bounded animation", () => {
    currentScrollY = 5_710
    const { result } = renderHook(() => useLandingNavigation("/", ""))

    act(() => expect(result.current.navigateToSection("about")).toBe(true))

    act(() => animationFrames.shift()?.(0))
    act(() => animationFrames.shift()?.(350))

    expect(currentScrollY).toBeGreaterThan(sectionTops.about)
    expect(currentScrollY).toBeLessThan(5_710)

    act(() => animationFrames.shift()?.(700))

    expect(currentScrollY).toBe(sectionTops.about)
    expect(window.location.hash).toBe("#about")
  })

  it("clears the section hash and keeps the home URL clean when navigating to the top", () => {
    window.history.replaceState({}, "", "/#recommendations")
    const { result } = renderHook(() =>
      useLandingNavigation("/", "#recommendations")
    )
    const about = document.getElementById("about")!
    const experience = document.getElementById("experience")!

    act(() => expect(result.current.navigateToTop()).toBe(true))

    expect(result.current.activeSection).toBe("about")
    expect(window.location.pathname).toBe("/")
    expect(window.location.hash).toBe("")
    expect(scrollTo).toHaveBeenCalledWith({
      left: 0,
      top: 0,
      behavior: "instant",
    })

    act(() =>
      intersectionCallback(
        [
          {
            isIntersecting: true,
            target: about,
            boundingClientRect: { top: 56 },
          } as unknown as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver
      )
    )

    expect(window.location.hash).toBe("")

    act(() =>
      intersectionCallback(
        [
          {
            isIntersecting: true,
            target: experience,
            boundingClientRect: { top: 56 },
          } as unknown as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver
      )
    )

    expect(window.location.hash).toBe("#experience")
  })

  it("finishes a long upward scroll within a bounded animation", () => {
    currentScrollY = 5_710
    window.history.replaceState({}, "", "/#recommendations")
    const { result } = renderHook(() =>
      useLandingNavigation("/", "#recommendations")
    )

    act(() => expect(result.current.navigateToTop()).toBe(true))

    expect(requestAnimationFrame).toHaveBeenCalledTimes(1)

    act(() => animationFrames.shift()?.(0))
    act(() => animationFrames.shift()?.(350))
    act(() => animationFrames.shift()?.(700))

    expect(currentScrollY).toBe(0)
    expect(window.location.hash).toBe("")
  })
})
