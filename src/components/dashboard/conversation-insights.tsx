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
import {
  CONVERSATION_MODEL_ALL,
  CONVERSATION_MODEL_NON_MODEL,
} from "@/features/owner-dashboard/domain/conversation-filters"
import { cn } from "@/lib/utils"

export type ConversationModelFacet = {
  key: string
  label: string
  count: number
}

type ConversationFilterValue = {
  query: string
  model: string
}

const FEATURED_MODEL_COUNT = 5
const modelChartThemes = [
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

function paletteAt(index: number) {
  return modelChartThemes[index % modelChartThemes.length]
}

function modelUsageSlices(models: ConversationModelFacet[]) {
  const nonModel = models.find(
    (model) => model.key === CONVERSATION_MODEL_NON_MODEL
  )
  const modelResponses = models.filter(
    (model) => model.key !== CONVERSATION_MODEL_NON_MODEL
  )
  const featured = modelResponses.slice(0, FEATURED_MODEL_COUNT)
  const remaining = modelResponses.slice(FEATURED_MODEL_COUNT)

  return [
    ...featured,
    ...(remaining.length
      ? [
          {
            key: "__other_models__",
            label: "Other models",
            count: remaining.reduce((sum, model) => sum + model.count, 0),
            detail: `${remaining.length} models`,
          },
        ]
      : []),
    ...(nonModel ? [{ ...nonModel, detail: "Reviewed or handoff" }] : []),
  ].map((model, index) => ({
    ...model,
    chartKey: `model-${index}`,
    themeIndex: index,
  }))
}

export function ConversationModelUsage({
  models,
  total,
}: {
  models: ConversationModelFacet[]
  total: number
}) {
  const slices = modelUsageSlices(models)
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
    <section aria-labelledby="conversation-model-usage-heading">
      <div className="mb-3">
        <h2
          id="conversation-model-usage-heading"
          className="text-sm font-semibold text-strong-foreground"
        >
          Model usage
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Served models across saved exchanges, including non-model responses.
        </p>
      </div>

      <Card className="bg-background p-5 sm:p-6">
        <div className="grid items-center gap-6 lg:grid-cols-[minmax(15rem,0.8fr)_minmax(0,1.2fr)] lg:gap-10">
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square h-60 w-full max-w-72"
            initialDimension={{ width: 288, height: 240 }}
            role="img"
            aria-label={`Donut chart of ${total} saved exchanges: ${slices
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
                          {total === 1 ? "exchange" : "exchanges"}
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
            aria-label="Model usage legend"
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

function modelSelectLabel(model: string, models: ConversationModelFacet[]) {
  const total = models.reduce((sum, item) => sum + item.count, 0)
  if (model === CONVERSATION_MODEL_ALL) return `All responses (${total})`
  const selected = models.find((item) => item.key === model)
  return `${selected?.label ?? model} (${selected?.count ?? 0})`
}

export function ConversationFilters({
  model,
  models,
  onChange,
  query,
  resultTotal,
}: {
  model: string
  models: ConversationModelFacet[]
  onChange: (value: ConversationFilterValue) => void
  query: string
  resultTotal: number
}) {
  const [draftQuery, setDraftQuery] = useState(query)
  const [draftModel, setDraftModel] = useState(model)
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
    setDraftModel(model)
  }, [model])

  useEffect(() => {
    const normalizedQuery = draftQuery.trim()
    if (normalizedQuery === submittedQueryRef.current) return

    const timeout = window.setTimeout(() => {
      submittedQueryRef.current = normalizedQuery
      onChangeRef.current({ query: normalizedQuery, model: draftModel })
    }, 300)

    return () => window.clearTimeout(timeout)
  }, [draftModel, draftQuery])

  function updateModel(value: string) {
    setDraftModel(value)
    const normalizedQuery = draftQuery.trim()
    submittedQueryRef.current = normalizedQuery
    onChangeRef.current({ query: normalizedQuery, model: value })
  }

  function clearSearch() {
    setDraftQuery("")
    submittedQueryRef.current = ""
    onChangeRef.current({ query: "", model: draftModel })
  }

  return (
    <section aria-label="Filter conversations">
      <p className="sr-only" aria-live="polite">
        {resultTotal} matching {resultTotal === 1 ? "exchange" : "exchanges"}
      </p>
      <Card className="grid gap-3 bg-background p-4 sm:grid-cols-[minmax(0,1fr)_minmax(13rem,0.38fr)] sm:p-5">
        <div className="min-w-0">
          <Label
            htmlFor="conversation-search"
            className="mb-2 block text-xs font-medium text-strong-foreground"
          >
            Search conversations
          </Label>
          <span className="relative block">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="conversation-search"
              type="search"
              value={draftQuery}
              onChange={(event) => setDraftQuery(event.currentTarget.value)}
              placeholder="Search questions, answers, sources, or models"
              className="pr-10 pl-9"
            />
            {draftQuery ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={clearSearch}
                className="absolute top-1/2 right-1.5 -translate-y-1/2 text-muted-foreground"
                aria-label="Clear conversation search"
              >
                <XIcon className="size-3.5" />
              </Button>
            ) : null}
          </span>
        </div>

        <div>
          <span
            id="conversation-model-filter-label"
            className="mb-2 flex items-center gap-1.5 text-xs font-medium text-strong-foreground"
          >
            <FunnelSimpleIcon className="size-3.5" />
            Response model
          </span>
          <Select value={draftModel} onValueChange={updateModel}>
            <SelectTrigger aria-labelledby="conversation-model-filter-label">
              <SelectValue>{modelSelectLabel(draftModel, models)}</SelectValue>
            </SelectTrigger>
            <SelectContent align="start">
              <SelectItem value={CONVERSATION_MODEL_ALL}>
                {modelSelectLabel(CONVERSATION_MODEL_ALL, models)}
              </SelectItem>
              {models.map((item) => (
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

export function ConversationFilterEmptyState({
  onClear,
}: {
  onClear: () => void
}) {
  return (
    <Card
      asChild
      className="grid min-h-64 place-items-center bg-background px-6 py-12 text-center"
    >
      <section>
        <div className="max-w-sm">
          <SearchIcon className="mx-auto size-6 text-muted-foreground" />
          <h2 className="mt-4 text-sm font-semibold text-strong-foreground">
            No matching conversations
          </h2>
          <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
            Try a broader search or choose a different response model.
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
