import { ExternalLink } from "@/components/shared/navigation-action"
import type {
  ContributionWeek,
  GitHubContributionStats,
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

function lastYearStats(stats: GitHubContributionStats) {
  return [
    ["Commits", stats.commits],
    ["Pull requests", stats.pullRequests],
    ["Code reviews", stats.codeReviews],
    ["Issues", stats.issues],
    ["New repositories", stats.repositoriesCreated],
    ["Private contributions", stats.privateContributions],
  ] as const
}

function allTimeSummary(stats: GitHubContributionStats) {
  return [
    `${formatCount(stats.allTimePullRequests)} pull requests (${formatCount(stats.allTimeMergedPullRequests)} merged)`,
    `${formatCount(stats.allTimeIssues)} issues`,
    `${formatCount(stats.publicRepositories)} public repositories`,
    `${formatCount(stats.followers)} followers`,
  ].join(" · ")
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
  const total = formatCount(data.totalContributions)

  return (
    <div className="space-y-5">
      {data.stats ? (
        <ul
          aria-label="Last 12 months"
          className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-3 lg:grid-cols-6"
        >
          {lastYearStats(data.stats).map(([label, value]) => (
            <li key={label} className="bg-background px-4 py-3">
              <span className="block text-lg font-semibold text-strong-foreground tabular-nums">
                {formatCount(value)}
              </span>
              <span className="block text-xs text-muted-foreground">
                {label}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

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
              aria-label={`${total} GitHub contributions in the last year`}
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
            {total} GitHub contributions in the last year
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

      {data.stats ? (
        <p className="text-xs text-muted-foreground">
          {`All time: ${allTimeSummary(data.stats)}`}
        </p>
      ) : null}

      {data.topRepositories.length ? (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground">Most active in</span>
          {data.topRepositories.map((repository) => (
            <ExternalLink
              key={repository.name}
              href={repository.url}
              aria-label={`${repository.name}, ${repository.commits} commits`}
              className="rounded-md border px-2 py-1 transition-colors hover:bg-muted hover:text-foreground motion-reduce:transition-none"
            >
              {repository.name.replace(/^montasim\//, "")}{" "}
              <span className="text-muted-foreground tabular-nums">
                {formatCount(repository.commits)}
              </span>
            </ExternalLink>
          ))}
        </div>
      ) : null}
    </div>
  )
}
