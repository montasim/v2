import { Link } from "@tanstack/react-router"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowRightIcon } from "@/components/ui/icons"
import type { OwnerDashboardData } from "@/features/owner-dashboard/infrastructure/dashboard.server"

export function Overview({ data }: { data: OwnerDashboardData }) {
  const stats = [
    {
      label: "Inquiries",
      value: data.inquiries.length,
      to: "/dashboard/inquiries",
    },
    {
      label: "Saved exchanges",
      value: data.conversations.length,
      to: "/dashboard/conversations",
    },
    {
      label: "Blog comments",
      value: data.comments.length,
      to: "/dashboard/comments",
    },
    {
      label: "Subscribers",
      value: data.subscriberCount,
      to: "/dashboard/subscribers",
    },
  ] as const
  const recent = [
    ...data.inquiries.slice(0, 5).map((item) => ({
      id: `inquiry-${item.id}`,
      title: item.name || "Unnamed visitor",
      preview: item.role || item.projectType || item.context || "New inquiry",
      kind: "Inquiry",
      date: item.createdAt,
      to: "/dashboard/inquiries" as const,
    })),
    ...data.conversations.slice(0, 5).map((item) => ({
      id: `chat-${item.id}`,
      title: item.question,
      preview: item.answer,
      kind: "Chat",
      date: item.createdAt,
      to: "/dashboard/conversations" as const,
    })),
    ...data.comments.slice(0, 5).map((item) => ({
      id: `comment-${item.id}`,
      title: item.name || "Unnamed visitor",
      preview: item.message,
      kind: "Comment",
      date: item.createdAt,
      to: "/dashboard/comments" as const,
    })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <section
        aria-label="Portfolio totals"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {stats.map(({ label, value, to }) => (
          <Link
            key={to}
            to={to}
            className="flex min-h-[66px] items-center justify-between gap-3 rounded-xl border bg-card p-4 hover:bg-muted"
          >
            <span className="text-sm text-muted-foreground">{label}</span>
            <strong className="text-2xl font-semibold tabular-nums">
              {value}
            </strong>
          </Link>
        ))}
      </section>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <section aria-labelledby="dashboard-recent-heading" className="min-w-0">
          <h2
            id="dashboard-recent-heading"
            className="mb-3 text-sm font-semibold"
          >
            Recent activity
          </h2>
          <Card className="overflow-hidden bg-card">
            {recent.map((item) => (
              <Link
                key={item.id}
                to={item.to}
                className="flex items-start gap-3 border-b px-4 py-4 last:border-0 hover:bg-muted"
              >
                <span
                  aria-hidden="true"
                  className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-xs font-semibold"
                >
                  {item.kind.slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-sm leading-5 font-medium">
                      {item.title}
                    </span>
                    <Badge
                      variant="secondary"
                      className="h-5 shrink-0 rounded-md py-0"
                    >
                      {item.kind}
                    </Badge>
                  </span>
                  <span className="mt-1 block truncate text-sm leading-5 text-muted-foreground">
                    {item.preview}
                  </span>
                </span>
                <time
                  dateTime={item.date}
                  className="hidden shrink-0 text-xs text-muted-foreground sm:block"
                >
                  {new Intl.DateTimeFormat("en", {
                    month: "short",
                    day: "numeric",
                  }).format(new Date(item.date))}
                </time>
                <ArrowRightIcon className="mt-1 size-3.5 shrink-0 text-muted-foreground" />
              </Link>
            ))}
            {!recent.length ? (
              <p className="p-5 text-sm text-muted-foreground">
                New inquiries, conversations, and comments will appear here.
              </p>
            ) : null}
          </Card>
        </section>
        {/* xl:pt-8 = the "Recent activity" heading (1.25rem line + 0.75rem
            margin), so these cards align with the activity card, not its heading. */}
        <div className="space-y-5 xl:pt-8">
          <Card className="bg-card">
            <h2 className="border-b px-5 py-3 text-sm font-semibold">
              Today’s work
            </h2>
            <div className="p-5">
              <p className="mb-4 text-sm leading-6 text-muted-foreground">
                Capture what you shipped while the details are fresh.
              </p>
              <Button asChild className="h-10 px-4">
                <Link to="/dashboard/work-journal">Open Work Journal</Link>
              </Button>
            </div>
          </Card>
          <Card className="bg-card">
            <h2 className="border-b px-5 py-3 text-sm font-semibold">
              Public availability
            </h2>
            <div className="p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm">
                  {data.availability.availability}
                </span>
                <Badge variant="secondary" className="rounded-md">
                  {data.availability.enabled ? "Enabled" : "Hidden"}
                </Badge>
              </div>
              <dl className="mb-4 space-y-2 text-xs text-muted-foreground">
                <div className="flex flex-wrap justify-between gap-2">
                  <dt>Work setup</dt>
                  <dd className="text-foreground">
                    {data.availability.workSetup}
                  </dd>
                </div>
                <div className="flex flex-wrap justify-between gap-2">
                  <dt>Location</dt>
                  <dd className="text-foreground">
                    {data.availability.location}
                  </dd>
                </div>
              </dl>
              <Button
                variant="outline"
                asChild
                className="h-10 rounded-lg px-3"
              >
                <Link to="/dashboard/availability">Edit availability</Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
