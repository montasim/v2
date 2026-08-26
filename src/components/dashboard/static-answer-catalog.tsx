import { useEffect, useMemo, useRef, useState } from "react"
import { Label, Pie, PieChart } from "recharts"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { ChartConfig } from "@/components/ui/chart"
import {
  ArrowLeftCompactIcon,
  ArrowLeftDoubleIcon,
  ArrowRightCompactIcon,
  ArrowRightDoubleIcon,
  FunnelSimpleIcon,
  SearchIcon,
  XIcon,
} from "@/components/ui/icons"
import type { OwnerStaticAnswerCatalog } from "@/features/owner-dashboard/infrastructure/static-answers.server"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 12
const ALL_CATEGORIES = "all"
const FEATURED_CATEGORY_COUNT = 5

const coverageChartThemes = [
  { light: "var(--chart-5)", dark: "var(--chart-1)" },
  { light: "var(--chart-4)", dark: "var(--chart-2)" },
  { light: "var(--chart-3)", dark: "var(--chart-3)" },
  { light: "var(--chart-2)", dark: "var(--chart-4)" },
  { light: "#aa7c38", dark: "#9a8065" },
  { light: "var(--chart-1)", dark: "var(--chart-5)" },
] as const

const categoryLabels: Readonly<Record<string, string>> = {
  project: "Projects",
  "case-study": "Case studies",
  blog: "Articles",
  certification: "Credentials",
  experience: "Experience",
  skill: "Skills",
  recommendation: "Recommendations",
  affiliation: "Education & affiliations",
  "identity-current-availability": "Identity & availability",
  "career-impact-metrics": "Career impact",
  "hiring-fit-due-diligence": "Hiring fit",
  "leadership-collaboration": "Leadership & collaboration",
  "technical-depth": "Technical depth",
  "catalog-chronology-comparison": "Catalog & chronology",
  "client-delivery-product-thinking": "Client delivery",
  "contributions-learning": "Contributions & learning",
}

type StaticAnswerRecord = OwnerStaticAnswerCatalog["records"][number]

