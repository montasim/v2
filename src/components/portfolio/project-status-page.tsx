import { useState } from "react"
import { Link } from "@tanstack/react-router"

import {
  ArrowRightCompactIcon,
  ArrowUpRightIcon,
  CheckCircleIcon,
  CircleDashedIcon,
  ClockIcon,
  FunnelSimpleIcon,
  SearchIcon,
  WarningCircleIcon,
} from "@/components/ui/icons"
import type { Icon } from "@/components/ui/icons"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { PageShell } from "@/components/shared/page-shell"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type {
  ProjectStatus,
  ProjectStatusSnapshot,
} from "@/features/project-status/domain/status"
import { cn } from "@/lib/utils"

type StatusFilter = "all" | "attention" | "operational" | "paused"

const statusPresentation: Record<
  ProjectStatus,
  {
    label: string
    Icon: Icon
    textClassName: string
    dotClassName: string
  }
> = {
  operational: {
    label: "Operational",
    Icon: CheckCircleIcon,
    textClassName: "text-emerald-700 dark:text-emerald-300",
    dotClassName: "bg-emerald-500",
  },
  degraded: {
    label: "Degraded",
    Icon: WarningCircleIcon,
    textClassName: "text-amber-700 dark:text-amber-300",
    dotClassName: "bg-amber-500",
  },
  down: {
    label: "Down",
    Icon: WarningCircleIcon,
    textClassName: "text-red-700 dark:text-red-300",
    dotClassName: "bg-red-500",
  },
  paused: {
    label: "Paused",
    Icon: ClockIcon,
    textClassName: "text-muted-foreground",
    dotClassName: "bg-muted-foreground",
  },
  unknown: {
    label: "Pending check",
    Icon: CircleDashedIcon,
    textClassName: "text-sky-700 dark:text-sky-300",
    dotClassName: "bg-sky-500",
  },
}

function statusCopy(snapshot: ProjectStatusSnapshot) {
  if (snapshot.source === "unconfigured") {
    return {
      title: "Live monitoring is ready to connect",
      description:
        "The status page is in place, but its read-only monitoring feed has not been configured yet.",
    }
  }

  if (snapshot.source === "unavailable") {
    return {
      title: "Live status is temporarily unavailable",
      description:
        "The monitoring provider could not be reached. Refresh this page in a few minutes to try again.",
    }
  }

  if (snapshot.summary.total === 0) {
    return {
      title: "No projects are being monitored yet",
      description:
        "Add project URLs to the monitoring account and they will appear here automatically.",
    }
  }

  const stalePrefix = snapshot.source === "stale" ? "Last confirmed: " : ""

  if (snapshot.overall === "operational") {
    return {
      title: `${stalePrefix}all monitored projects are operational`,
      description:
        "Every connected project is responding normally at the latest check.",
    }
  }

  if (snapshot.overall === "down") {
    return {
      title: `${stalePrefix}${snapshot.summary.down} ${snapshot.summary.down === 1 ? "project is" : "projects are"} down`,
      description:
        snapshot.summary.down === 1
          ? "The affected project is listed first below so it can be investigated quickly."
          : "The affected projects are listed first below so they can be investigated quickly.",
    }
  }

  if (snapshot.overall === "paused") {
    return {
      title: `${stalePrefix}some monitoring is paused`,
      description:
        "Paused checks are shown separately and do not confirm current availability.",
    }
  }

  return {
    title: `${stalePrefix}some projects need attention`,
    description:
      "One or more checks are degraded or have not completed yet. Details are listed below.",
  }
}

function emptyListCopy(source: ProjectStatusSnapshot["source"]) {
  if (source === "unconfigured") {
    return "Connect the read-only monitoring feed to publish live checks here. You can still browse every deployed project in the project catalog."
  }

  if (source === "unavailable") {
    return "The monitoring provider is not responding, so availability cannot be shown right now. You can still browse every deployed project in the project catalog."
  }

  if (source === "stale") {
    return "The last successful provider response contained no monitored projects. You can still browse every deployment in the project catalog."
  }

  return "The connected monitoring account has no project URLs yet. Add monitors in UptimeRobot and they will appear here automatically."
}

function formatCheckedAt(checkedAt: string) {
  return `${new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(checkedAt))} UTC`
}

function formatInterval(seconds: number | null) {
  if (!seconds) return "Provider schedule"
  if (seconds % 3600 === 0) return `Every ${seconds / 3600}h`
  if (seconds % 60 === 0) return `Every ${seconds / 60}m`
  return `Every ${seconds}s`
}

function matchesFilter(status: ProjectStatus, filter: StatusFilter) {
  if (filter === "all") return true
  if (filter === "attention") {
    return status === "down" || status === "degraded" || status === "unknown"
  }
  return status === filter
}

