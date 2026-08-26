import { Badge } from "@/components/ui/badge"
import { EnvelopeSimpleIcon } from "@/components/ui/icons"
import type { OwnerSubscriberPage } from "@/features/owner-dashboard/infrastructure/dashboard.server"
import { cn } from "@/lib/utils"

function formatSubscriptionDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function confirmationLabel(state: string) {
  if (state === "sent") return "Email sent"
  if (state === "failed") return "Email failed"
  if (state === "sending") return "Sending"
  return "Pending"
}

export function Subscribers({ data }: { data: OwnerSubscriberPage["items"] }) {
  return (
    <section
      className="overflow-hidden rounded-xl border bg-background"
      aria-label="Newsletter subscribers"
    >
      <div className="divide-y">
        {data.map((subscriber) => (
          <article
            key={subscriber.id}
            className="grid gap-3 px-5 py-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:gap-4 sm:px-6"
          >
            <span className="hidden size-9 place-items-center rounded-lg border bg-muted/35 text-muted-foreground sm:grid">
              <EnvelopeSimpleIcon className="size-4" />
            </span>
            <div className="min-w-0">
              <a
                href={`mailto:${subscriber.email}`}
                className="block w-fit max-w-full truncate text-sm font-semibold text-emphasis-foreground underline-offset-4 hover:underline"
              >
                {subscriber.email}
              </a>
              <p className="mt-1 text-xs text-muted-foreground">
                Subscribed {formatSubscriptionDate(subscriber.createdAt)}
              </p>
            </div>
            <Badge
              variant={
                subscriber.confirmationState === "sent"
                  ? "secondary"
                  : "outline"
              }
              className={cn(
                "w-fit shrink-0",
                subscriber.confirmationState === "failed" &&
                  "border-destructive/30 text-destructive"
              )}
            >
              {confirmationLabel(subscriber.confirmationState)}
            </Badge>
          </article>
        ))}
      </div>
    </section>
  )
}
