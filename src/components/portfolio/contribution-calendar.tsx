import { useRef, useState } from "react"
import { getGitHubContributionsForYear } from "@/features/github-contributions/application/github-contributions"
import { ExternalLink } from "@/components/shared/navigation-action"
import type {
  ContributionWeek,
  GitHubContributions,
} from "@/features/github-contributions/domain/contributions"

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const

const levelClasses = [
  "bg-border dark:bg-white/10",
  "bg-[#6ee7b7] dark:bg-[#064e3b]",
  "bg-[#10b981] dark:bg-[#047857]",
  "bg-[#047857] dark:bg-[#10b981]",
  "bg-[#064e3b] dark:bg-[#6ee7b7]",
] as const

function contributionLevel(count: number) {
  if (count === 0) return 0
  if (count <= 2) return 1
  if (count <= 5) return 2
  if (count <= 8) return 3
  return 4
}

function utcDate(date: string) {
  return new Date(`${date}T00:00:00Z`)
}

const formatCount = (value: number) => value.toLocaleString("en")

function monthLabels(weeks: readonly ContributionWeek[]) {
  return weeks.reduce<{ month: number; start: number; span: number }[]>(
    (labels, week, index) => {
      const firstDay = week.contributionDays[0]
      const month = utcDate(firstDay.date).getUTCMonth()
      const current = labels.at(-1)

      if (current?.month === month) {
        current.span += 1
      } else {
        labels.push({ month, start: index, span: 1 })
      }

      return labels
    },
    []
  )
}

function ContributionCell({ count }: { count: number }) {
  return (
    <span
      className={`size-2.5 rounded-[2px] ${levelClasses[contributionLevel(count)]}`}
      aria-hidden="true"
    />
  )
}

export function ContributionCalendar({ data }: { data: GitHubContributions }) {
  const [selectedYear, setSelectedYear] = useState(
    data.year ?? new Date().getUTCFullYear()
  )
  const [calendar, setCalendar] = useState(data)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const request = useRef(0)

  async function selectYear(year: number) {
    const id = ++request.current
    setSelectedYear(year)
    setError(false)
    if (year === data.year) {
      setCalendar(data)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const result = await getGitHubContributionsForYear({ data: year })
      if (id === request.current) setCalendar(result)
    } catch {
      if (id === request.current) setError(true)
    } finally {
      if (id === request.current) setLoading(false)
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-6 lg:flex-row">
      <div className="min-w-0 flex-1" aria-busy={loading}>
        {loading ? (
          <p role="status" className="py-10 text-sm text-muted-foreground">
            Loading contributions for {selectedYear}…
          </p>
        ) : error ? (
          <div role="alert" className="py-8 text-sm text-muted-foreground">
            <p>Contributions for {selectedYear} couldn’t be loaded.</p>
            <button
              type="button"
              onClick={() => void selectYear(selectedYear)}
              className="mt-3 min-h-11 underline underline-offset-4"
            >
              Try again
            </button>
          </div>
        ) : (
          <CalendarGrid data={calendar} />
        )}
      </div>
      {data.availableYears.length > 0 && (
        <nav
          aria-label="Contribution year"
          className="flex max-h-[140px] w-36 shrink-0 [scrollbar-width:thin] flex-col gap-1 self-start overflow-y-auto overscroll-contain pr-1"
        >
          {data.availableYears.map((year) => (
            <button
              key={year}
              type="button"
              aria-pressed={selectedYear === year}
              onClick={() => void selectYear(year)}
              className="h-11 shrink-0 rounded-md px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring aria-pressed:bg-muted aria-pressed:text-foreground"
            >
              {year}
            </button>
          ))}
        </nav>
      )}
    </div>
  )
}

function CalendarGrid({ data }: { data: GitHubContributions }) {
  const total = formatCount(data.totalContributions)
  const period = data.year === null ? "in the last year" : `in ${data.year}`

  return (
    <div>
      <div className="overflow-x-auto pb-2">
        <div className="inline-block min-w-fit">
          <div
            className="mb-1 grid gap-[3px] text-[10px] text-muted-foreground"
            style={{
              gridTemplateColumns: `repeat(${data.weeks.length}, 10px)`,
            }}
            aria-hidden="true"
          >
            {monthLabels(data.weeks).map(({ month, start, span }) => (
              <span
                key={`${month}-${start}`}
                style={{ gridColumn: `${start + 1} / span ${span}` }}
              >
                {span >= 2 ? monthNames[month] : ""}
              </span>
            ))}
          </div>
          <div
            className="grid auto-cols-[10px] grid-flow-col gap-[3px]"
            role="img"
            aria-label={`${total} GitHub contributions ${period}`}
          >
            {data.weeks.map((week) => (
              <div
                key={week.contributionDays[0].date}
                className="grid grid-rows-7 gap-[3px]"
              >
                {week.contributionDays.map((day) => (
                  <span
                    key={day.date}
                    className={`size-2.5 rounded-[2px] ${levelClasses[contributionLevel(day.contributionCount)]}`}
                    style={{
                      gridRowStart: utcDate(day.date).getUTCDay() + 1,
                    }}
                    title={`${day.date}: ${day.contributionCount} contribution${day.contributionCount === 1 ? "" : "s"}`}
                    aria-hidden="true"
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <ExternalLink
          href={data.profileUrl}
          className="rounded-sm transition-[color,opacity] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:text-foreground hover:underline hover:opacity-80 motion-reduce:transition-none"
        >
          {total} GitHub contributions {period}
        </ExternalLink>
        <div
          className="flex items-center gap-1"
          aria-label="Contribution activity intensity"
        >
          <span>Less</span>
          {[0, 1, 3, 6, 9].map((count) => (
            <ContributionCell key={count} count={count} />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  )
}
