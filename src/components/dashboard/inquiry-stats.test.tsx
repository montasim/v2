// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { InquiryStats } from "./inquiry-stats"

afterEach(cleanup)

describe("InquiryStats", () => {
  it("renders accessible role and arrangement summaries", () => {
    render(
      <InquiryStats
        roles={[
          { label: "Senior Frontend Engineer", count: 3 },
          { label: "Technical Lead", count: 1 },
        ]}
        arrangements={[
          { label: "Remote", count: 2 },
          { label: "Hybrid", count: 2 },
        ]}
      />
    )

    expect(
      screen.getByRole("img", {
        name: /Donut chart of 4 role inquiries: Senior Frontend Engineer, 3; Technical Lead, 1/,
      })
    ).not.toBeNull()
    expect(
      screen.getByRole("list", { name: "Role demand legend" })
    ).not.toBeNull()
    expect(
      screen.getByRole("list", { name: "Work setup legend" })
    ).not.toBeNull()
    expect(screen.getByText("Role demand")).not.toBeNull()
    expect(screen.getByText("Work setup")).not.toBeNull()
  })

  it("renders the empty hiring-signals state without a chart", () => {
    render(
      <InquiryStats
        roles={[{ label: "Senior Frontend Engineer", count: 0 }]}
        arrangements={[{ label: "Remote", count: 0 }]}
      />
    )

    expect(screen.getByText("No hiring signals yet")).not.toBeNull()
    expect(screen.queryByRole("img", { name: /Donut chart/ })).toBeNull()
  })
})
