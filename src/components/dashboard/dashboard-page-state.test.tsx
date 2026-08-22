// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  DashboardEmptyState,
  DashboardPageHeader,
} from "./dashboard-page-state"

afterEach(cleanup)

describe("DashboardPageHeader", () => {
  it("refreshes route data without navigating away", async () => {
    let finishRefresh: (() => void) | undefined
    const refresh = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finishRefresh = resolve
        })
    )

    const view = render(
      <DashboardPageHeader title="Blog comments" onRefresh={refresh} />
    )

    fireEvent.click(view.getByRole("button", { name: "Refresh data" }))

    expect(refresh).toHaveBeenCalledOnce()
    expect(
      view
        .getByRole("button", { name: "Refreshing data" })
        .hasAttribute("disabled")
    ).toBe(true)

    finishRefresh?.()
    await waitFor(() =>
      expect(
        view
          .getByRole("button", { name: "Refresh data" })
          .hasAttribute("disabled")
      ).toBe(false)
    )
  })

  it("keeps the page usable when refreshing fails", async () => {
    const view = render(
      <DashboardPageHeader
        title="Chat history"
        onRefresh={() => Promise.reject(new Error("offline"))}
      />
    )

    fireEvent.click(view.getByRole("button", { name: "Refresh data" }))

    expect((await view.findByRole("alert")).textContent).toBe("Refresh failed")
    expect(
      view
        .getByRole("button", { name: "Refresh data" })
        .hasAttribute("disabled")
    ).toBe(false)
  })
})

describe("DashboardEmptyState", () => {
  it("explains what will appear in an empty comments view", () => {
    render(<DashboardEmptyState kind="comments" />)

    expect(screen.getByText("No comments to review")).not.toBeNull()
    expect(
      screen.getByText(
        "New comments from blog discussions will appear here for moderation."
      )
    ).not.toBeNull()
  })
})