export function StaticAnswerCatalog({
  catalog,
}: {
  catalog: OwnerStaticAnswerCatalog
}) {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState(ALL_CATEGORIES)
  const [requestedPage, setRequestedPage] = useState(1)
  const resultsListRef = useRef<HTMLOListElement>(null)
  const restoreResultsFocus = useRef(false)

  const categories = useMemo(() => categorySummary(catalog.records), [catalog])
  const rankedCategories = useMemo(
    () =>
      [...categories].sort(
        (first, second) =>
          second.count - first.count || first.label.localeCompare(second.label)
      ),
    [categories]
  )
  const selectedCategory = categories.find((item) => item.category === category)
  const selectedCategoryLabel =
    category === ALL_CATEGORIES
      ? `All categories (${catalog.records.length})`
      : `${selectedCategory?.label ?? categoryLabel(category)} (${selectedCategory?.count ?? 0})`
  const filtered = useMemo(
    () => filterStaticAnswers(catalog.records, query, category),
    [catalog, category, query]
  )
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const page = Math.min(requestedPage, pageCount)
  const visibleRecords = filtered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  )

  useEffect(() => {
    if (!restoreResultsFocus.current) return
    restoreResultsFocus.current = false

    const list = resultsListRef.current
    list?.focus({ preventScroll: true })
    if (list && typeof list.scrollIntoView === "function") {
      list.scrollIntoView({ block: "start" })
    }
  }, [page])

  function updateQuery(value: string) {
    setQuery(value)
    setRequestedPage(1)
  }

  function updateCategory(value: string) {
    setCategory(value)
    setRequestedPage(1)
  }

  function clearFilters() {
    setQuery("")
    setCategory(ALL_CATEGORIES)
    setRequestedPage(1)
  }

  function changePage(nextPage: number) {
    if (nextPage === page) return
    restoreResultsFocus.current = true
    setRequestedPage(nextPage)
  }

  return (
    <div className="space-y-6">
      <AnswerDistribution
        categories={rankedCategories}
        knowledgeHash={catalog.knowledgeHash}
        total={catalog.records.length}
      />

      <section aria-label="Filter static answers">
        <div className="grid gap-3 rounded-xl border bg-background p-4 sm:grid-cols-[minmax(0,1fr)_minmax(13rem,0.38fr)] sm:p-5">
          <label className="min-w-0">
            <span className="mb-2 block text-xs font-medium text-strong-foreground">
              Search catalog
            </span>
            <span className="relative block">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={query}
                onChange={(event) => updateQuery(event.currentTarget.value)}
                placeholder="Search questions, answers, or record IDs"
                className="h-10 w-full rounded-lg border bg-background pr-10 pl-9 text-sm text-strong-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => updateQuery("")}
                  className="absolute top-1/2 right-1.5 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Clear search"
                >
                  <XIcon className="size-3.5" />
                </button>
              ) : null}
            </span>
          </label>

          <div>
            <span
              id="static-answer-category-label"
              className="mb-2 flex items-center gap-1.5 text-xs font-medium text-strong-foreground"
            >
              <FunnelSimpleIcon className="size-3.5" />
              Category
            </span>
            <Select value={category} onValueChange={updateCategory}>
              <SelectTrigger aria-labelledby="static-answer-category-label">
                <SelectValue>{selectedCategoryLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent align="start">
                <SelectItem value={ALL_CATEGORIES}>
                  All categories ({catalog.records.length})
                </SelectItem>
                {categories.map((item) => (
                  <SelectItem key={item.category} value={item.category}>
                    {item.label} ({item.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section id="static-answer-results" className="space-y-4">
        <p className="sr-only" aria-live="polite">
          {resultSummary(filtered.length, catalog.records.length, category)}
        </p>

        {visibleRecords.length ? (
          <ol
            ref={resultsListRef}
            aria-label="Questions and answers"
            className="scroll-mt-24 space-y-4 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
            start={(page - 1) * PAGE_SIZE + 1}
            tabIndex={-1}
          >
            {visibleRecords.map((record, index) => (
              <StaticAnswer
                key={record.id}
                record={record}
                number={(page - 1) * PAGE_SIZE + index + 1}
              />
            ))}
          </ol>
        ) : (
          <div className="grid min-h-64 place-items-center rounded-xl border bg-background px-6 py-12 text-center">
            <div className="max-w-sm">
              <SearchIcon className="mx-auto size-6 text-muted-foreground" />
              <h2 className="mt-4 text-sm font-semibold text-strong-foreground">
                No matching answers
              </h2>
              <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                Try a broader search or choose a different category.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={clearFilters}
              >
                Clear filters
              </Button>
            </div>
          </div>
        )}
      </section>

      {visibleRecords.length ? (
        <CatalogPagination
          page={page}
          pageCount={pageCount}
          total={filtered.length}
          onPageChange={changePage}
        />
      ) : null}
    </div>
  )
}

function AnswerDistribution({
  categories,
  knowledgeHash,
  total,
}: {
  categories: ReturnType<typeof categorySummary>
  knowledgeHash: string
  total: number
}) {
  const featured = categories.slice(0, FEATURED_CATEGORY_COUNT)
  const remaining = categories.slice(FEATURED_CATEGORY_COUNT)
  const remainingCount = remaining.reduce(
    (sum, category) => sum + category.count,
    0
  )
  const slices = [
    ...featured.map((item) => ({
      key: item.category,
      label: item.label,
      count: item.count,
      detail: undefined,
    })),
    ...(remaining.length
      ? [
          {
            key: "other",
            label: "Other categories",
            count: remainingCount,
            detail: `${remaining.length} categories`,
          },
        ]
      : []),
  ]
  const chartData = slices.map((slice) => ({
    ...slice,
    fill: `var(--color-${slice.key})`,
  }))
  const chartConfig = Object.fromEntries(
    slices.map((slice, index) => [
      slice.key,
      {
        label: slice.label,
        theme:
          coverageChartThemes[index] ??
          coverageChartThemes[coverageChartThemes.length - 1],
      },
    ])
  ) as ChartConfig

  return (
    <section aria-labelledby="catalog-coverage-heading">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <h2
            id="catalog-coverage-heading"
            className="text-sm font-semibold text-strong-foreground"
          >
            Catalog coverage
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Top answer categories and the remaining catalog.
          </p>
        </div>
        <div className="flex max-w-full flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">
          <Badge variant="secondary">Read only</Badge>
          <code
            className="max-w-full truncate text-[0.6875rem] text-muted-foreground"
            title={knowledgeHash}
          >
            Knowledge {knowledgeHash.slice(0, 12)}
          </code>
        </div>
      </div>

      <div className="rounded-xl border bg-background p-5 sm:p-6">
        {categories.length ? (
          <div className="grid items-center gap-6 lg:grid-cols-[minmax(15rem,0.8fr)_minmax(0,1.2fr)] lg:gap-10">
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square h-60 w-full max-w-72"
              initialDimension={{ width: 288, height: 240 }}
              role="img"
              aria-label={`Donut chart of ${total} static answers: ${slices
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
                      if (
                        !viewBox ||
                        !("cx" in viewBox) ||
                        !("cy" in viewBox)
                      ) {
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
                            {total === 1 ? "answer" : "answers"}
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
              aria-label="Catalog coverage legend"
            >
              {chartData.map((item) => {
                const share = total ? Math.round((item.count / total) * 100) : 0

                return (
                  <li
                    key={item.key}
                    className="flex min-h-11 items-center gap-3 border-b border-border/70 py-2 last:border-b-0 lg:last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0 lg:[&:nth-last-child(-n+2)]:border-b xl:[&:nth-last-child(-n+2)]:border-b-0"
                  >
                    <span
                      className="size-2.5 shrink-0 rounded-sm"
                      style={{ backgroundColor: item.fill }}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium text-strong-foreground">
                        {item.label}
                      </span>
                      {item.detail ? (
                        <span className="mt-0.5 block text-[0.625rem] text-muted-foreground">
                          {item.detail}
                        </span>
                      ) : null}
                    </span>
                    <span className="shrink-0 text-right">
                      <strong className="block font-mono text-xs tabular-nums">
                        {item.count}
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
        ) : (
          <div className="grid min-h-40 place-items-center rounded-lg border border-dashed bg-muted/15 px-6 text-center">
            <div>
              <p className="text-sm font-medium text-strong-foreground">
                No catalog coverage yet
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Category distribution will appear when answers are compiled.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function StaticAnswer({
  number,
  record,
}: {
  number: number
  record: StaticAnswerRecord
}) {
  return (
    <li className="rounded-xl border bg-background px-5 py-5 sm:px-6 sm:py-6">
      <article aria-labelledby={`static-answer-${number}`}>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{categoryLabel(record.category)}</Badge>
          <span className="text-[0.6875rem] text-muted-foreground tabular-nums">
            #{String(number).padStart(3, "0")}
          </span>
          <code
            className="w-full min-w-0 pt-1 text-[0.6875rem] break-all text-muted-foreground sm:ml-auto sm:w-auto sm:max-w-80 sm:truncate sm:pt-0"
            title={record.id}
          >
            {record.id}
          </code>
        </div>

        <h3
          id={`static-answer-${number}`}
          className="mt-4 max-w-3xl text-[0.9375rem] leading-6 font-semibold text-strong-foreground"
        >
          {record.question}
        </h3>
        <p className="mt-3 w-full max-w-none text-sm leading-6 whitespace-pre-wrap text-muted-foreground">
          {record.text}
        </p>

        <footer className="mt-4 flex items-center gap-2 border-t pt-3 text-[0.6875rem] text-muted-foreground">
          <span className="font-medium text-strong-foreground">Answer</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">
            {record.evidenceCount}{" "}
            {record.evidenceCount === 1
              ? "evidence reference"
              : "evidence references"}
          </span>
        </footer>
      </article>
    </li>
  )
}

function CatalogPagination({
  onPageChange,
  page,
  pageCount,
  total,
}: {
  onPageChange: (page: number) => void
  page: number
  pageCount: number
  total: number
}) {
  const first = (page - 1) * PAGE_SIZE + 1
  const last = Math.min(page * PAGE_SIZE, total)
  const pages = paginationItems(page, pageCount)

  return (
    <nav
      className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center"
      aria-label="Static answers pagination"
    >
      <p className="text-xs text-muted-foreground" aria-live="polite">
        Showing{" "}
        <span className="font-medium text-strong-foreground tabular-nums">
          {first}–{last}
        </span>{" "}
        of{" "}
        <span className="font-medium text-strong-foreground tabular-nums">
          {total}
        </span>{" "}
        answers
      </p>

      {pageCount > 1 ? (
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:ml-auto sm:pb-0">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-11 sm:size-8"
            disabled={page === 1}
            onClick={() => onPageChange(1)}
            aria-label="First answers page"
          >
            <ArrowLeftDoubleIcon />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-11 sm:size-8"
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Previous answers page"
          >
            <ArrowLeftCompactIcon />
          </Button>

          {pages.map((item, index) =>
            item === "ellipsis" ? (
              <span
                key={`ellipsis-${index}`}
                className="flex size-7 shrink-0 items-center justify-center text-xs text-muted-foreground"
                aria-hidden="true"
              >
                …
              </span>
            ) : (
              <Button
                key={item}
                type="button"
                variant={item === page ? "default" : "ghost"}
                size="icon"
                className={cn(
                  "size-11 shrink-0 text-xs tabular-nums sm:size-8",
                  item === page &&
                    "bg-emphasis-foreground text-background hover:bg-emphasis-foreground/85"
                )}
                onClick={() => onPageChange(item)}
                aria-label={`Page ${item}`}
                aria-current={item === page ? "page" : undefined}
              >
                {item}
              </Button>
            )
          )}

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-11 sm:size-8"
            disabled={page === pageCount}
            onClick={() => onPageChange(page + 1)}
            aria-label="Next answers page"
          >
            <ArrowRightCompactIcon />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-11 sm:size-8"
            disabled={page === pageCount}
            onClick={() => onPageChange(pageCount)}
            aria-label="Last answers page"
          >
            <ArrowRightDoubleIcon />
          </Button>
        </div>
      ) : null}
    </nav>
  )
}

function categorySummary(records: readonly StaticAnswerRecord[]) {
  const counts = new Map<string, number>()
  for (const record of records) {
    counts.set(record.category, (counts.get(record.category) ?? 0) + 1)
  }
  return Array.from(counts, ([category, count]) => ({
    category,
    count,
    label: categoryLabel(category),
  }))
}

function categoryLabel(category: string) {
  return categoryLabels[category] ?? category.replaceAll("-", " ")
}

export function filterStaticAnswers(
  records: readonly StaticAnswerRecord[],
  query: string,
  category: string
) {
  const search = query.trim().toLocaleLowerCase("en-US")
  return records.filter((record) => {
    if (category !== ALL_CATEGORIES && record.category !== category) {
      return false
    }
    if (!search) return true
    return [
      record.id,
      record.question,
      record.text,
      categoryLabel(record.category),
    ]
      .join(" ")
      .toLocaleLowerCase("en-US")
      .includes(search)
  })
}

function resultSummary(matches: number, total: number, category: string) {
  if (matches === total)
    return `${total} exact-match answers across all categories.`
  const scope =
    category === ALL_CATEGORIES
      ? "the complete catalog"
      : categoryLabel(category)
  return `${matches} matching ${matches === 1 ? "answer" : "answers"} in ${scope}.`
}

function paginationItems(page: number, pageCount: number) {
  if (pageCount <= 5) {
    return Array.from({ length: pageCount }, (_, index) => index + 1)
  }
  const items: Array<number | "ellipsis"> = [1]
  const start = Math.max(2, page - 1)
  const end = Math.min(pageCount - 1, page + 1)
  if (start > 2) items.push("ellipsis")
  for (let value = start; value <= end; value += 1) items.push(value)
  if (end < pageCount - 1) items.push("ellipsis")
  items.push(pageCount)
  return items
}
