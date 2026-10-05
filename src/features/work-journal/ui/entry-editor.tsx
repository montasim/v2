import { useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { categories, entrySchema, statuses, todayIn } from "../domain/journal"
import type { Contribution, EntryInput } from "../domain/journal"
import type { JournalEntry } from "../infrastructure/journal.server"
import {
  addJournalPortfolioProject,
  generateJournalEntry,
  getJournalEntry,
  saveJournalEntry,
} from "../application/journal"
import type { Setup } from "./journal-page"
import {
  Field,
  LoadState,
  Message,
  Select,
  useAction,
  useRemote,
  useUnsaved,
  companyLogo,
  projectLogo,
} from "./shared"

function newTask(description = ""): Contribution {
  return {
    id: crypto.randomUUID(),
    description,
    category: "delivery",
    status: "in progress",
    contribution: "",
    outcome: "",
    workKey: "",
    evidence: [],
    updates: [],
  }
}
function entryInput(entry: JournalEntry): EntryInput {
  return entrySchema.parse(entry)
}
export function ExistingEntry({
  id,
  setup,
  onDirty,
  refresh,
}: {
  id: string
  setup: Setup
  onDirty: (dirty: boolean) => void
  refresh: () => Promise<void>
}) {
  const load = useCallback(() => getJournalEntry({ data: { id } }), [id])
  const remote = useRemote(load)
  if (!remote.data || remote.loading || remote.error)
    return <LoadState {...remote} retry={remote.refresh} />
  return (
    <EntryEditor
      key={id}
      setup={setup}
      initial={remote.data}
      onDirty={onDirty}
      refresh={refresh}
    />
  )
}
export function EntryEditor({
  setup,
  initial,
  onDirty,
  refresh,
}: {
  setup: Setup
  initial?: JournalEntry
  onDirty?: (dirty: boolean) => void
  refresh: () => Promise<void>
}) {
  const [entry, setEntry] = useState<EntryInput>(() =>
    initial
      ? entryInput(initial)
      : {
          id: crypto.randomUUID(),
          revision: 0,
          workDate: todayIn(setup.settings.timezone),
          companyId: setup.defaultCompanyId,
          projectId: null,
          notes: "",
          reflection: "",
          contributions: [newTask()],
          summary: "",
          summarySourceHash: null,
        }
  )
  const [saved, setSaved] = useState(initial)
  const [baseline, setBaseline] = useState(() => JSON.stringify(entry))
  const dirty = JSON.stringify(entry) !== baseline
  useUnsaved(dirty, onDirty)
  const action = useAction()
  function update(patch: Partial<EntryInput>) {
    setEntry((current) => ({ ...current, ...patch }))
  }
  function updateTask(id: string, patch: Partial<Contribution>) {
    update({
      contributions: entry.contributions.map((task) =>
        task.id === id ? { ...task, ...patch } : task
      ),
    })
  }
  function acceptSaved(result: JournalEntry) {
    const input = entryInput(result)
    setSaved(result)
    setEntry(input)
    setBaseline(JSON.stringify(input))
  }
  async function save() {
    await action.run(async () => {
      const parsed = entrySchema.safeParse(entry)
      if (!parsed.success)
        throw new Error(parsed.error.issues[0]?.message ?? "Check your entry.")
      const result = await saveJournalEntry({ data: parsed.data })
      acceptSaved(result)
    }, "Entry saved.")
  }
  const activeProjects = setup.projects.filter(
    (project) =>
      project.companyId === entry.companyId &&
      (!project.archived || project.id === entry.projectId)
  )
  return (
    <div className="space-y-4">
      <h2 className="sr-only">{initial ? "Edit entry" : "Record your day"}</h2>
      {!setup.companies.length && (
        <Message>
          Open Companies & projects in Work Journal to add a company and start
          recording work.
        </Message>
      )}
      {action.feedback}
      <form
        onSubmit={(event) => {
          event.preventDefault()
          void save()
        }}
        className="space-y-5"
      >
        <fieldset
          disabled={action.busy}
          className="grid min-w-0 gap-5 disabled:opacity-70 xl:grid-cols-[minmax(0,1fr)_380px]"
        >
          <div className="min-w-0 space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Work date">
                <Input
                  type="date"
                  required
                  value={entry.workDate}
                  onChange={(event) => update({ workDate: event.target.value })}
                />
              </Field>
              <Field label="Company">
                <Select
                  required
                  value={entry.companyId}
                  onChange={(event) =>
                    update({ companyId: event.target.value, projectId: null })
                  }
                >
                  <option value="">Choose company</option>
                  {setup.companies
                    .filter(
                      (company) =>
                        !company.archived || company.id === entry.companyId
                    )
                    .map((company) => (
                      <option
                        key={company.id}
                        value={company.id}
                        data-logo={companyLogo(company.name)}
                      >
                        {company.name}
                        {company.archived ? " (archived)" : ""}
                      </option>
                    ))}
                </Select>
              </Field>
              <Field label="Project (optional)">
                <Select
                  value={entry.projectId ?? ""}
                  disabled={!entry.companyId}
                  onChange={(event) => {
                    const value = event.target.value
                    if (!value.startsWith("portfolio:")) {
                      update({ projectId: value || null })
                      return
                    }
                    void action.run(async () => {
                      const project = await addJournalPortfolioProject({
                        data: {
                          companyId: entry.companyId,
                          portfolioProjectId: value.slice("portfolio:".length),
                        },
                      })
                      await refresh()
                      update({ projectId: project.id })
                    })
                  }}
                >
                  <option value="">Company-level work</option>
                  <optgroup label="Company projects">
                    {activeProjects.map((project) => (
                      <option
                        key={project.id}
                        value={project.id}
                        data-logo={projectLogo(project.name)}
                      >
                        {project.name}
                        {project.archived ? " (archived)" : ""}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Existing portfolio projects — add to this company">
                    {setup.portfolioProjects
                      .filter(
                        (project) =>
                          !activeProjects.some(
                            (existing) =>
                              existing.name.toLowerCase() ===
                              project.title.toLowerCase()
                          )
                      )
                      .map((project) => (
                        <option
                          key={project.id}
                          value={`portfolio:${project.id}`}
                          data-logo={projectLogo(project.id)}
                        >
                          {project.title}
                        </option>
                      ))}
                  </optgroup>
                </Select>
              </Field>
            </div>
            <Field label="Original notes">
              <Textarea
                rows={3}
                maxLength={15000}
                placeholder="What did you work on? Paste rough notes or one task per line."
                value={entry.notes}
                onChange={(event) => update({ notes: event.target.value })}
              />
            </Field>
            <Button
              type="button"
              variant="outline"
              disabled={!entry.notes.trim()}
              onClick={() => {
                const tasks = entry.notes
                  .split("\n")
                  .map((line) => line.replace(/^\s*[-*•]\s*/, "").trim())
                  .filter(Boolean)
                const existing = entry.contributions.filter((task) =>
                  task.description.trim()
                )
                const seen = new Set(existing.map((task) => task.description))
                update({
                  contributions: [
                    ...existing,
                    ...tasks
                      .filter((text) => {
                        if (seen.has(text)) return false
                        seen.add(text)
                        return true
                      })
                      .map((text) => newTask(text)),
                  ].slice(0, 50),
                })
              }}
            >
              Add note lines as tasks
            </Button>
            <section className="space-y-4" aria-label="Contributions">
              <h3 className="sr-only">Contributions</h3>
              {entry.contributions.map((task, index) => (
                <div
                  key={task.id}
                  className="space-y-4 rounded-xl border bg-card p-4 sm:p-5"
                >
                  <h4 className="-mx-4 -mt-4 border-b px-4 py-3 font-semibold sm:-mx-5 sm:-mt-5 sm:px-5">
                    Contribution{" "}
                    {entry.contributions.length > 1 ? index + 1 : ""}
                  </h4>
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <Field label={`Task ${index + 1}`}>
                        <Textarea
                          rows={2}
                          required
                          maxLength={3000}
                          value={task.description}
                          onChange={(event) =>
                            updateTask(task.id, {
                              description: event.target.value,
                            })
                          }
                          placeholder="What did you do or investigate?"
                        />
                      </Field>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      className="mt-6"
                      disabled={entry.contributions.length === 1}
                      aria-label={`Remove task ${index + 1}`}
                      onClick={() =>
                        update({
                          contributions: entry.contributions.filter(
                            (item) => item.id !== task.id
                          ),
                        })
                      }
                    >
                      Remove
                    </Button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Category">
                      <Select
                        value={task.category}
                        onChange={(event) =>
                          updateTask(task.id, {
                            category: event.target
                              .value as Contribution["category"],
                          })
                        }
                      >
                        {categories.map((category) => (
                          <option key={category}>{category}</option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Status">
                      <Select
                        value={task.status}
                        onChange={(event) =>
                          updateTask(task.id, {
                            status: event.target
                              .value as Contribution["status"],
                          })
                        }
                      >
                        {statuses.map((status) => (
                          <option key={status}>{status}</option>
                        ))}
                      </Select>
                    </Field>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Your specific contribution">
                      <Textarea
                        rows={2}
                        maxLength={3000}
                        value={task.contribution}
                        onChange={(event) =>
                          updateTask(task.id, {
                            contribution: event.target.value,
                          })
                        }
                        placeholder="What part did you own or contribute to?"
                      />
                    </Field>
                    <Field label="Outcome or impact">
                      <Textarea
                        rows={2}
                        maxLength={3000}
                        value={task.outcome}
                        onChange={(event) =>
                          updateTask(task.id, { outcome: event.target.value })
                        }
                        placeholder="What improved? Leave blank if the result is not known yet."
                      />
                    </Field>
                  </div>
                  <details className="group">
                    <summary className="cursor-pointer text-sm font-medium text-strong-foreground">
                      Evidence, related work & later outcomes
                      {task.updates.length
                        ? ` · ${task.updates.length} updates`
                        : ""}
                    </summary>
                    <div className="mt-4 space-y-4">
                      <Field label="Related work ID (optional)">
                        <Input
                          maxLength={200}
                          value={task.workKey}
                          onChange={(event) =>
                            updateTask(task.id, { workKey: event.target.value })
                          }
                          placeholder="For example PAY-42 — use the same ID across days"
                        />
                      </Field>
                      {task.evidence.map((evidence, evidenceIndex) => (
                        <div
                          key={evidenceIndex}
                          className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
                        >
                          <Field label="Evidence description">
                            <Input
                              required
                              maxLength={300}
                              value={evidence.label}
                              onChange={(event) =>
                                updateTask(task.id, {
                                  evidence: task.evidence.map((item, i) =>
                                    i === evidenceIndex
                                      ? { ...item, label: event.target.value }
                                      : item
                                  ),
                                })
                              }
                            />
                          </Field>
                          <Field label="Evidence link (optional)">
                            <Input
                              type="url"
                              maxLength={2000}
                              value={evidence.url}
                              onChange={(event) =>
                                updateTask(task.id, {
                                  evidence: task.evidence.map((item, i) =>
                                    i === evidenceIndex
                                      ? { ...item, url: event.target.value }
                                      : item
                                  ),
                                })
                              }
                            />
                          </Field>
                          <Button
                            type="button"
                            variant="ghost"
                            className="self-end"
                            onClick={() =>
                              updateTask(task.id, {
                                evidence: task.evidence.filter(
                                  (_, i) => i !== evidenceIndex
                                ),
                              })
                            }
                          >
                            Remove evidence
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        disabled={task.evidence.length >= 20}
                        onClick={() =>
                          updateTask(task.id, {
                            evidence: [
                              ...task.evidence,
                              { label: "", url: "" },
                            ],
                          })
                        }
                      >
                        Add evidence
                      </Button>
                      {task.updates.map((outcome) => (
                        <div
                          key={outcome.id}
                          className="grid gap-3 lg:grid-cols-[10rem_minmax(0,1fr)_auto]"
                        >
                          <Field label="Outcome date">
                            <Input
                              required
                              type="date"
                              value={outcome.date}
                              onChange={(event) =>
                                updateTask(task.id, {
                                  updates: task.updates.map((item) =>
                                    item.id === outcome.id
                                      ? { ...item, date: event.target.value }
                                      : item
                                  ),
                                })
                              }
                            />
                          </Field>
                          <Field label="Later outcome">
                            <Textarea
                              required
                              maxLength={3000}
                              value={outcome.text}
                              onChange={(event) =>
                                updateTask(task.id, {
                                  updates: task.updates.map((item) =>
                                    item.id === outcome.id
                                      ? { ...item, text: event.target.value }
                                      : item
                                  ),
                                })
                              }
                            />
                          </Field>
                          <Button
                            type="button"
                            variant="ghost"
                            className="self-end"
                            onClick={() =>
                              updateTask(task.id, {
                                updates: task.updates.filter(
                                  (item) => item.id !== outcome.id
                                ),
                              })
                            }
                          >
                            Remove update
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        disabled={task.updates.length >= 50}
                        onClick={() =>
                          updateTask(task.id, {
                            updates: [
                              ...task.updates,
                              {
                                id: crypto.randomUUID(),
                                date: todayIn(setup.settings.timezone),
                                text: "",
                              },
                            ],
                          })
                        }
                      >
                        Add later outcome
                      </Button>
                    </div>
                  </details>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                disabled={entry.contributions.length >= 50}
                onClick={() =>
                  update({ contributions: [...entry.contributions, newTask()] })
                }
              >
                Add task
              </Button>
            </section>
            <section>
              <div>
                <Field label="Private reflection">
                  <Textarea
                    maxLength={10000}
                    value={entry.reflection}
                    onChange={(event) =>
                      update({ reflection: event.target.value })
                    }
                  />
                </Field>
                <p className="mt-2 text-xs text-muted-foreground">
                  Excluded from daily AI summaries and reviews unless you
                  explicitly include it in a review.
                </p>
              </div>
            </section>
            <div className="flex flex-wrap gap-3 border-t pt-5">
              <Button type="submit" disabled={!setup.companies.length}>
                {action.busy ? "Saving…" : "Save entry"}
              </Button>
            </div>
          </div>
          {/* xl:pt-[1.375rem] = field label (1rem line + 0.375rem gap), so the
              summary card lines up with the inputs, not their labels. */}
          <aside className="min-w-0 space-y-4 xl:pt-[1.375rem]">
            <section className="space-y-4 rounded-xl border bg-card p-5">
              <h3 className="-mx-5 -mt-5 border-b px-5 py-3 font-semibold">
                Entry summary
              </h3>
              <Field label="Daily summary">
                <Textarea
                  rows={6}
                  maxLength={20000}
                  value={entry.summary}
                  onChange={(event) =>
                    update({
                      summary: event.target.value,
                      summarySourceHash: saved?.sourceHash ?? null,
                    })
                  }
                  placeholder="Write your own summary, or generate a draft from saved notes."
                />
              </Field>
              {saved?.summary &&
                saved.summarySourceHash !== saved.sourceHash && (
                  <Message>
                    This summary may be outdated because its source notes
                    changed. Review it before sharing.
                  </Message>
                )}
              {saved?.draft && (
                <details open>
                  <summary className="cursor-pointer text-sm font-medium">
                    Generated draft
                    {saved.draftSourceHash !== saved.sourceHash
                      ? " · source notes changed"
                      : ""}
                  </summary>
                  <pre className="mt-3 max-h-80 overflow-auto rounded-lg border bg-muted/30 p-4 font-sans text-sm leading-6 break-words whitespace-pre-wrap">
                    {saved.draft}
                  </pre>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-3"
                    onClick={() => {
                      if (
                        !entry.summary ||
                        window.confirm(
                          "Replace the summary editor with this draft? It will be saved only when you save the entry."
                        )
                      )
                        update({
                          summary: saved.draft ?? "",
                          summarySourceHash: saved.draftSourceHash,
                        })
                    }}
                  >
                    Use draft in editor
                  </Button>
                </details>
              )}
              <Button
                type="button"
                variant="outline"
                disabled={!saved || dirty || !setup.ai.enabled}
                onClick={() =>
                  void action.run(async () => {
                    const result = await generateJournalEntry({
                      data: { id: entry.id, revision: entry.revision },
                    })
                    acceptSaved(result)
                  }, "Draft generated. Review it before using it.")
                }
              >
                Generate daily draft
              </Button>
            </section>
            <p className="text-xs leading-5 text-muted-foreground">
              {setup.ai.enabled
                ? `Generation sends saved notes, task details and evidence to ${setup.ai.provider}. Save changes first. Your accepted summary is never replaced automatically.`
                : "AI is not configured. Notes and manual summaries work normally."}
            </p>
            <p className="text-xs leading-6 text-muted-foreground">
              Private by default. Reviews include only the contributions and
              reflections you choose.
            </p>
          </aside>
        </fieldset>
      </form>
    </div>
  )
}
