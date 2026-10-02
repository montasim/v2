import { createFileRoute } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { getJournalSetup } from "@/features/work-journal/application/journal"
import { JournalPage } from "@/features/work-journal/ui/journal-page"

export const Route = createFileRoute("/dashboard/work-journal")({
  loader: () => getJournalSetup(),
  pendingMs: 150,
  pendingComponent: () => (
    <div role="status" className="space-y-4">
      <div className="h-12 rounded-lg bg-muted motion-safe:animate-pulse" />
      <p className="text-sm text-muted-foreground">
        Loading your private work journal…
      </p>
    </div>
  ),
  errorComponent: ({ reset }) => (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">Work Journal is unavailable</h1>
      <p className="text-sm text-muted-foreground">
        Try again. If the problem continues, check the journal database
        migration. Your other dashboard sections remain available.
      </p>
      <Button variant="outline" onClick={reset}>
        Try again
      </Button>
    </section>
  ),
  component: () => <JournalPage initial={Route.useLoaderData()} />,
})
