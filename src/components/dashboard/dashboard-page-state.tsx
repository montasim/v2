import { useState } from "react"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
  actions,
}: {
  title: string
  description?: string
  onRefresh?: () => Promise<unknown>
  actions?: ReactNode
}) {
  const [refreshing, setRefreshing] = useState(false)
  const [refreshFailed, setRefreshFailed] = useState(false)

  async function refresh() {
    if (refreshing || !onRefresh) return
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
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-card px-4 sm:px-6">
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-semibold tracking-tight">
          {title}
        </h1>
        {description ? (
          <p
            className="mt-0.5 truncate text-xs text-muted-foreground"
            title={description}
          >
            {description}
          </p>
        ) : null}
      </div>
      <div className="relative flex shrink-0 items-center gap-2">
        {onRefresh ? (
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-lg px-3 text-foreground"
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
        ) : null}
        {actions}
        {refreshFailed ? (
          <p
            className="absolute top-full right-0 mt-1 rounded-md border border-destructive/30 bg-card px-3 py-2 text-xs text-destructive"
            role="alert"
          >
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
    <Card
      asChild
      className="grid min-h-44 place-items-center border-dashed bg-card px-6 py-8 text-center"
    >
      <section>
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
    </Card>
  )
}
