// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { ContributionCalendar } from "@/components/portfolio/contribution-calendar"
import type { GitHubContributions } from "@/features/github-contributions/domain/contributions"

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}))

const fetchYear = vi.hoisted(() => vi.fn())
vi.mock(
  "@/features/github-contributions/application/github-contributions",
  () => ({
    getGitHubContributionsForYear: fetchYear,
  })
)

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
  year: 2026,
  availableYears: [2026, 2025],
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
    expect(screen.queryByRole("button", { name: "Last 12 months" })).toBeNull()
    expect(
      screen.getByRole("button", { name: "2026" }).getAttribute("aria-pressed")
    ).toBe("true")

    expect(
      screen.getByRole("img", {
        name: "2,770 GitHub contributions in 2026",
      })
    ).toBeTruthy()
    expect(
      screen
        .getByRole("link", { name: /2,770 GitHub contributions/ })
        .getAttribute("href")
    ).toBe("https://github.com/montasim")
  })
})

it("switches to a calendar year and back to the current year", async () => {
  fetchYear.mockResolvedValue({
    ...liveData,
    year: 2025,
    totalContributions: 42,
  })
  render(<ContributionCalendar data={liveData} />)
  fireEvent.click(screen.getByRole("button", { name: "2025" }))
  expect(screen.getByRole("status").textContent).toContain("2025")
  await screen.findByRole("img", { name: "42 GitHub contributions in 2025" })
  expect(fetchYear).toHaveBeenCalledWith({ data: 2025 })
  fireEvent.click(screen.getByRole("button", { name: "2026" }))
  expect(screen.getByRole("img").getAttribute("aria-label")).toContain("2026")
})

it("shows an error instead of mislabelling the previous calendar", async () => {
  fetchYear.mockRejectedValue(new Error("Unavailable"))
  render(<ContributionCalendar data={liveData} />)
  fireEvent.click(screen.getByRole("button", { name: "2025" }))
  await screen.findByRole("alert")
  expect(screen.queryByRole("img")).toBeNull()
})

it("ignores an older request after returning to the current year", async () => {
  let resolve!: (data: GitHubContributions) => void
  fetchYear.mockImplementation(
    () =>
      new Promise<GitHubContributions>((done) => {
        resolve = done
      })
  )
  render(<ContributionCalendar data={liveData} />)
  fireEvent.click(screen.getByRole("button", { name: "2025" }))
  fireEvent.click(screen.getByRole("button", { name: "2026" }))
  resolve({ ...liveData, year: 2025 })
  await waitFor(() =>
    expect(screen.getByRole("img").getAttribute("aria-label")).toContain("2026")
  )
})
