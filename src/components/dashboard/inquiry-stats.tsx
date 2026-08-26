import type { CSSProperties } from "react"

import type { InquiryStat } from "@/features/owner-dashboard/infrastructure/dashboard.server"

type ColorToken = { solid: string; soft: string }

const categoricalPalette = [
  { solid: "#4f5f5a", soft: "#4f5f5a1f" },
  { solid: "#6b6673", soft: "#6b66731f" },
  { solid: "#8a704f", soft: "#8a704f1f" },
  { solid: "#68727a", soft: "#68727a1f" },
  { solid: "#74746d", soft: "#74746d1f" },
] as const

const roleColors: Record<string, ColorToken> = {
  "Senior Frontend Engineer": categoricalPalette[0],
  "Senior Full-Stack Engineer": categoricalPalette[1],
  "Technical Lead": categoricalPalette[2],
  "Another role": categoricalPalette[3],
  "Not specified": categoricalPalette[4],
}

const arrangementColors: Record<string, ColorToken> = {
  Remote: categoricalPalette[0],
  Hybrid: categoricalPalette[1],
  "On-site": categoricalPalette[2],
  Flexible: categoricalPalette[3],
  "Not specified": categoricalPalette[4],
}

function fallbackColor(label: string) {
  const index = [...label].reduce(
    (total, character) => total + character.codePointAt(0)!,
    0
  )
  return categoricalPalette[index % categoricalPalette.length]
}

function roleColor(label: string) {
  return roleColors[label] ?? fallbackColor(label)
}

function arrangementColor(label: string) {
  return arrangementColors[label] ?? fallbackColor(label)
}

function totalOf(data: InquiryStat[]) {
  return data.reduce((total, item) => total + item.count, 0)
}

function percentage(count: number, total: number) {
  return total ? Math.round((count / total) * 100) : 0
}

function EmptyState() {
  return (
    <div className="grid min-h-52 place-items-center rounded-lg border border-dashed bg-muted/15 px-6 text-center">
      <div>
        <p className="text-sm font-medium text-strong-foreground">
          No hiring signals yet
        </p>
        <p className="mt-1 max-w-64 text-xs leading-5 text-muted-foreground">
          Role and work-setup patterns will appear after the first role inquiry.
        </p>
      </div>
    </div>
  )
}

function RoleRanking({ data }: { data: InquiryStat[] }) {
  const total = totalOf(data)
  const maximum = Math.max(...data.map((item) => item.count), 1)

  return (
    <figure aria-labelledby="role-demand-title">
      <figcaption className="mb-5">
        <h3 id="role-demand-title" className="text-sm font-semibold">
          Role demand
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Ranked by inquiries received
        </p>
      </figcaption>

      <div
        className="space-y-4"
        role="img"
        aria-label={`Ranked bar chart of ${total} role inquiries: ${data
          .map((item) => `${item.label}, ${item.count}`)
          .join("; ")}`}
      >
        {data.map((item, index) => {
          const color = roleColor(item.label)
          const share = percentage(item.count, total)
          const width = (item.count / maximum) * 100

          return (
            <div
              key={item.label}
              className="grid grid-cols-[1.75rem_minmax(0,1fr)_auto] items-center gap-x-3"
            >
              <span className="font-mono text-[0.6875rem] text-muted-foreground tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className="size-2 shrink-0 rounded-sm"
                    style={{ backgroundColor: color.solid }}
                    aria-hidden="true"
                  />
                  <span className="truncate text-xs font-medium text-strong-foreground">
                    {item.label}
                  </span>
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full"
                  style={{ backgroundColor: color.soft }}
                >
                  <div
                    className="h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none"
                    style={{
                      backgroundColor: color.solid,
                      width: `${width}%`,
                    }}
                  />
                </div>
              </div>
              <span className="min-w-14 text-right">
                <strong className="block font-mono text-xs tabular-nums">
                  {item.count}
                </strong>
                <span className="mt-0.5 block text-[0.625rem] text-muted-foreground tabular-nums">
                  {share}%
                </span>
              </span>
            </div>
          )
        })}
      </div>
    </figure>
  )
}

function ArrangementDistribution({ data }: { data: InquiryStat[] }) {
  const total = totalOf(data)
  const activeData = data.filter((item) => item.count > 0)

  return (
    <figure aria-labelledby="arrangement-title">
      <figcaption className="mb-5">
        <h3 id="arrangement-title" className="text-sm font-semibold">
          Work setup
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Share of role inquiries
        </p>
      </figcaption>

      <div
        className="flex h-5 gap-0.5 overflow-hidden rounded-md bg-muted/60 p-0.5"
        role="img"
        aria-label={`Segmented chart of ${total} arrangement preferences: ${data
          .map((item) => `${item.label}, ${item.count}`)
          .join("; ")}`}
      >
        {activeData.map((item) => (
          <div
            key={item.label}
            className="h-full min-w-1 first:rounded-l last:rounded-r"
            style={
              {
                backgroundColor: arrangementColor(item.label).solid,
                width: `${percentage(item.count, total)}%`,
              } satisfies CSSProperties
            }
          />
        ))}
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {data.map((item) => {
          const color = arrangementColor(item.label)
          return (
            <div
              key={item.label}
              className="flex items-center gap-3 rounded-lg border bg-muted/10 px-3 py-2.5"
            >
              <span
                className="h-8 w-1 shrink-0 rounded-full"
                style={{ backgroundColor: color.solid }}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium text-strong-foreground">
                  {item.label}
                </span>
                <span className="mt-0.5 block text-[0.625rem] text-muted-foreground">
                  {percentage(item.count, total)}% of inquiries
                </span>
              </span>
              <strong className="font-mono text-sm tabular-nums">
                {item.count}
              </strong>
            </div>
          )
        })}
      </div>
    </figure>
  )
}

export function InquiryStats({
  roles,
  arrangements,
}: {
  roles: InquiryStat[]
  arrangements: InquiryStat[]
}) {
  const total = totalOf(roles)

  return (
    <section aria-labelledby="inquiry-stats-heading">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <h2
            id="inquiry-stats-heading"
            className="text-sm font-semibold text-strong-foreground"
          >
            Hiring signals
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Role demand and preferred work setup across all inquiries.
          </p>
        </div>
        <span className="shrink-0 rounded-full border bg-background px-2.5 py-1 font-mono text-xs font-semibold tabular-nums">
          {total} {total === 1 ? "inquiry" : "inquiries"}
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border bg-background">
        {!total ? (
          <div className="p-5 sm:p-6">
            <EmptyState />
          </div>
        ) : (
          <div className="grid xl:grid-cols-2 xl:divide-x">
            <div className="p-5 sm:p-6 xl:p-7">
              <RoleRanking data={roles} />
            </div>
            <div className="border-t p-5 sm:p-6 xl:border-t-0 xl:p-7">
              <ArrangementDistribution data={arrangements} />
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
