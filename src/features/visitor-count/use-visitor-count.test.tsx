// @vitest-environment jsdom

import { StrictMode } from "react"
import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useVisitorCount } from "@/features/visitor-count/use-visitor-count"

describe("useVisitorCount", () => {
  beforeEach(() => window.sessionStorage.clear())

  it("records one visit during strict-mode effect replay", async () => {
    const getCount = vi.fn().mockResolvedValue(0)
    const recordView = vi.fn().mockResolvedValue(1)

    const { result } = renderHook(
      () =>
        useVisitorCount({
          resourceKey: "project-case-study",
          slug: "postcraft",
          getCount,
          recordView,
        }),
      { wrapper: StrictMode }
    )

    await waitFor(() => expect(result.current).toBe(1))
    expect(recordView).toHaveBeenCalledTimes(1)
    expect(getCount).not.toHaveBeenCalled()
  })

  it("reads without incrementing when the case study was viewed this session", async () => {
    window.sessionStorage.setItem(
      "portfolio-viewed:project-case-study:postcraft",
      "1"
    )
    const getCount = vi.fn().mockResolvedValue(12)
    const recordView = vi.fn().mockResolvedValue(13)

    const { result } = renderHook(() =>
      useVisitorCount({
        resourceKey: "project-case-study",
        slug: "postcraft",
        getCount,
        recordView,
      })
    )

    await waitFor(() => expect(result.current).toBe(12))
    expect(getCount).toHaveBeenCalledTimes(1)
    expect(recordView).not.toHaveBeenCalled()
  })
})
