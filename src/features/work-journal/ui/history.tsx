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
    <section className="space-y-5">
      <div>
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
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
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
                  !fields.companyId || project.companyId === fields.companyId
              )
              .map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
          </Select>
        </Field>
        <Field label="Search notes and tasks">
          <Input
            maxLength={120}
            value={fields.query}
            onChange={(event) =>
              setFields({ ...fields, query: event.target.value })
            }
          />
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
        <Button type="submit" className="self-end" disabled={remote.loading}>
          Apply filters
        </Button>
      </form>
      <LoadState {...remote} retry={remote.refresh} />
      {!remote.loading && !remote.error && remote.data && (
        <>
          {!remote.data.items.length ? (
            <Message>
              No entries match this view. Record your day or change the filters.
            </Message>
          ) : (
            <ul className="divide-y rounded-xl border bg-card px-5">
              {remote.data.items.map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-wrap items-start justify-between gap-3 py-5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">
                      {entry.workDate} ·{" "}
                      {
                        setup.companies.find(
                          (company) => company.id === entry.companyId
                        )?.name
                      }
                      {entry.projectId
                        ? ` · ${setup.projects.find((project) => project.id === entry.projectId)?.name}`
                        : " · Company-level work"}
                    </p>
                    <p className="mt-2 text-sm leading-6 break-words">
                      {entry.contributions
                        .slice(0, 3)
                        .map((task) => task.description)
                        .join(" · ")}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {entry.contributions.length} contributions
                      {entry.summary &&
                      entry.summarySourceHash !== entry.sourceHash
                        ? " · Summary needs review"
                        : ""}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => openEntry(entry.id)}
                    aria-label={`Open entry for ${entry.workDate}`}
                  >
                    Open entry
                  </Button>
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