function StatusLabel({ status }: { status: ProjectStatus }) {
  const presentation = statusPresentation[status]

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold",
        presentation.textClassName
      )}
      style={{
        backgroundColor:
          "color-mix(in oklch, currentColor 10%, transparent)",
        boxShadow:
          "inset 0 0 0 1px color-mix(in oklch, currentColor 25%, transparent)",
      }}
    >
      <span
        className={cn("size-1.5 rounded-full", presentation.dotClassName)}
        aria-hidden="true"
      />
      {presentation.label}
    </span>
  )
}

function SummaryMetric({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: number
  valueClassName?: string
}) {
  return (
    <div className="p-4 sm:p-5">
      <dt className="text-[0.6875rem] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-2 text-xl font-semibold tracking-tight text-strong-foreground tabular-nums",
          valueClassName
        )}
      >
        {value}
      </dd>
    </div>
  )
}

export function ProjectStatusPage({
  description,
  snapshot,
}: {
  description: string
  snapshot: ProjectStatusSnapshot
}) {
  const [filter, setFilter] = useState<StatusFilter>("all")
  const [query, setQuery] = useState("")
  const overallPresentation = statusPresentation[snapshot.overall]
  const status = statusCopy(snapshot)
  const OverallIcon = overallPresentation.Icon
  const attentionCount =
    snapshot.summary.down +
    snapshot.summary.degraded +
    snapshot.summary.unknown
  const attentionValueClassName =
    snapshot.summary.down > 0
      ? "text-red-700 dark:text-red-300"
      : snapshot.summary.degraded > 0
        ? "text-amber-700 dark:text-amber-300"
        : snapshot.summary.unknown > 0
          ? "text-sky-700 dark:text-sky-300"
          : undefined
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const visibleMonitors = snapshot.monitors.filter((monitor) => {
    if (!matchesFilter(monitor.status, filter)) return false
    if (!normalizedQuery) return true

    return [monitor.name, monitor.host, monitor.kind].some((value) =>
      value.toLocaleLowerCase().includes(normalizedQuery)
    )
  })
  const filterOptions: Array<{
    value: StatusFilter
    label: string
    count: number
  }> = [
    { value: "all", label: "All", count: snapshot.summary.total },
    { value: "attention", label: "Attention", count: attentionCount },
    {
      value: "operational",
      label: "Operational",
      count: snapshot.summary.operational,
    },
    { value: "paused", label: "Paused", count: snapshot.summary.paused },
  ]

  return (
    <PageShell padded>
      <header>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Overview</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Status</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mt-5 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold tracking-[-0.025em] text-strong-foreground sm:text-4xl">
              Status
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>
          <Link
            to="/projects"
            search={{ filter: "all" }}
            className="group/action inline-flex w-fit items-center gap-1.5 text-sm font-medium text-strong-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            Browse projects
            <ArrowRightCompactIcon className="size-4 group-hover/action:translate-x-0.5" />
          </Link>
        </div>
      </header>

      <Card asChild className="mt-8 overflow-hidden">
        <section aria-labelledby="current-status">
          <div className="grid lg:grid-cols-[13fr_7fr]">
            <div className="flex flex-col justify-between p-5 sm:p-7">
              <div className="flex items-start gap-4">
                <span
                  className={cn(
                    "grid size-11 shrink-0 place-items-center rounded-xl",
                    overallPresentation.textClassName
                  )}
                  style={{
                    backgroundColor:
                      "color-mix(in oklch, currentColor 10%, transparent)",
                    boxShadow:
                      "inset 0 0 0 1px color-mix(in oklch, currentColor 25%, transparent)",
                  }}
                >
                  <OverallIcon className="size-5" />
                </span>
                <div className="min-w-0">
                  <h2
                    id="current-status"
                    className="text-lg font-semibold tracking-tight text-strong-foreground sm:text-xl"
                  >
                    {status.title}
                  </h2>
                  <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
                    {status.description}
                  </p>
                </div>
              </div>

              {snapshot.checkedAt ? (
                <p className="mt-7 flex items-center gap-2 text-xs text-muted-foreground">
                  <ClockIcon className="size-4" />
                  Last checked {formatCheckedAt(snapshot.checkedAt)}
                </p>
              ) : null}
            </div>

            <dl className="grid grid-cols-2 bg-muted/20 max-lg:border-t lg:border-l">
              <div className="border-r border-b">
                <SummaryMetric
                  label="Operational"
                  value={snapshot.summary.operational}
                  valueClassName="text-emerald-700 dark:text-emerald-300"
                />
              </div>
              <div className="border-b">
                <SummaryMetric
                  label="Attention"
                  value={attentionCount}
                  valueClassName={attentionValueClassName}
                />
              </div>
              <div className="border-r">
                <SummaryMetric
                  label="Paused"
                  value={snapshot.summary.paused}
                />
              </div>
              <SummaryMetric label="Total" value={snapshot.summary.total} />
            </dl>
          </div>
        </section>
      </Card>

      <section className="mt-10" aria-labelledby="monitored-projects">
        <Card className="overflow-hidden">
          <div className="border-b px-5 pt-5 sm:px-6 sm:pt-6">
            <div>
              <h2
                id="monitored-projects"
                className="text-lg font-semibold tracking-tight text-strong-foreground"
              >
                Monitored projects
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Read-only availability checks supplied by UptimeRobot.
              </p>
            </div>

            {snapshot.summary.total > 0 ? (
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-6">
                <nav
                  className="order-2 flex min-w-0 flex-1 [scrollbar-width:none] items-center gap-5 overflow-x-auto pr-20 sm:order-1 sm:gap-7 sm:pr-0 [&::-webkit-scrollbar]:hidden"
                  aria-label="Filter monitored projects"
                >
                  <span className="hidden shrink-0 items-center gap-1.5 pt-2 pb-3 text-xs font-medium text-muted-foreground sm:inline-flex">
                    <FunnelSimpleIcon className="size-3" aria-hidden="true" />
                    Filter
                  </span>
                  {filterOptions.map((option) => {
                    const selected = option.value === filter

                    return (
                      <button
                        key={option.value}
                        type="button"
                        className={cn(
                          "relative flex min-h-11 shrink-0 items-center gap-2 rounded-sm pt-2 pb-3 text-sm font-medium text-muted-foreground transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] outline-none after:absolute after:right-0 after:bottom-[-1px] after:left-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-foreground after:transition-transform after:duration-200 after:ease-[cubic-bezier(0.16,1,0.3,1)] hover:text-foreground focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ring motion-reduce:transition-none motion-reduce:after:transition-none",
                          selected &&
                            "text-strong-foreground after:scale-x-100"
                        )}
                        aria-pressed={selected}
                        onClick={() => setFilter(option.value)}
                      >
                        {option.label}
                        <span className="text-xs tabular-nums">
                          {option.count}
                        </span>
                      </button>
                    )
                  })}
                </nav>

                <div className="relative order-1 w-full sm:order-2 sm:mb-3 sm:w-64 sm:shrink-0">
                  <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Label htmlFor="status-project-search" className="sr-only">
                    Search monitored projects
                  </Label>
                  <Input
                    id="status-project-search"
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search monitored projects"
                    autoComplete="off"
                    className="h-10 rounded-[0.625rem] bg-card pr-3 pl-9.5"
                  />
                </div>
              </div>
            ) : null}
            <p className="sr-only" aria-live="polite">
              {visibleMonitors.length} monitored projects shown
            </p>
          </div>

          {snapshot.monitors.length > 0 ? (
            visibleMonitors.length > 0 ? (
              <div
                className="grid md:grid-cols-2"
                role="list"
                aria-label={`${filterOptions.find((option) => option.value === filter)?.label} monitored projects`}
              >
                {visibleMonitors.map((monitor) => (
                  <article
                    key={monitor.id}
                    className="group min-w-0 border-b p-5 transition-colors duration-200 hover:bg-muted/25 motion-reduce:transition-none md:odd:border-r"
                    role="listitem"
                  >
                    <div className="flex flex-col items-start gap-3 sm:flex-row sm:justify-between sm:gap-4">
                      <div className="min-w-0">
                        <a
                          href={monitor.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex max-w-full items-center gap-1.5 font-semibold text-strong-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4"
                        >
                          <span className="truncate">{monitor.name}</span>
                          <ArrowUpRightIcon className="size-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none" />
                        </a>
                        <p className="mt-1.5 truncate font-mono text-[0.6875rem] text-muted-foreground">
                          {monitor.host}
                        </p>
                      </div>
                      <StatusLabel status={monitor.status} />
                    </div>
                    <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{monitor.kind}</span>
                      <span aria-hidden="true">·</span>
                      <span>{formatInterval(monitor.intervalSeconds)}</span>
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="px-5 py-10 text-center sm:px-6">
                <p className="text-sm text-muted-foreground">
                  No monitored projects match this view.
                </p>
                <button
                  type="button"
                  className="mt-3 text-sm font-semibold text-strong-foreground underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4"
                  onClick={() => {
                    setFilter("all")
                    setQuery("")
                  }}
                >
                  {normalizedQuery
                    ? filter === "all"
                      ? "Clear search"
                      : "Clear search and filters"
                    : "Show all projects"}
                </button>
              </div>
            )
          ) : (
            <div className="px-5 py-10 sm:px-6">
              <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                {emptyListCopy(snapshot.source)}
              </p>
              <Link
                to="/projects"
                search={{ filter: "all" }}
                className="group/action mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-strong-foreground underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4"
              >
                Browse projects
                <ArrowRightCompactIcon className="size-4 group-hover/action:translate-x-0.5" />
              </Link>
            </div>
          )}
        </Card>
      </section>

      <footer className="mt-8 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
        <p>Checks refresh from the provider at most once every five minutes.</p>
        <a
          href="https://uptimerobot.com"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          Powered by UptimeRobot
          <ArrowUpRightIcon className="size-3.5" />
        </a>
      </footer>
    </PageShell>
  )
}
