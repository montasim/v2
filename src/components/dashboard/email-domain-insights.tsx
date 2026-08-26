import { useEffect, useRef, useState } from "react"
import { Label as RechartsLabel, Pie, PieChart } from "recharts"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { ChartConfig } from "@/components/ui/chart"
import { FunnelSimpleIcon, SearchIcon, XIcon } from "@/components/ui/icons"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EMAIL_DOMAIN_ALL } from "@/features/owner-dashboard/domain/email-domain-filters"
import { cn } from "@/lib/utils"

export type EmailDomainFacet = {
  key: string
  label: string
  count: number
}

export type EmailDomainInsightKind = "comments" | "subscribers"

type EmailDomainFilterValue = {
  query: string
  domain: string
}

const FEATURED_DOMAIN_COUNT = 5
const domainChartThemes = [
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
    light: "#aa7c38",
    dark: "#9a8065",
    swatch: "bg-[#aa7c38] dark:bg-[#9a8065]",
  },
  {
    light: "var(--chart-1)",
    dark: "var(--chart-5)",
    swatch: "bg-chart-1 dark:bg-chart-5",
  },
] as const

const copy = {
  comments: {
    chartTitle: "Commenter domains",
    chartDescription: "Email domains across all blog comments.",
    singular: "comment",
    plural: "comments",
    searchLabel: "Search comments",
    searchPlaceholder: "Search authors, emails, comments, or articles",
    emptyTitle: "No matching comments",
    emptyDescription:
      "Try a broader search or choose a different email domain.",
  },
  subscribers: {
    chartTitle: "Subscriber domains",
    chartDescription: "Email domains across all newsletter subscribers.",
    singular: "subscriber",
    plural: "subscribers",
    searchLabel: "Search subscribers",
    searchPlaceholder: "Search emails, domains, or delivery states",
    emptyTitle: "No matching subscribers",
    emptyDescription:
      "Try a broader search or choose a different email domain.",
  },
} as const

function paletteAt(index: number) {
  return domainChartThemes[index % domainChartThemes.length]
}

function domainSlices(domains: EmailDomainFacet[]) {
  const featured = domains.slice(0, FEATURED_DOMAIN_COUNT)
  const remaining = domains.slice(FEATURED_DOMAIN_COUNT)

  return [
    ...featured,
    ...(remaining.length
      ? [
          {
            key: "__other_domains__",
            label: "Other domains",
            count: remaining.reduce((sum, domain) => sum + domain.count, 0),
            detail: `${remaining.length} ${remaining.length === 1 ? "domain" : "domains"}`,
          },
        ]
      : []),
  ].map((domain, index) => ({
    ...domain,
    chartKey: `domain-${index}`,
    themeIndex: index,
  }))
}

