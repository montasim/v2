import { expect, it } from "vitest"
import { dashboardNavigation, dashboardPageFor } from "./dashboard-navigation"

it("keeps New journal under Work Journal without adding a sidebar item", () => {
  for (const path of [
    "/dashboard/work-journal/new",
    "/dashboard/work-journal/new/",
  ]) {
    expect(dashboardPageFor(path)).toMatchObject({
      to: "/dashboard/work-journal",
      label: "Work Journal",
      detail: "New journal",
    })
  }
  expect(
    dashboardNavigation.filter((page) =>
      page.to.startsWith("/dashboard/work-journal")
    )
  ).toHaveLength(1)
})

it("keeps existing dashboard page identities and matches whole path segments", () => {
  for (const page of dashboardNavigation) {
    expect(dashboardPageFor(page.to)).toEqual({ ...page, detail: null })
  }
  expect(dashboardPageFor("/dashboard/work-journal-other").to).toBe(
    "/dashboard"
  )
})
