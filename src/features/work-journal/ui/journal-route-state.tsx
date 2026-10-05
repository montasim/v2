import { Button } from "@/components/ui/button"

export function JournalPending() {
  return (
    <div role="status" className="space-y-4">
      <div className="h-12 rounded-lg bg-muted motion-safe:animate-pulse" />
      <p className="text-sm text-muted-foreground">
        Loading your private work journal…
      </p>
    </div>
  )
}

export function JournalError({ reset }: { reset: () => void }) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Work Journal is unavailable</h2>
      <p className="text-sm text-muted-foreground">
        Try again. If the problem continues, check the journal database
        migration. Your other dashboard sections remain available.
      </p>
      <Button variant="outline" onClick={reset}>
        Try again
      </Button>
    </section>
  )
}
