// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { AvailabilityCard } from "@/components/portfolio/availability-card"

afterEach(cleanup)

describe("AvailabilityCard", () => {
  it("shows verified working-preference data and honest gaps", () => {
    render(<AvailabilityCard />)

    expect(screen.getByText("Working preferences")).not.toBeNull()
    expect(screen.getByText("Actively looking")).not.toBeNull()
    expect(screen.queryByText("Senior Software Engineer")).toBeNull()
    expect(screen.getByText("Remote, on-site, or hybrid")).not.toBeNull()
    expect(screen.getByText("Dhaka, Bangladesh (UTC+6)")).not.toBeNull()
    expect(screen.queryByText("Immediately")).toBeNull()
    expect(screen.getAllByText("Ask me")).toHaveLength(1)
    expect(
      screen.getByRole("button", { name: "Discuss a role" }).className
    ).toContain("bg-emphasis-foreground")
  })

  it("uses concise labels for common recruiter questions", () => {
    render(<AvailabilityCard />)

    for (const label of [
      "Availability",
      "Work setup",
      "Location and timezone",
      "Relocation and visa",
    ]) {
      expect(screen.getByText(label)).not.toBeNull()
    }
  })
})
