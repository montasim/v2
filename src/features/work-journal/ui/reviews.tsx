import { EmptyState } from "@/components/dashboard/dashboard-page-state"
import { CaretDownIcon, FilesIcon, SearchIcon } from "@/components/ui/icons"
import { useCallback, useId, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  audiences,
  evidenceAppendix,
  periodRange,
  todayIn,
} from "../domain/journal"
import type { ReviewSource } from "../domain/journal"
import {
  createJournalReview,
  generateJournalReview,
  getJournalReview,
  getJournalReviews,
  getReviewCandidates,
  saveJournalReview,
} from "../application/journal"
import type {
  JournalEntry,
  JournalReview,
} from "../infrastructure/journal.server"
import type { Setup } from "./journal-page"
import {
  downloadText,
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

const audienceLabels = {
  personal: "Personal reflection",
  cto: "CTO / engineering",
  manager: "Project manager",
  hr: "HR / performance review",
}
function initialReport(sources: ReviewSource[]) {
  return sources
    .map(
      (source) =>
        `## ${source.workDate} · ${source.company}${source.project ? ` · ${source.project}` : ""}\n\n${source.contributions.map((task) => `- ${task.description} (${task.status})${task.contribution ? `\n  Contribution: ${task.contribution}` : ""}${task.outcome ? `\n  Outcome: ${task.outcome}` : ""}${task.updates.map((update) => `\n  Later outcome (${update.date}): ${update.text}`).join("")}`).join("\n")}${source.reflection ? `\n\nPersonal reflection: ${source.reflection}` : ""}`
    )
    .join("\n\n")
}
export function Reviews({
  setup,
  openReview,
  onDirty,
}: {
  setup: Setup
  openReview: (id: string, saved?: boolean) => void
  onDirty: (dirty: boolean) => void
}) {
  const [prepareOpen, setPrepareOpen] = useState(false)
  const prepareId = useId()
  const [page, setPage] = useState(1)
  const load = useCallback(() => getJournalReviews({ data: { page } }), [page])
  const remote = useRemote(load)
  const today = todayIn(setup.settings.timezone)
  const [form, setForm] = useState({
    title: "Weekly review",
    ...periodRange("week", today, setup.settings.weekStartsOn),
    companyId: setup.defaultCompanyId,
    projectId: "",
    audience: "personal" as (typeof audiences)[number],
    includeReflections: false,
    includeLinks: false,
  })
  const [candidates, setCandidates] = useState<JournalEntry[] | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [requestId] = useState(() => crypto.randomUUID())
  const [dirty, setDirty] = useState(false)
  useUnsaved(dirty, onDirty)
  const action = useAction()
  function change(patch: Partial<typeof form>) {
    setForm({ ...form, ...patch })
    setDirty(true)
    if (
      "from" in patch ||
      "to" in patch ||
      "companyId" in patch ||
      "projectId" in patch
    ) {
      setCandidates(null)
      setSelected(new Set())
    }
  }
  return (
    <div className="space-y-5">
      <section className="min-w-0 rounded-xl border bg-card">
        <h2 className="font-semibold">
          <button
            type="button"
            aria-expanded={prepareOpen}
            aria-controls={prepareId}
            onClick={() => setPrepareOpen((open) => !open)}
            className="flex min-h-12 w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-5 py-3 text-left hover:bg-muted/40 focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Prepare a review
            <CaretDownIcon
              className={`size-4 shrink-0 text-muted-foreground ${prepareOpen ? "rotate-180" : ""}`}
            />
          </button>
        </h2>
        <div
          id={prepareId}
          hidden={!prepareOpen}
          className="space-y-4 border-t p-5"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="max-w-2xl min-w-0 text-sm leading-6 text-muted-foreground">
              Choose a period and contributions. The review keeps a snapshot of
              those sources, so later journal edits cannot silently change what
              you shared.
            </p>
            <div className="flex shrink-0 flex-wrap gap-2">
              {(["week", "month", "year"] as const).map((period) => (
                <Button
                  key={period}
                  variant="outline"
                  disabled={action.busy}
                  onClick={() =>
                    change({
                      ...periodRange(
                        period,
                        today,
                        setup.settings.weekStartsOn
                      ),
                      title: `${period === "week" ? "Weekly" : period === "month" ? "Monthly" : "Annual"} review`,
                    })
                  }
                >
                  This {period}
                </Button>
              ))}
            </div>
          </div>
          {action.feedback}
          <form
            onSubmit={(event) => {
              event.preventDefault()
              void action.run(async () => {
                const items = await getReviewCandidates({
                  data: {
                    from: form.from,
                    to: form.to,
                    companyId: form.companyId,
                    projectId: form.projectId || null,
                  },
                })
                setCandidates(items)
                setSelected(
                  new Set(
                    items.flatMap((entry) =>
                      entry.contributions.map(
                        (task) => `${entry.id}/${task.id}`
                      )
                    )
                  )
                )
              })
            }}
          >
            <fieldset
              disabled={action.busy}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              <Field label="Report title">
                <Input
                  required
                  maxLength={200}
                  value={form.title}
                  onChange={(event) => change({ title: event.target.value })}
                />
              </Field>
              <Field label="From">
                <Input
                  required
                  type="date"
                  value={form.from}
                  onChange={(event) => change({ from: event.target.value })}
                />
              </Field>
              <Field label="Through">
                <Input
                  required
                  type="date"
                  min={form.from}
                  value={form.to}
                  onChange={(event) => change({ to: event.target.value })}
                />
              </Field>
              <Field label="Company">
                <Select
                  required
                  value={form.companyId}
                  onChange={(event) =>
                    change({ companyId: event.target.value, projectId: "" })
                  }
                >
                  <option value="">Choose company</option>
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
                  value={form.projectId}
                  onChange={(event) =>
                    change({ projectId: event.target.value })
                  }
                >
                  <option value="">All company work</option>
                  {setup.projects
                    .filter((project) => project.companyId === form.companyId)
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
              <Field label="Audience">
                <Select
                  value={form.audience}
                  onChange={(event) =>
                    change({
                      audience: event.target.value as typeof form.audience,
                      includeReflections: false,
                    })
                  }
                >
                  {audiences.map((audience) => (
                    <option key={audience} value={audience}>
                      {audienceLabels[audience]}
                    </option>
                  ))}
                </Select>
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.includeReflections}
                  onChange={(event) =>
                    change({ includeReflections: event.target.checked })
                  }
                />
                Include private reflections
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.includeLinks}
                  onChange={(event) =>
                    change({ includeLinks: event.target.checked })
                  }
                />
                Include internal evidence URLs
              </label>
              <Button type="submit">Find contributions</Button>
            </fieldset>
          </form>
          {candidates && (
            <div className="space-y-4">
              {!candidates.length ? (
                <EmptyState
                  icon={SearchIcon}
                  title="No work recorded for this selection"
                  description="Try a different period or company."
                />
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-sm font-medium">
                      Choose what belongs in this report
                    </p>
                    <Button
                      variant="ghost"
                      disabled={action.busy}
                      onClick={() => {
                        setSelected(new Set())
                        setDirty(true)
                      }}
                    >
                      Deselect all
                    </Button>
                  </div>
                  <div className="max-h-[28rem] space-y-5 overflow-auto rounded-xl border bg-card p-5">
                    {candidates.map((entry) => (
                      <fieldset
                        key={entry.id}
                        disabled={action.busy}
                        className="space-y-3"
                      >
                        <legend className="mb-2 text-sm font-semibold">
                          {entry.workDate} ·{" "}
                          {setup.projects.find(
                            (project) => project.id === entry.projectId
                          )?.name ?? "Company-level work"}
                        </legend>
                        {entry.contributions.map((task) => {
                          const key = `${entry.id}/${task.id}`
                          return (
                            <label
                              key={key}
                              className="flex items-start gap-3 text-sm leading-6"
                            >
                              <input
                                type="checkbox"
                                className="mt-1"
                                checked={selected.has(key)}
                                onChange={(event) => {
                                  const next = new Set(selected)
                                  if (event.target.checked) next.add(key)
                                  else next.delete(key)
                                  setSelected(next)
                                  setDirty(true)
                                }}
                              />
                              <span className="min-w-0 break-words">
                                {task.description}
                                <span className="ml-2 text-xs text-muted-foreground">
                                  {task.status}
                                </span>
                              </span>
                            </label>
                          )
                        })}
                      </fieldset>
                    ))}
                  </div>
                  <Button
                    disabled={action.busy || !selected.size}
                    onClick={() =>
                      void action.run(async () => {
                        const report = await createJournalReview({
                          data: {
                            ...form,
                            id: requestId,
                            projectId: form.projectId || null,
                            selected: candidates
                              .map((entry) => ({
                                entryId: entry.id,
                                contributionIds: entry.contributions
                                  .filter((task) =>
                                    selected.has(`${entry.id}/${task.id}`)
                                  )
                                  .map((task) => task.id),
                              }))
                              .filter(
                                (selection) => selection.contributionIds.length
                              ),
                          },
                        })
                        setDirty(false)
                        onDirty(false)
                        openReview(report.id, true)
                      })
                    }
                  >
                    Create review from {selected.size} contributions
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </section>
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Saved reviews</h2>
        <LoadState {...remote} retry={remote.refresh} />
        {!remote.loading && !remote.error && remote.data && (
          <>
            {!remote.data.items.length ? (
              <EmptyState
                icon={FilesIcon}
                title="No saved reviews yet"
                description="Your first review will appear here after you select contributions above."
              />
            ) : (
              <ul className="divide-y rounded-xl border bg-card px-4">
                {remote.data.items.map((review) => (
                  <li
                    key={review.id}
                    className="flex flex-wrap items-center justify-between gap-4 py-4"
                  >
                    <div className="min-w-0 break-words">
                      <p className="text-sm font-medium">{review.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {review.from} – {review.to} · {review.audience}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => openReview(review.id)}
                    >
                      Open review
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            {remote.data.total > 20 && (
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <span className="text-xs">Page {page}</span>
                <Button
                  variant="outline"
                  disabled={page * 20 >= remote.data.total}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
export function ReviewDetail({
  id,
  setup,
  onDirty,
}: {
  id: string
  setup: Setup
  onDirty: (dirty: boolean) => void
}) {
  const load = useCallback(() => getJournalReview({ data: { id } }), [id])
  const remote = useRemote(load)
  if (!remote.data || remote.loading || remote.error)
    return <LoadState {...remote} retry={remote.refresh} />
  return (
    <ReviewEditor
      key={id}
      initial={remote.data}
      setup={setup}
      onDirty={onDirty}
    />
  )
}
function ReviewEditor({
  initial,
  setup,
  onDirty,
}: {
  initial: JournalReview
  setup: Setup
  onDirty: (dirty: boolean) => void
}) {
  const [review, setReview] = useState(initial)
  const [title, setTitle] = useState(initial.title)
  const [body, setBody] = useState(initial.body)
  const [appendix, setAppendix] = useState(false)
  const [preview, setPreview] = useState(false)
  const dirty = title !== review.title || body !== review.body
  useUnsaved(dirty, onDirty)
  const action = useAction()
  const exported = `# ${title}\n\n${review.from} – ${review.to}\n\n${body}${appendix ? `\n\n## Supporting evidence\n\n${evidenceAppendix(review.sources)}` : ""}`
  const finished =
    review.generatedCount >= review.batchCount && review.partials.length === 1
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Review editor</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {review.from} – {review.to} · {review.audience} ·{" "}
          {review.sources.reduce(
            (sum, source) => sum + source.contributions.length,
            0
          )}{" "}
          selected contributions
        </p>
      </div>
      {review.stale && (
        <Message>
          Source entries have changed since this snapshot. This report is
          preserved. Create a new review to include the latest notes and
          outcomes.
        </Message>
      )}
      {action.feedback}
      {review.generationError && <Message>{review.generationError}</Message>}
      <fieldset
        disabled={action.busy}
        className="min-w-0 space-y-4 rounded-xl border bg-card p-5"
      >
        <Field label="Report title">
          <Input
            required
            maxLength={200}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </Field>
        <Field label="Your report">
          <Textarea
            rows={16}
            maxLength={100000}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Write your review here, start from the source notes, or generate a draft below."
          />
        </Field>
        <div className="flex flex-wrap gap-3">
          <Button
            disabled={!dirty || !title.trim()}
            onClick={() =>
              void action.run(async () => {
                const saved = await saveJournalReview({
                  data: {
                    id: review.id,
                    revision: review.revision,
                    title,
                    body,
                  },
                })
                setReview(saved)
                setTitle(saved.title)
                setBody(saved.body)
              }, "Review saved.")
            }
          >
            Save review
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              if (
                !body ||
                window.confirm(
                  "Replace the report editor with the selected source notes?"
                )
              )
                setBody(initialReport(review.sources))
            }}
          >
            Start from source notes
          </Button>
        </div>
        <section className="space-y-3 border-t pt-5">
          <h3 className="font-semibold">AI draft</h3>
          <p className="text-sm leading-6 text-muted-foreground">
            {setup.ai.enabled
              ? `Generate with ${setup.ai.provider} using only this snapshot. Each step processes a bounded group of contributions; progress is saved between steps. Existing report text stays untouched.`
              : "Configure a journal AI provider to generate drafts. You can write and export a review without it."}
          </p>
          {review.generatedCount > 0 && (
            <p role="status" className="text-xs text-muted-foreground">
              {review.generatedCount} of {review.batchCount} source groups
              processed
              {review.generatedCount >= review.batchCount && !finished
                ? ` · ${review.partials.length} sections to consolidate`
                : ""}
              {finished ? " · Draft complete" : ""}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              disabled={
                !setup.ai.enabled || dirty || finished || !review.batchCount
              }
              onClick={() =>
                void action.run(async () => {
                  setReview(
                    await generateJournalReview({
                      data: { id: review.id, revision: review.revision },
                    })
                  )
                }, "Generation step saved.")
              }
            >
              {review.generatedCount === 0
                ? "Generate review draft"
                : "Continue generation"}
            </Button>
            {review.generatedCount > 0 && (
              <Button
                variant="ghost"
                disabled={dirty}
                onClick={() =>
                  void action.run(async () => {
                    setReview(
                      await generateJournalReview({
                        data: {
                          id: review.id,
                          revision: review.revision,
                          restart: true,
                        },
                      })
                    )
                  }, "Ready to generate a fresh draft. Your previous draft and report are retained.")
                }
              >
                Restart generation
              </Button>
            )}
          </div>
          {dirty && (
            <p className="text-xs text-muted-foreground">
              Save the report before generating.
            </p>
          )}
          {review.draft && (
            <details open>
              <summary className="cursor-pointer text-sm font-medium">
                Generated draft
              </summary>
              <pre className="mt-3 max-h-96 overflow-auto rounded-lg border bg-muted/30 p-4 font-sans text-sm leading-6 break-words whitespace-pre-wrap">
                {review.draft}
              </pre>
              <Button
                variant="outline"
                className="mt-3"
                onClick={() => {
                  if (
                    !body ||
                    window.confirm(
                      "Replace the report editor with this generated draft?"
                    )
                  )
                    setBody(review.draft ?? "")
                }}
              >
                Use draft in editor
              </Button>
            </details>
          )}
        </section>
      </fieldset>
      <details className="rounded-xl border bg-card p-5">
        <summary className="cursor-pointer text-sm font-medium">
          Review source snapshot
        </summary>
        <div className="mt-3 space-y-4">
          {review.sources.map((source) => (
            <div key={source.entryId}>
              <h4 className="text-sm font-medium">
                {source.workDate} · {source.company} ·{" "}
                {source.project ?? "Company-level work"}
              </h4>
              <ul className="mt-2 space-y-2 pl-4 text-sm leading-6">
                {source.contributions.map((task) => (
                  <li key={task.id} className="list-disc break-words">
                    {task.description} — {task.status}
                    {task.outcome ? ` · ${task.outcome}` : ""}
                    <p className="text-xs text-muted-foreground">
                      Reference: {source.entryId}/{task.id}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </details>
      <section className="min-w-0 space-y-4 rounded-xl border bg-card p-5">
        <h3 className="font-semibold">Prepare to share</h3>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Edit out confidential names, links, and personal details before
          sharing. The export contains the saved report and only the evidence
          appendix you choose to include.
        </p>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={appendix}
            onChange={(event) => {
              setAppendix(event.target.checked)
              setPreview(false)
            }}
          />
          Include source descriptions and evidence appendix
        </label>
        <Button
          variant="outline"
          disabled={dirty || !body.trim()}
          onClick={() => setPreview(true)}
        >
          Preview export
        </Button>
        {preview && !dirty && (
          <div className="space-y-3">
            <pre className="max-h-96 overflow-auto rounded-lg border bg-card p-5 font-sans text-sm leading-6 break-words whitespace-pre-wrap">
              {exported}
            </pre>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                disabled={action.busy}
                onClick={() =>
                  void action.run(
                    () => navigator.clipboard.writeText(exported),
                    "Report copied."
                  )
                }
              >
                Copy report
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  downloadText(
                    `work-review-${review.from}-${review.to}.md`,
                    exported
                  )
                }
              >
                Download Markdown
              </Button>
              <Button variant="outline" onClick={() => printReport(exported)}>
                Print / Save as PDF
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
function printReport(text: string) {
  const frame = document.createElement("iframe")
  frame.title = "Print work review"
  frame.style.position = "fixed"
  frame.style.width = "0"
  frame.style.height = "0"
  frame.style.border = "0"
  document.body.append(frame)
  const doc = frame.contentDocument
  const win = frame.contentWindow
  if (!doc || !win) {
    frame.remove()
    return
  }
  doc.title = "Work contribution review"
  const style = doc.createElement("style")
  style.textContent =
    "@page { margin: 20mm; } body { color: #111; background: white; font: 11pt/1.6 sans-serif; } pre { font: inherit; white-space: pre-wrap; overflow-wrap: anywhere; }"
  doc.head.append(style)
  const content = doc.createElement("pre")
  content.textContent = text
  doc.body.append(content)
  win.addEventListener("afterprint", () => frame.remove(), { once: true })
  win.focus()
  win.print()
}
