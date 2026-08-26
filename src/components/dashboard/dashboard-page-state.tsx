import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  ArrowClockwiseIcon,
  BriefcaseIcon,
  ChatCenteredDotsIcon,
  ChatCircleDotsIcon,
  UsersThreeIcon,
} from "@/components/ui/icons"

export function DashboardPageHeader({
  title,
  description,
  onRefresh,
}: {
  title: string
  description?: string
  onRefresh: () => Promise<unknown>
}) {
  const [refreshing, setRefreshing] = useState(false)
  const [refreshFailed, setRefreshFailed] = useState(false)

  async function refresh() {
    if (refreshing) return
    setRefreshing(true)
    setRefreshFailed(false)
    try {
      await onRefresh()
    } catch {
      setRefreshFailed(true)
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <header className="mb-7 flex items-start gap-4 border-b pb-5">
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-semibold tracking-tight text-strong-foreground sm:text-2xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      <div className="grid shrink-0 justify-items-end gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={refreshing}
          onClick={refresh}
          aria-label={refreshing ? "Refreshing data" : "Refresh data"}
        >
          <ArrowClockwiseIcon
            className={
              refreshing ? "animate-spin motion-reduce:animate-none" : ""
            }
          />
          <span className="hidden sm:inline">
            {refreshing ? "Refreshing" : "Refresh"}
          </span>
        </Button>
        {refreshFailed ? (
          <p className="text-xs text-destructive" role="alert">
            Refresh failed
          </p>
        ) : null}
      </div>
    </header>
  )
}

const emptyStates = {
  inquiries: {
    icon: BriefcaseIcon,
    title: "No inquiries yet",
    description:
      "New requests submitted through the portfolio assistant will appear here.",
  },
  conversations: {
    icon: ChatCenteredDotsIcon,
    title: "No chat exchanges saved",
    description:
      "Non-FAQ assistant questions and responses will appear here for review.",
  },
  comments: {
    icon: ChatCircleDotsIcon,
    title: "No comments to review",
    description:
      "New comments from blog discussions will appear here for moderation.",
  },
  subscribers: {
    icon: UsersThreeIcon,
    title: "No subscribers yet",
    description:
      "People who subscribe to new article notifications will appear here.",
  },
} as const

export function DashboardEmptyState({
  kind,
}: {
  kind: keyof typeof emptyStates
}) {
  const state = emptyStates[kind]
  const Icon = state.icon

  return (
    <section className="grid min-h-64 place-items-center rounded-xl border border-dashed bg-background px-6 py-12 text-center">
      <div className="max-w-sm">
        <span className="mx-auto grid size-11 place-items-center rounded-xl border bg-muted/35 text-muted-foreground">
          <Icon className="size-5" />
        </span>
        <h2 className="mt-4 text-sm font-semibold text-strong-foreground">
          {state.title}
        </h2>
        <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
          {state.description}
        </p>
      </div>
    </section>
  )
}
