import { useState } from "react"
import { Link } from "@tanstack/react-router"
import { ArrowLeftCompactIcon } from "@/components/ui/icons"
import { getJournalSetup } from "../application/journal"
import { EntryEditor } from "./entry-editor"
import type { Setup } from "./journal-page"

export function NewEntryPage({ initial }: { initial: Setup }) {
  const [setup, setSetup] = useState(initial)

  async function refresh() {
    setSetup(await getJournalSetup())
  }

  return (
    <section className="min-w-0 space-y-5 [&_input]:bg-card [&_textarea]:bg-card">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <h2 className="text-lg font-semibold">New journal</h2>
        <Link
          to="/dashboard/work-journal"
          className="inline-flex min-h-11 items-center gap-2 rounded-sm text-sm text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <ArrowLeftCompactIcon className="size-4" />
          Back to Work Journal
        </Link>
      </div>
      <EntryEditor setup={setup} refresh={refresh} />
    </section>
  )
}
