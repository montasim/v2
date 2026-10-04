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
  stats: {
    commits: 1832,
    pullRequests: 186,
    codeReviews: 0,
    issues: 7,
    repositoriesCreated: 43,
    privateContributions: 702,
    allTimePullRequests: 535,
    allTimeMergedPullRequests: 471,
    allTimeIssues: 183,
    publicRepositories: 92,
    followers: 111,
  },
  topRepositories: [
    {
      name: "montasim/PostCraft",
      url: "https://github.com/montasim/PostCraft",
      commits: 406,
    },
  ],
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

  it("shows last-year stats including private work and code reviews", () => {
    render(<ContributionCalendar data={liveData} />)

    const stats = screen.getByRole("list", { name: "Last 12 months" })
    for (const text of [
      "1,832",
      "Commits",
      "186",
      "Pull requests",
      "0",
      "Code reviews",
      "7",
      "Issues",
      "43",
      "New repositories",
      "702",
      "Private contributions",
    ]) {
      expect(stats.textContent).toContain(text)
    }
  })

  it("shows all-time totals and public top repositories", () => {
    render(<ContributionCalendar data={liveData} />)

    expect(
      screen.getByText(
        "All time: 535 pull requests (471 merged) · 183 issues · 92 public repositories · 111 followers"
      )
    ).toBeTruthy()
    expect(
      screen
        .getByRole("link", { name: "montasim/PostCraft, 406 commits" })
        .getAttribute("href")
    ).toBe("https://github.com/montasim/PostCraft")
  })

  it("hides stats when only the bundled snapshot is available", () => {
    render(
      <ContributionCalendar
        data={{
          ...liveData,
          source: "snapshot",
          stats: null,
          topRepositories: [],
        }}
      />
    )

    expect(screen.queryByRole("list", { name: "Last 12 months" })).toBeNull()
    expect(screen.queryByText(/All time:/)).toBeNull()
    expect(screen.queryByText("Most active in")).toBeNull()
  })
})
