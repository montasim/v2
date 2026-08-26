import type { ReactNode } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

function LoadingRegion({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div role="status" aria-busy="true" aria-label={label}>
      {children}
      <span className="sr-only">{label}</span>
    </div>
  )
}

function HeaderSkeleton({
  width = "w-40",
  description = false,
}: {
  width?: string
  description?: boolean
}) {
  return (
    <header className="mb-7 border-b pb-5">
      <Skeleton className={cn("h-7", width)} />
      {description ? <Skeleton className="mt-3 h-4 w-96 max-w-full" /> : null}
    </header>
  )
}

function PaginationSkeleton() {
  return (
    <div className="mt-6 flex items-center border-t pt-5">
      <Skeleton className="h-3 w-32" />
      <div className="ml-auto flex gap-1">
        <Skeleton className="size-8 rounded-lg" />
        <Skeleton className="size-8 rounded-lg" />
        <Skeleton className="size-8 rounded-lg" />
      </div>
    </div>
  )
}

export function DashboardOverviewSkeleton() {
  return (
    <LoadingRegion label="Loading dashboard overview">
      <HeaderSkeleton width="w-28" description />
      <div className="space-y-7">
        <section>
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-2 h-3 w-72 max-w-full" />
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <div
                key={item}
                className="flex min-h-40 flex-col rounded-xl border bg-background p-5"
              >
                <div className="flex items-start justify-between">
                  <Skeleton className="size-9 rounded-lg" />
                  <Skeleton className="size-4" />
                </div>
                <Skeleton className="mt-5 h-7 w-12" />
                <Skeleton className="mt-2 h-3 w-3/4" />
                <Skeleton className="mt-auto h-2.5 w-2/3" />
              </div>
            ))}
          </div>
        </section>

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(17rem,1fr)]">
          <section className="overflow-hidden rounded-xl border bg-background">
            <div className="flex items-center border-b px-5 py-4">
              <div>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="mt-2 h-3 w-40" />
              </div>
              <Skeleton className="ml-auto h-8 w-20 rounded-lg" />
            </div>
            <div className="divide-y">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-5 py-4"
                >
                  <Skeleton className="size-9 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="mt-2 h-3 w-40 max-w-full" />
                  </div>
                  <div className="grid justify-items-end">
                    <Skeleton className="h-6 w-14 rounded-full" />
                    <Skeleton className="mt-2 h-2.5 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border bg-background">
            <div className="border-b px-5 py-4">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="mt-2 h-3 w-32" />
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3">
                <Skeleton className="size-2.5 rounded-full" />
                <Skeleton className="h-5 w-36" />
              </div>
              <div className="mt-5 divide-y overflow-hidden rounded-lg border">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="p-4">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="mt-2 h-4 w-32" />
                  </div>
                ))}
              </div>
              <Skeleton className="mt-4 h-9 w-full rounded-lg" />
            </div>
          </section>
        </div>
      </div>
    </LoadingRegion>
  )
}

