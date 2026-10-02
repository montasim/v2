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
      <header className="mb-6 border-b pb-5">
        <h1 className="text-xl font-semibold tracking-tight text-strong-foreground sm:text-2xl">
          Work Journal
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          A private record of your work, the difference it made, and what you
          learned.
        </p>
      </header>
      <nav
        aria-label="Work journal views"
        className="mb-7 flex flex-wrap gap-2"
      >
        {(
          [
            ["today", "Today"],
            ["history", "History"],
            ["reviews", "Reviews"],
            ["manage", "Companies & projects"],
          ] as const
        ).map(([key, label]) => (
          <Button
            key={key}
            variant={
              view === key ||
              (key === "history" && view === "entry") ||
              (key === "reviews" && view === "review")
                ? "secondary"
                : "ghost"
            }
            aria-current={view === key ? "page" : undefined}
            onClick={() => navigate(key)}
          >
            {label}
          </Button>
        ))}
      </nav>
      <div className="max-w-5xl">
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
