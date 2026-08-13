import { describe, expect, it, vi } from "vitest"

import { createInitialScrollRestorationPolicy } from "./router"

describe("initial scroll restoration policy", () => {
  it("preserves user scroll made before the first client render settles", () => {
    const getScrollY = vi.fn(() => 4500)
    const registerDocumentScroll = vi.fn()
    const shouldRestore = createInitialScrollRestorationPolicy({
      isClient: () => true,
      getScrollY,
      registerDocumentScroll,
    })

    expect(shouldRestore()).toBe(false)
    expect(shouldRestore()).toBe(true)
    expect(getScrollY).toHaveBeenCalledOnce()
    expect(registerDocumentScroll).toHaveBeenCalledOnce()
  })

  it("keeps the normal initial restoration when the page is still at the top", () => {
    const shouldRestore = createInitialScrollRestorationPolicy({
      isClient: () => true,
      getScrollY: () => 0,
      registerDocumentScroll: vi.fn(),
    })

    expect(shouldRestore()).toBe(true)
    expect(shouldRestore()).toBe(true)
  })

  it("does not consume the first client check during server rendering", () => {
    let isClient = false
    const shouldRestore = createInitialScrollRestorationPolicy({
      isClient: () => isClient,
      getScrollY: () => 3200,
      registerDocumentScroll: vi.fn(),
    })

    expect(shouldRestore()).toBe(true)

    isClient = true
    expect(shouldRestore()).toBe(false)
    expect(shouldRestore()).toBe(true)
  })
})