function InquiryStatsSkeleton() {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-2 h-3 w-64 max-w-[65vw]" />
        </div>
        <Skeleton className="h-7 w-24 rounded-full" />
      </div>

      <div className="overflow-hidden rounded-xl border bg-background">
        <div className="grid xl:grid-cols-2 xl:divide-x">
          <div className="p-5 sm:p-6 xl:p-7">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="mt-2 h-3 w-36" />
            <div className="mt-6 space-y-5">
              {["w-full", "w-4/5", "w-3/5", "w-2/5"].map((width) => (
                <div
                  key={width}
                  className="grid grid-cols-[1.75rem_minmax(0,1fr)_2.5rem] items-center gap-3"
                >
                  <Skeleton className="h-3 w-5" />
                  <div>
                    <Skeleton className="mb-2 h-3 w-28" />
                    <Skeleton className={cn("h-2 rounded-full", width)} />
                  </div>
                  <Skeleton className="ml-auto h-7 w-7" />
                </div>
              ))}
            </div>
          </div>

          <div className="border-t p-5 sm:p-6 xl:border-t-0 xl:p-7">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="mt-2 h-3 w-32" />
            <Skeleton className="mt-6 h-5 w-full rounded-md" />
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {[0, 1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-lg border px-3 py-2.5"
                >
                  <Skeleton className="h-8 w-1 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="mt-2 h-2.5 w-24" />
                  </div>
                  <Skeleton className="size-4" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function PersonHeaderSkeleton({ action = false }: { action?: boolean }) {
  return (
    <header className="flex items-center gap-3 border-b bg-muted/20 px-5 py-4 sm:px-6">
      <Skeleton className="size-10 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-2 h-3 w-44 max-w-full" />
      </div>
      <Skeleton className={action ? "size-8 rounded-lg" : "h-6 w-16"} />
    </header>
  )
}

function InquiryCardSkeleton() {
  return (
    <article className="overflow-hidden rounded-xl border bg-background">
      <PersonHeaderSkeleton />
      <div className="p-5 sm:p-6">
        <div className="grid divide-y overflow-hidden rounded-lg border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          {[0, 1].map((item) => (
            <div key={item} className="p-4">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-2 h-4 w-40 max-w-full" />
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-lg bg-muted/45 p-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-3 h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-3/4" />
        </div>
        <footer className="mt-5 flex items-center border-t pt-4">
          <Skeleton className="h-3 w-36" />
          <Skeleton className="ml-auto h-8 w-20 rounded-lg" />
        </footer>
      </div>
    </article>
  )
}

export function DashboardInquiriesSkeleton() {
  return (
    <LoadingRegion label="Loading inquiries">
      <HeaderSkeleton width="w-44" />
      <div className="space-y-7">
        <InquiryStatsSkeleton />
        <div className="grid gap-4">
          <InquiryCardSkeleton />
          <InquiryCardSkeleton />
        </div>
      </div>
      <PaginationSkeleton />
    </LoadingRegion>
  )
}

function ConversationCardSkeleton({ short = false }: { short?: boolean }) {
  return (
    <article className="overflow-hidden rounded-xl border bg-background">
      <div className="border-b bg-muted/35 px-5 py-4">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="mt-3 h-4 w-4/5" />
      </div>
      <div className="px-5 py-4">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="mt-2 h-3 w-11/12" />
        {!short ? <Skeleton className="mt-2 h-3 w-2/3" /> : null}
        <div className="mt-4 border-t pt-3">
          <Skeleton className="h-2.5 w-48" />
        </div>
      </div>
    </article>
  )
}

export function DashboardConversationsSkeleton() {
  return (
    <LoadingRegion label="Loading chat history">
      <HeaderSkeleton width="w-32" />
      <div className="grid gap-4">
        <ConversationCardSkeleton />
        <ConversationCardSkeleton short />
        <ConversationCardSkeleton />
      </div>
      <PaginationSkeleton />
    </LoadingRegion>
  )
}

export function DashboardStaticAnswersSkeleton() {
  return (
    <LoadingRegion label="Loading static questions and answers">
      <HeaderSkeleton width="w-64" description />
      <div className="space-y-6">
        <div>
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-2 h-3 w-64 max-w-full" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-20 rounded-md" />
              <Skeleton className="h-3 w-36" />
            </div>
          </div>
          <div className="grid items-center gap-6 rounded-xl border bg-background p-5 sm:p-6 lg:grid-cols-[minmax(15rem,0.8fr)_minmax(0,1.2fr)] lg:gap-10">
            <div className="grid place-items-center">
              <Skeleton className="grid size-52 place-items-center rounded-full">
                <span className="size-28 rounded-full bg-background" />
              </Skeleton>
            </div>
            <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {[0, 1, 2, 3, 4, 5].map((item) => (
                <div
                  key={item}
                  className="flex min-h-11 items-center gap-3 border-b border-border/70 py-2"
                >
                  <Skeleton className="size-2.5 shrink-0 rounded-sm" />
                  <Skeleton
                    className={cn("h-3", item % 2 === 0 ? "w-24" : "w-32")}
                  />
                  <div className="ml-auto">
                    <Skeleton className="h-3 w-7" />
                    <Skeleton className="mt-1.5 h-2 w-6" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-3 rounded-xl border bg-background p-5 sm:grid-cols-[minmax(0,1fr)_minmax(13rem,0.38fr)]">
          <div>
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-2 h-10 w-full rounded-lg" />
          </div>
          <div>
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-2 h-10 w-full rounded-lg" />
          </div>
        </div>

        <div className="space-y-4">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="rounded-xl border bg-background px-5 py-6"
            >
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-24 rounded-md" />
                <Skeleton className="h-3 w-10" />
              </div>
              <Skeleton className="mt-4 h-4 w-4/5" />
              <Skeleton className="mt-4 h-3 w-full" />
              <Skeleton className="mt-2 h-3 w-11/12" />
              <Skeleton className="mt-2 h-3 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </LoadingRegion>
  )
}

function CommentCardSkeleton() {
  return (
    <article className="overflow-hidden rounded-xl border bg-background">
      <PersonHeaderSkeleton action />
      <div className="p-5 sm:p-6">
        <div className="rounded-lg bg-muted/45 p-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-3 h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-4/5" />
        </div>
        <footer className="mt-5 flex items-end border-t pt-4">
          <div>
            <Skeleton className="h-3 w-12" />
            <Skeleton className="mt-2 h-4 w-64 max-w-[65vw]" />
          </div>
          <Skeleton className="ml-auto h-3 w-24" />
        </footer>
      </div>
    </article>
  )
}

export function DashboardCommentsSkeleton() {
  return (
    <LoadingRegion label="Loading blog comments">
      <HeaderSkeleton width="w-36" />
      <div className="grid gap-4">
        <CommentCardSkeleton />
        <CommentCardSkeleton />
      </div>
      <PaginationSkeleton />
    </LoadingRegion>
  )
}

export function DashboardSubscribersSkeleton() {
  return (
    <LoadingRegion label="Loading newsletter subscribers">
      <HeaderSkeleton width="w-48" description />
      <div className="overflow-hidden rounded-xl border bg-background">
        {[0, 1, 2, 3].map((item) => (
          <div
            key={item}
            className="flex items-center gap-4 border-b px-5 py-4 last:border-b-0"
          >
            <Skeleton className="size-9 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-4 w-52 max-w-full" />
              <Skeleton className="mt-2 h-3 w-32" />
            </div>
            <Skeleton className="h-6 w-20 rounded-md" />
          </div>
        ))}
      </div>
      <PaginationSkeleton />
    </LoadingRegion>
  )
}

export function DashboardAvailabilitySkeleton() {
  return (
    <LoadingRegion label="Loading availability settings">
      <HeaderSkeleton width="w-32" />
      <div className="rounded-xl border bg-background">
        <div className="flex items-center gap-4 border-b p-5">
          <div className="flex-1">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="mt-2 h-3 w-80 max-w-[65vw]" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <div className="grid gap-5 p-5 sm:grid-cols-2">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((item) => (
            <div key={item} className={cn(item === 2 && "sm:col-span-2")}>
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-2 h-10 w-full rounded-lg" />
            </div>
          ))}
        </div>
        <div className="border-t px-5 py-4">
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </div>
    </LoadingRegion>
  )
}
