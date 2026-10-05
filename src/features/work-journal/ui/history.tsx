import { EmptyState } from "@/components/dashboard/dashboard-page-state"
import { CatalogPagination } from "@/components/shared/catalog-pagination"
import {
  CaretDownIcon,
  CaretRightIcon,
  ClockIcon,
  SearchIcon,
} from "@/components/ui/icons"
import { useCallback, useId, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { categories, historySchema, statuses } from "../domain/journal"
import type { HistoryFilter } from "../domain/journal"
import { getJournalHistory } from "../application/journal"
import type { Setup } from "./journal-page"
import {
  Field,
  LoadState,
  Select,
  companyLogo,
  projectLogo,
  useRemote,
} from "./shared"

export function History({
  setup,
  openEntry,
}: {
  setup: Setup
  openEntry: (id: string) => void
}) {
  const [fields, setFields] = useState<HistoryFilter>(() =>
    historySchema.parse({})
  )
  const [filter, setFilter] = useState(fields)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const advancedId = useId()
  const advancedFilterCount = [
    fields.from,
    fields.to,
    fields.companyId,
    fields.projectId,
    fields.category,
    fields.status,
  ].filter(Boolean).length
  const load = useCallback(() => getJournalHistory({ data: filter }), [filter])
  const remote = useRemote(load)
  return (
    <section className="space-y-4">
      <div className="sr-only">
        <h2 className="text-lg font-semibold">Your contribution history</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Find earlier work, add evidence, or record an outcome you learned
          later.
        </p>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          setFilter({ ...fields, page: 1 })
        }}
        className="space-y-4"
      >
        <div className="flex flex-wrap items-end gap-3 [&>label]:min-w-0 [&>label]:basis-full md:[&>label]:basis-1/2">
          <Field label="Search notes and tasks">
            <span className="relative block">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                maxLength={120}
                value={fields.query}
                onChange={(event) =>
                  setFields({ ...fields, query: event.target.value })
                }
                placeholder="Search notes and tasks"
                className="pl-9"
              />
            </span>
          </Field>
          <div className="ml-auto flex flex-wrap items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              aria-expanded={advancedOpen}
              aria-controls={advancedId}
              className="focus-visible:outline-2 focus-visible:outline-offset-2"
              onClick={() => setAdvancedOpen((open) => !open)}
            >
              Advanced filters
              {advancedFilterCount ? ` · ${advancedFilterCount} selected` : ""}
              <CaretDownIcon
                className={`size-4 transition-transform motion-reduce:transition-none ${advancedOpen ? "rotate-180" : ""}`}
              />
            </Button>
            <Button type="submit" disabled={remote.loading}>
              Apply filters
            </Button>
          </div>
        </div>
        <div
          id={advancedId}
          hidden={!advancedOpen}
          role="group"
          aria-label="Advanced filters"
          className="rounded-lg border bg-card p-4"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="From">
              <Input
                type="date"
                value={fields.from}
                onChange={(event) =>
                  setFields({ ...fields, from: event.target.value })
                }
              />
            </Field>
            <Field label="Through">
              <Input
                type="date"
                min={fields.from || undefined}
                value={fields.to}
                onChange={(event) =>
                  setFields({ ...fields, to: event.target.value })
                }
              />
            </Field>
            <Field label="Company">
              <Select
                value={fields.companyId}
                onChange={(event) =>
                  setFields({
                    ...fields,
                    companyId: event.target.value,
                    projectId: "",
                  })
                }
              >
                <option value="">All companies</option>
                {setup.companies.map((company) => (
                  <option
                    key={company.id}
                    value={company.id}
                    data-logo={companyLogo(company.name)}
                  >
                    {company.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Project">
              <Select
                value={fields.projectId}
                onChange={(event) =>
                  setFields({ ...fields, projectId: event.target.value })
                }
              >
                <option value="">All projects</option>
                {setup.projects
                  .filter(
                    (project) =>
                      !fields.companyId ||
                      project.companyId === fields.companyId
                  )
                  .map((project) => (
                    <option
                      key={project.id}
                      value={project.id}
                      data-logo={projectLogo(project.name)}
                    >
                      {project.name}
                    </option>
                  ))}
              </Select>
            </Field>
            <Field label="Category">
              <Select
                value={fields.category}
                onChange={(event) =>
                  setFields({
                    ...fields,
                    category: event.target.value as HistoryFilter["category"],
                  })
                }
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </Select>
            </Field>
            <Field label="Status">
              <Select
                value={fields.status}
                onChange={(event) =>
                  setFields({
                    ...fields,
                    status: event.target.value as HistoryFilter["status"],
                  })
                }
              >
                <option value="">All statuses</option>
                {statuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </Select>
            </Field>
          </div>
        </div>
      </form>
      <LoadState {...remote} retry={remote.refresh} />
      {!remote.loading && !remote.error && remote.data && (
        <>
          {!remote.data.items.length ? (
            <EmptyState
              icon={ClockIcon}
              title="No entries match this view"
              description="Choose New journal to record your work, or change the filters."
            />
          ) : (
            <ul className="divide-y overflow-hidden rounded-xl border bg-card">
              {remote.data.items.map((entry) => (
                <li key={entry.id}>
                  <details className="group">
                    <summary className="flex cursor-pointer list-none gap-4 px-4 py-4 transition-colors hover:bg-muted/40 sm:px-5 [&::-webkit-details-marker]:hidden">
                      <EntryDate value={entry.workDate} />
                      <span className="min-w-0 flex-1">
                        <span className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
                          <LogoMark
                            src={companyLogo(entry.companyName)}
                            label={entry.companyName}
                          />
                          <span className="truncate">
                            <span className="font-medium text-foreground">
                              {entry.companyName}
                            </span>
                            <span aria-hidden="true"> / </span>
                            {entry.projectName ?? "Company-level work"}
                          </span>
                        </span>
                        {entry.summary ? (
                          <span className="mt-2 line-clamp-3 text-sm leading-6 break-words whitespace-pre-wrap group-open:line-clamp-none">
                            {entry.summary}
                          </span>
                        ) : (
                          <ul className="mt-2 space-y-1 text-sm leading-6">
                            {entry.contributions.slice(0, 3).map((task) => (
                              <li key={task.id} className="flex gap-2">
                                <span
                                  aria-hidden="true"
                                  className="text-muted-foreground"
                                >
                                  •
                                </span>
                                <span className="min-w-0 truncate">
                                  {task.description}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                        <span className="mt-3 flex flex-wrap items-center gap-1.5">
                          <Badge variant="outline">
                            {entry.contributions.length}{" "}
                            {entry.contributions.length === 1
                              ? "task"
                              : "tasks"}
                          </Badge>
                          {statusCounts(entry.contributions).map(
                            ([status, total]) => (
                              <Badge key={status} variant="secondary">
                                {total} {status}
                              </Badge>
                            )
                          )}
                          {entry.summary &&
                          entry.summarySourceHash !== entry.sourceHash ? (
                            <Badge
                              variant="outline"
                              className="border-amber-500/40 text-amber-700 dark:text-amber-400"
                            >
                              Summary needs review
                            </Badge>
                          ) : null}
                        </span>
                      </span>
                      <CaretRightIcon
                        aria-hidden="true"
                        className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90 motion-reduce:transition-none"
                      />
                    </summary>
                    <div className="space-y-4 border-t bg-background px-5 py-5 sm:pl-15">
                      <ol className="space-y-3">
                        {entry.contributions.map((task, index) => (
                          <ContributionDetail
                            key={task.id}
                            task={task}
                            number={index + 1}
                          />
                        ))}
                      </ol>
                      <Button
                        variant="outline"
                        onClick={() => openEntry(entry.id)}
                        aria-label={`Open entry for ${entry.workDate}`}
                      >
                        Edit entry & add evidence
                      </Button>
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          )}
          {remote.data.total > 0 && (
            <CatalogPagination
              page={remote.data.page}
              pageCount={remote.data.pageCount}
              pageSize={20}
              total={remote.data.total}
              resultLabel="entries"
              onPageChange={(page) => setFilter({ ...filter, page })}
            />
          )}
        </>
      )}
    </section>
  )
}

type HistoryContribution = Awaited<
  ReturnType<typeof getJournalHistory>
>["items"][number]["contributions"][number]

const sentenceCase = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1)

function ContributionDetail({
  task,
  number,
}: {
  task: HistoryContribution
  number: number
}) {
  const fields = [
    ["Your contribution", task.contribution],
    ["Outcome or impact", task.outcome],
    ["Related work ID", task.workKey],
  ].filter(([, value]) => value)

  return (
    <li className="flex gap-3 rounded-lg border bg-card p-4">
      <span
        aria-hidden="true"
        className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold tabular-nums"
      >
        {number}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start gap-2">
          <p className="min-w-0 flex-1 text-sm font-medium break-words">
            {task.description}
          </p>
          <Badge variant="secondary">{sentenceCase(task.category)}</Badge>
          <Badge variant="outline">{sentenceCase(task.status)}</Badge>
        </div>
        {fields.length ? (
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            {fields.map(([label, value]) => (
              <div key={label} className="min-w-0">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-0.5 break-words whitespace-pre-wrap">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
        {task.evidence.length ? (
          <div className="mt-3">
            <p className="text-xs text-muted-foreground">Evidence</p>
            <ul className="mt-1 space-y-1 text-sm">
              {task.evidence.map((item, index) => (
                <li key={index} className="break-words">
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-4 hover:text-foreground"
                    >
                      {item.label}
                    </a>
                  ) : (
                    item.label
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {task.updates.length ? (
          <div className="mt-3">
            <p className="text-xs text-muted-foreground">Later outcomes</p>
            <ul className="mt-1 space-y-1 text-sm">
              {task.updates.map((update) => (
                <li key={update.id} className="break-words">
                  <span className="text-muted-foreground">
                    {update.date} ·{" "}
                  </span>
                  {update.text}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </li>
  )
}

function EntryDate({ value }: { value: string }) {
  // workDate is a calendar date; parse at local midnight to avoid TZ shifts.
  const date = new Date(`${value}T00:00:00`)
  const part = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en", options).format(date)
  return (
    <time
      dateTime={value}
      title={part({ dateStyle: "full" })}
      className="flex w-12 shrink-0 flex-col items-center self-start rounded-lg border bg-background py-1.5 text-center"
    >
      <span className="text-[0.6875rem] text-muted-foreground uppercase">
        {part({ month: "short" })}
      </span>
      <span className="text-lg leading-6 font-semibold tabular-nums">
        {part({ day: "numeric" })}
      </span>
      <span className="text-[0.6875rem] text-muted-foreground">
        {part({ weekday: "short" })}
      </span>
    </time>
  )
}

function LogoMark({ src, label }: { src: string; label: string }) {
  return src ? (
    <img
      src={src}
      alt=""
      className="size-4 shrink-0 rounded-sm object-contain"
    />
  ) : (
    <span
      aria-hidden="true"
      className="grid size-4 shrink-0 place-items-center rounded-sm bg-muted text-[0.625rem] font-semibold"
    >
      {label.charAt(0).toUpperCase()}
    </span>
  )
}

function statusCounts(tasks: readonly HistoryContribution[]) {
  const counts = new Map<string, number>()
  for (const task of tasks) {
    counts.set(task.status, (counts.get(task.status) ?? 0) + 1)
  }
  return [...counts]
}