export function EmailDomainDistribution({
  domains,
  kind,
  total,
}: {
  domains: EmailDomainFacet[]
  kind: EmailDomainInsightKind
  total: number
}) {
  const labels = copy[kind]
  const slices = domainSlices(domains)
  const chartData = slices.map((slice) => ({
    ...slice,
    fill: `var(--color-${slice.chartKey})`,
  }))
  const chartConfig = Object.fromEntries(
    slices.map((slice) => [
      slice.chartKey,
      {
        label: slice.label,
        theme: {
          light: paletteAt(slice.themeIndex).light,
          dark: paletteAt(slice.themeIndex).dark,
        },
      },
    ])
  ) as ChartConfig

  return (
    <section aria-labelledby={`${kind}-domain-distribution-heading`}>
      <div className="mb-3">
        <h2
          id={`${kind}-domain-distribution-heading`}
          className="text-sm font-semibold text-strong-foreground"
        >
          {labels.chartTitle}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {labels.chartDescription}
        </p>
      </div>

      <Card className="bg-background p-5 sm:p-6">
        <div className="grid items-center gap-6 lg:grid-cols-[minmax(15rem,0.8fr)_minmax(0,1.2fr)] lg:gap-10">
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square h-60 w-full max-w-72"
            initialDimension={{ width: 288, height: 240 }}
            role="img"
            aria-label={`Donut chart of ${total} ${labels.plural}: ${slices
              .map((slice) => `${slice.label}, ${slice.count}`)
              .join("; ")}`}
          >
            <PieChart accessibilityLayer>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel nameKey="chartKey" />}
              />
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="chartKey"
                innerRadius={72}
                outerRadius={108}
                paddingAngle={1.5}
                cornerRadius={2}
                stroke="var(--background)"
                strokeWidth={2}
                isAnimationActive={false}
              >
                <RechartsLabel
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
                          {total === 1 ? labels.singular : labels.plural}
                        </tspan>
                      </text>
                    )
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>

          <ul
            className="grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"
            aria-label={`${labels.chartTitle} legend`}
          >
            {slices.map((slice) => {
              const share = total ? Math.round((slice.count / total) * 100) : 0

              return (
                <li
                  key={slice.chartKey}
                  className="flex min-h-11 items-center gap-3 border-b border-border/70 py-2 last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0 lg:[&:nth-last-child(-n+2)]:border-b xl:[&:nth-last-child(-n+2)]:border-b-0"
                >
                  <span
                    className={cn(
                      "size-2.5 shrink-0 rounded-sm",
                      paletteAt(slice.themeIndex).swatch
                    )}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-xs font-medium text-strong-foreground"
                      title={slice.label}
                    >
                      {slice.label}
                    </span>
                    {"detail" in slice && slice.detail ? (
                      <span className="mt-0.5 block text-[0.625rem] text-muted-foreground">
                        {slice.detail}
                      </span>
                    ) : null}
                  </span>
                  <span className="shrink-0 text-right">
                    <strong className="block font-mono text-xs tabular-nums">
                      {slice.count}
                    </strong>
                    <span className="mt-0.5 block text-[0.625rem] text-muted-foreground tabular-nums">
                      {share}%
                    </span>
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      </Card>
    </section>
  )
}

function domainSelectLabel(domain: string, domains: EmailDomainFacet[]) {
  const total = domains.reduce((sum, item) => sum + item.count, 0)
  if (domain === EMAIL_DOMAIN_ALL) return `All domains (${total})`
  const selected = domains.find((item) => item.key === domain)
  return `${selected?.label ?? domain} (${selected?.count ?? 0})`
}

export function EmailDomainFilters({
  domain,
  domains,
  kind,
  onChange,
  query,
  resultTotal,
}: {
  domain: string
  domains: EmailDomainFacet[]
  kind: EmailDomainInsightKind
  onChange: (value: EmailDomainFilterValue) => void
  query: string
  resultTotal: number
}) {
  const labels = copy[kind]
  const [draftQuery, setDraftQuery] = useState(query)
  const [draftDomain, setDraftDomain] = useState(domain)
  const onChangeRef = useRef(onChange)
  const submittedQueryRef = useRef(query)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    setDraftQuery(query)
    submittedQueryRef.current = query
  }, [query])

  useEffect(() => {
    setDraftDomain(domain)
  }, [domain])

  useEffect(() => {
    const normalizedQuery = draftQuery.trim()
    if (normalizedQuery === submittedQueryRef.current) return

    const timeout = window.setTimeout(() => {
      submittedQueryRef.current = normalizedQuery
      onChangeRef.current({ query: normalizedQuery, domain: draftDomain })
    }, 300)

    return () => window.clearTimeout(timeout)
  }, [draftDomain, draftQuery])

  function updateDomain(value: string) {
    setDraftDomain(value)
    const normalizedQuery = draftQuery.trim()
    submittedQueryRef.current = normalizedQuery
    onChangeRef.current({ query: normalizedQuery, domain: value })
  }

  function clearSearch() {
    setDraftQuery("")
    submittedQueryRef.current = ""
    onChangeRef.current({ query: "", domain: draftDomain })
  }

  return (
    <section aria-label={`Filter ${labels.plural}`}>
      <p className="sr-only" aria-live="polite">
        {resultTotal} matching{" "}
        {resultTotal === 1 ? labels.singular : labels.plural}
      </p>
      <Card className="grid gap-3 bg-background p-4 sm:grid-cols-[minmax(0,1fr)_minmax(13rem,0.38fr)] sm:p-5">
        <div className="min-w-0">
          <Label
            htmlFor={`${kind}-search`}
            className="mb-2 block text-xs font-medium text-strong-foreground"
          >
            {labels.searchLabel}
          </Label>
          <span className="relative block">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id={`${kind}-search`}
              type="search"
              value={draftQuery}
              onChange={(event) => setDraftQuery(event.currentTarget.value)}
              placeholder={labels.searchPlaceholder}
              className="pr-10 pl-9"
            />
            {draftQuery ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={clearSearch}
                className="absolute top-1/2 right-1.5 -translate-y-1/2 text-muted-foreground"
                aria-label={`Clear ${labels.singular} search`}
              >
                <XIcon className="size-3.5" />
              </Button>
            ) : null}
          </span>
        </div>

        <div>
          <span
            id={`${kind}-domain-filter-label`}
            className="mb-2 flex items-center gap-1.5 text-xs font-medium text-strong-foreground"
          >
            <FunnelSimpleIcon className="size-3.5" />
            Email domain
          </span>
          <Select value={draftDomain} onValueChange={updateDomain}>
            <SelectTrigger aria-labelledby={`${kind}-domain-filter-label`}>
              <SelectValue>
                {domainSelectLabel(draftDomain, domains)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent align="start">
              <SelectItem value={EMAIL_DOMAIN_ALL}>
                {domainSelectLabel(EMAIL_DOMAIN_ALL, domains)}
              </SelectItem>
              {domains.map((item) => (
                <SelectItem key={item.key} value={item.key}>
                  {item.label} ({item.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>
    </section>
  )
}

export function EmailDomainFilterEmptyState({
  kind,
  onClear,
}: {
  kind: EmailDomainInsightKind
  onClear: () => void
}) {
  const labels = copy[kind]

  return (
    <Card
      asChild
      className="grid min-h-64 place-items-center bg-background px-6 py-12 text-center"
    >
      <section>
        <div className="max-w-sm">
          <SearchIcon className="mx-auto size-6 text-muted-foreground" />
          <h2 className="mt-4 text-sm font-semibold text-strong-foreground">
            {labels.emptyTitle}
          </h2>
          <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
            {labels.emptyDescription}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={onClear}
          >
            Clear filters
          </Button>
        </div>
      </section>
    </Card>
  )
}
