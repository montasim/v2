// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { ContributionCalendar } from "@/components/portfolio/contribution-calendar"
import type { GitHubContributions } from "@/features/github-contributions/domain/contributions"

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}))

const weeks = [
  {
    contributionDays: [
      { contributionCount: 3, date: "2026-09-27" },
      { contributionCount: 0, date: "2026-09-28" },
    ],
  },
  {
    contributionDays: [{ contributionCount: 12, date: "2026-10-04" }],
  },
]

const liveData: GitHubContributions = {
  source: "live",
  retrievedAt: "2026-10-04T12:00:00.000Z",
  profileUrl: "https://github.com/montasim",
  totalContributions: 2770,
  weeks,
}

afterEach(cleanup)

describe("ContributionCalendar", () => {
  it("renders the calendar total from the provided data", () => {
    render(<ContributionCalendar data={liveData} />)

    expect(
      screen.getByRole("img", {
        name: "2,770 GitHub contributions in the last year",
      })
    ).toBeTruthy()
    expect(
      screen
        .getByRole("link", { name: /2,770 GitHub contributions/ })
        .getAttribute("href")
    ).toBe("https://github.com/montasim")
  })
})
