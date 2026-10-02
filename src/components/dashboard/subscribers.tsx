import { Badge } from "@/components/ui/badge"
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
      aria-label="Newsletter subscribers"
      className="overflow-hidden rounded-xl border bg-card"
    >
      <table className="w-full table-fixed text-left text-sm">
        <caption className="sr-only">
          Newsletter subscribers and confirmation email delivery
        </caption>
        <thead className="border-b bg-muted/25 text-xs text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">
              Email
            </th>
            <th
              scope="col"
              className="hidden w-52 px-4 py-3 font-medium sm:table-cell"
            >
              Subscribed
            </th>
            <th scope="col" className="w-32 px-4 py-3 font-medium">
              Confirmation
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {data.map((subscriber) => (
            <tr key={subscriber.id} className="hover:bg-muted/25">
              <td className="px-4 py-3">
                <a
                  href={`mailto:${subscriber.email}`}
                  className="block w-fit max-w-full font-medium break-all text-strong-foreground underline-offset-4 hover:underline"
                >
                  {subscriber.email}
                </a>
                <span className="mt-1 block text-xs text-muted-foreground sm:hidden">
                  {formatSubscriptionDate(subscriber.createdAt)}
                </span>
              </td>
              <td className="hidden px-4 py-3 text-xs text-muted-foreground sm:table-cell">
                <time dateTime={subscriber.createdAt}>
                  {formatSubscriptionDate(subscriber.createdAt)}
                </time>
              </td>
              <td className="px-4 py-3">
                <Badge
                  variant={
                    subscriber.confirmationState === "sent"
                      ? "secondary"
                      : "outline"
                  }
                  className={cn(
                    "w-fit",
                    subscriber.confirmationState === "failed" &&
                      "border-destructive/30 text-destructive"
                  )}
                >
                  {confirmationLabel(subscriber.confirmationState)}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
