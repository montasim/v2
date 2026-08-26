import { Label, Pie, PieChart } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { ChartConfig } from "@/components/ui/chart"
import { Card } from "@/components/ui/card"
import type { InquiryStat } from "@/features/owner-dashboard/infrastructure/dashboard.server"
import { cn } from "@/lib/utils"

const hiringChartThemes = [
  {
    light: "var(--chart-5)",
    dark: "var(--chart-1)",
    swatch: "bg-chart-5 dark:bg-chart-1",
  },
  {
    light: "var(--chart-4)",
    dark: "var(--chart-2)",
    swatch: "bg-chart-4 dark:bg-chart-2",
  },
  {
    light: "var(--chart-3)",
    dark: "var(--chart-3)",
    swatch: "bg-chart-3",
  },
  {
    light: "var(--chart-2)",
    dark: "var(--chart-4)",
    swatch: "bg-chart-2 dark:bg-chart-4",
  },
  {
    light: "var(--chart-1)",
    dark: "var(--chart-5)",
    swatch: "bg-chart-1 dark:bg-chart-5",
  },
] as const

function paletteAt(index: number) {
  return hiringChartThemes[index % hiringChartThemes.length]
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

function DistributionLegend({
  data,
  description,
  title,
}: {
  data: InquiryStat[]
  description: string
  title: string
}) {
  const total = totalOf(data)
  const legendId = `inquiry-${title.toLowerCase().replaceAll(" ", "-")}`

  return (
    <section aria-labelledby={legendId}>
      <div className="mb-2">
        <h3
          id={legendId}
          className="text-xs font-semibold text-strong-foreground"
        >
          {title}
        </h3>
        <p className="mt-1 text-[0.6875rem] text-muted-foreground">
          {description}
        </p>
      </div>

      <ul
        className="grid gap-x-6 sm:grid-cols-2"
        aria-label={`${title} legend`}
      >
        {data.map((item, index) => (
          <li
            key={item.label}
            className="flex min-h-11 items-center gap-3 border-b border-border/70 py-2 last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0"
          >
            <span
              className={cn(
                "size-2.5 shrink-0 rounded-sm",
                paletteAt(index).swatch
              )}
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1 truncate text-xs font-medium text-strong-foreground">
              {item.label}
            </span>
            <span className="shrink-0 text-right">
              <strong className="block font-mono text-xs tabular-nums">
                {item.count}
              </strong>
              <span className="mt-0.5 block text-[0.625rem] text-muted-foreground tabular-nums">
                {percentage(item.count, total)}%
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function HiringSignalChart({
  arrangements,
  roles,
}: {
  arrangements: InquiryStat[]
  roles: InquiryStat[]
}) {
  const total = totalOf(roles)
  const activeRoles = roles.filter((item) => item.count > 0)
  const chartData = roles
    .map((item, index) => ({
      count: item.count,
      fill: `var(--color-role-${index})`,
      key: `role-${index}`,
      label: item.label,
    }))
    .filter((item) => item.count > 0)
  const chartConfig = Object.fromEntries(
    roles.map((item, index) => [
      `role-${index}`,
      {
        label: item.label,
        theme: {
          light: paletteAt(index).light,
          dark: paletteAt(index).dark,
        },
      },
    ])
  ) as ChartConfig

  return (
    <div className="grid items-center gap-8 lg:grid-cols-[minmax(15rem,0.8fr)_minmax(0,1.2fr)] lg:gap-10">
      <ChartContainer
        config={chartConfig}
        className="mx-auto aspect-square h-60 w-full max-w-72"
        initialDimension={{ width: 288, height: 240 }}
        role="img"
        aria-label={`Donut chart of ${total} role inquiries: ${activeRoles
          .map((item) => `${item.label}, ${item.count}`)
          .join("; ")}`}
      >
        <PieChart accessibilityLayer>
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel nameKey="key" />}
          />
          <Pie
            data={chartData}
            dataKey="count"
            nameKey="key"
            innerRadius={72}
            outerRadius={108}
            paddingAngle={1.5}
            cornerRadius={2}
            stroke="var(--background)"
            strokeWidth={2}
            isAnimationActive={false}
          >
            <Label
              content={({ viewBox }) => {
                if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) {
                  return null
                }

                return (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x={viewBox.cx}
                      y={viewBox.cy}
                      className="fill-strong-foreground text-3xl font-semibold tabular-nums"
                    >
                      {total}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={viewBox.cy + 22}
                      className="fill-muted-foreground text-[0.6875rem]"
                    >
                      {total === 1 ? "inquiry" : "inquiries"}
                    </tspan>
                  </text>
                )
              }}
            />
          </Pie>
        </PieChart>
      </ChartContainer>

      <div className="grid gap-6">
        <DistributionLegend
          data={roles}
          title="Role demand"
          description="Share of role inquiries"
        />
        <div className="border-t border-border/70 pt-6">
          <DistributionLegend
            data={arrangements}
            title="Work setup"
            description="Preferred arrangement across role inquiries"
          />
        </div>
      </div>
    </div>
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
      <div className="mb-3">
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

      <Card className="bg-background p-5 sm:p-6">
        {total ? (
          <HiringSignalChart roles={roles} arrangements={arrangements} />
        ) : (
          <EmptyState />
        )}
      </Card>
    </section>
  )
}
