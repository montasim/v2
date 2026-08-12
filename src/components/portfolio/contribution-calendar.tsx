import { contributions, socialUrl } from "@/lib/content"

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

const monthLabels = contributions.weeks.reduce<
  { month: number; start: number; span: number }[]
>((labels, week, index) => {
  const firstDay = week.contributionDays[0]
  const month = utcDate(firstDay.date).getUTCMonth()
  const current = labels.at(-1)

  if (current?.month === month) {
    current.span += 1
  } else {
    labels.push({ month, start: index, span: 1 })
  }

  return labels
}, [])

function ContributionCell({ count }: { count: number }) {
  return (
    <span
      className={`size-2.5 rounded-[2px] ${levelClasses[contributionLevel(count)]}`}
      aria-hidden="true"
    />
  )
}

export function ContributionCalendar() {
  const total = contributions.totalContributions.toLocaleString()

  return (
    <div>
      <div className="overflow-x-auto pb-2">
        <div className="inline-block min-w-fit">
          <div
            className="mb-1 grid gap-[3px] text-[10px] text-muted-foreground"
            style={{
              gridTemplateColumns: `repeat(${contributions.weeks.length}, 10px)`,
            }}
            aria-hidden="true"
          >
            {monthLabels.map(({ month, start, span }) => (
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
            {contributions.weeks.map((week) => (
              <div
                key={week.contributionDays[0].date}
                className="grid grid-rows-7 gap-[3px]"
              >
                {week.contributionDays.map((day) => (
                  <span
                    key={day.date}
                    className={`size-2.5 rounded-[2px] ${levelClasses[contributionLevel(day.contributionCount)]}`}
                    style={{ gridRowStart: utcDate(day.date).getUTCDay() + 1 }}
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
        <a
          href={socialUrl("github")}
          target="_blank"
          rel="noreferrer"
          className="rounded-sm transition-[color,opacity] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:text-foreground hover:underline hover:opacity-80 motion-reduce:transition-none"
        >
          {total} GitHub contributions in the last year
        </a>
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
