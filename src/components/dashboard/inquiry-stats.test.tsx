// @vitest-environment jsdom

import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { InquiryStats } from "./inquiry-stats"

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
        name: /Ranked bar chart of 4 role inquiries: Senior Frontend Engineer, 3; Technical Lead, 1/,
      })
    ).not.toBeNull()
    expect(
      screen.getByRole("img", {
        name: /Segmented chart of 4 arrangement preferences: Remote, 2; Hybrid, 2/,
      })
    ).not.toBeNull()
    expect(screen.getByText("Role demand")).not.toBeNull()
    expect(screen.getByText("Work setup")).not.toBeNull()
  })
})
