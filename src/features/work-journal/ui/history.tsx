import { useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { categories, historySchema, statuses } from "../domain/journal"
import type { HistoryFilter } from "../domain/journal"
import { getJournalHistory } from "../application/journal"
import type { Setup } from "./journal-page"
import { Field, LoadState, Message, Select, useRemote } from "./shared"

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
        <div className="flex flex-wrap items-end gap-3 [&>label]:min-w-40 [&>label]:flex-1">
          <Field label="Search notes and tasks">
            <Input
              maxLength={120}
              value={fields.query}
              onChange={(event) =>
                setFields({ ...fields, query: event.target.value })
              }
            />
          </Field>
          <Button type="submit" disabled={remote.loading}>
            Apply filters
          </Button>
        </div>
        <details className="rounded-lg border bg-card p-4">
          <summary className="cursor-pointer text-sm font-medium">
            Advanced filters
            {[
              fields.from,
              fields.to,
              fields.companyId,
              fields.projectId,
              fields.category,
              fields.status,
            ].filter(Boolean).length
              ? ` · ${[fields.from, fields.to, fields.companyId, fields.projectId, fields.category, fields.status].filter(Boolean).length} selected`
              : ""}
          </summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                  <option key={company.id} value={company.id}>
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
                    <option key={project.id} value={project.id}>
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
        </details>
      </form>
      <LoadState {...remote} retry={remote.refresh} />
      {!remote.loading && !remote.error && remote.data && (
        <>
          {!remote.data.items.length ? (
            <Message>
              No entries match this view. Record your day or change the filters.
            </Message>
          ) : (
            <ul className="divide-y overflow-hidden rounded-xl border bg-card">
              {remote.data.items.map((entry) => (
                <li key={entry.id}>
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-start gap-3 px-4 py-4 hover:bg-muted/50 [&::-webkit-details-marker]:hidden">
                      <span
                        className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-xs font-semibold"
                        aria-hidden="true"
                      >
                        {entry.contributions[0]?.description
                          .slice(0, 2)
                          .toUpperCase() || "JR"}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {entry.contributions[0]?.description ||
                            "Journal entry"}
                        </span>
                        <span className="mt-1 block truncate text-sm text-muted-foreground">
                          {
                            setup.companies.find(
                              (company) => company.id === entry.companyId
                            )?.name
                          }
                          {entry.projectId
                            ? ` · ${setup.projects.find((project) => project.id === entry.projectId)?.name}`
                            : " · Company-level work"}
                          {` · ${entry.contributions.length} contributions`}
                        </span>
                        <span className="mt-1 block text-xs text-muted-foreground sm:hidden">
                          {entry.workDate}
                        </span>
                        {entry.summary &&
                          entry.summarySourceHash !== entry.sourceHash && (
                            <span className="mt-1 block text-xs text-muted-foreground">
                              Summary needs review
                            </span>
                          )}
                      </span>
                      <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
                        {entry.workDate}
                      </span>
                      <svg
                        className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="m9 5 7 7-7 7" />
                      </svg>
                    </summary>
                    <div className="space-y-4 border-t bg-background px-5 py-5 sm:pl-15">
                      <p className="text-sm break-words text-muted-foreground">
                        {
                          setup.companies.find(
                            (company) => company.id === entry.companyId
                          )?.name
                        }
                        {entry.projectId
                          ? ` · ${setup.projects.find((project) => project.id === entry.projectId)?.name}`
                          : " · Company-level work"}
                      </p>
                      <ul className="space-y-2 text-sm leading-6">
                        {entry.contributions.map((task) => (
                          <li key={task.id} className="break-words">
                            {task.description}
                          </li>
                        ))}
                      </ul>
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
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              disabled={remote.data.page <= 1}
              onClick={() =>
                setFilter({ ...filter, page: (remote.data?.page ?? 1) - 1 })
              }
            >
              Previous
            </Button>
            <span className="text-xs text-muted-foreground">
              {remote.data.total} entries · Page {remote.data.page} of{" "}
              {remote.data.pageCount}
            </span>
            <Button
              variant="outline"
              disabled={remote.data.page >= remote.data.pageCount}
              onClick={() =>
                setFilter({ ...filter, page: (remote.data?.page ?? 1) + 1 })
              }
            >
              Next
            </Button>
          </div>
        </>
      )}
    </section>
  )
}
