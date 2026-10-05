import { createFileRoute } from "@tanstack/react-router"
import { getJournalSetup } from "@/features/work-journal/application/journal"
import {
  JournalError,
  JournalPending,
} from "@/features/work-journal/ui/journal-route-state"
import { NewEntryPage } from "@/features/work-journal/ui/new-entry-page"

export const Route = createFileRoute("/dashboard/work-journal_/new")({
  loader: () => getJournalSetup(),
  pendingMs: 150,
  pendingComponent: JournalPending,
  errorComponent: JournalError,
  component: () => <NewEntryPage initial={Route.useLoaderData()} />,
})
