import { useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog"
import { getJournalSetup } from "../application/journal"
import { EntryEditor, ExistingEntry } from "./entry-editor"
import { History } from "./history"
import { Manage } from "./manage"
import { ReviewDetail, Reviews } from "./reviews"

export type Setup = Awaited<ReturnType<typeof getJournalSetup>>
type View = "today" | "history" | "reviews" | "manage" | "entry" | "review"
export function JournalPage({ initial }: { initial: Setup }) {
  const [setup, setSetup] = useState(initial)
  const [view, setView] = useState<View>("today")
  const [id, setId] = useState("")
  const [newKey, setNewKey] = useState(0)
  const [dirty, setDirty] = useState(false)
  const [pending, setPending] = useState<{ view: View; id: string } | null>(
    null
  )
  const onDirty = useCallback((value: boolean) => setDirty(value), [])
  async function refresh() {
    setSetup(await getJournalSetup())
  }
  function navigate(next: View, recordId = "", skipGuard = false) {
    if (next === view && recordId === id) return
    if (!skipGuard && dirty) {
      setPending({ view: next, id: recordId })
      return
    }
    setPending(null)
    setDirty(false)
    setView(next)
    setId(recordId)
    if (next === "today") setNewKey((key) => key + 1)
  }
  return (
    <>
      <nav
        aria-label="Work journal views"
        className="mb-5 overflow-x-auto border-b"
      >
        <div
          role="tablist"
          aria-label="Work journal views"
          className="flex gap-6"
          onKeyDown={(event) => {
            if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
              return
            const tabs = Array.from(
              event.currentTarget.querySelectorAll<HTMLButtonElement>(
                '[role="tab"]'
              )
            )
            const index = tabs.indexOf(
              document.activeElement as HTMLButtonElement
            )
            const next =
              event.key === "Home"
                ? 0
                : event.key === "End"
                  ? tabs.length - 1
                  : (index +
                      (event.key === "ArrowRight" ? 1 : -1) +
                      tabs.length) %
                    tabs.length
            event.preventDefault()
            tabs[next]?.focus()
          }}
        >
          {(
            [
              ["today", "Today"],
              ["history", "History"],
              ["reviews", "Reviews"],
              ["manage", "Companies & projects"],
            ] as const
          ).map(([key, label]) => {
            const selected =
              view === key ||
              (key === "history" && view === "entry") ||
              (key === "reviews" && view === "review")
            return (
              <button
                key={key}
                id={`journal-tab-${key}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls="journal-view"
                tabIndex={selected ? 0 : -1}
                className={`shrink-0 border-b-2 py-3 text-sm outline-offset-[-2px] focus-visible:outline-2 ${selected ? "border-foreground font-semibold text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                onClick={() => navigate(key)}
              >
                {label}
              </button>
            )
          })}
        </div>
      </nav>
      <div
        id="journal-view"
        role="tabpanel"
        aria-labelledby={`journal-tab-${view === "entry" ? "history" : view === "review" ? "reviews" : view}`}
        className="min-w-0 [&_input]:bg-card [&_textarea]:bg-card"
      >
        {view === "today" && (
          <EntryEditor
            key={newKey}
            setup={setup}
            onDirty={onDirty}
            refresh={refresh}
          />
        )}
        {view === "entry" && (
          <ExistingEntry
            id={id}
            setup={setup}
            onDirty={onDirty}
            refresh={refresh}
          />
        )}
        {view === "history" && (
          <History
            setup={setup}
            openEntry={(entryId) => navigate("entry", entryId)}
          />
        )}
        {view === "manage" && (
          <Manage setup={setup} refresh={refresh} onDirty={onDirty} />
        )}
        {view === "reviews" && (
          <Reviews
            setup={setup}
            onDirty={onDirty}
            openReview={(reviewId, saved) =>
              navigate("review", reviewId, saved)
            }
          />
        )}
        {view === "review" && (
          <ReviewDetail id={id} setup={setup} onDirty={onDirty} />
        )}
      </div>
      <Dialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
      >
        <DialogContent>
          <DialogTitle>Discard unsaved changes?</DialogTitle>
          <DialogDescription>
            Keep editing to save your work, or discard these changes and switch
            views.
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)}>
              Keep editing
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                pending && navigate(pending.view, pending.id, true)
              }
            >
              Discard and switch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
