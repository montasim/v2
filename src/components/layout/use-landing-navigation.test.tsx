// @vitest-environment jsdom

import { act, cleanup, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useLandingNavigation } from "@/components/layout/use-landing-navigation"
import { landingSectionIds } from "@/lib/site"

let intersectionCallback: IntersectionObserverCallback
const observe = vi.fn()
const disconnect = vi.fn()

describe("useLandingNavigation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.history.replaceState({}, "", "/")

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
})
