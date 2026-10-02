import type { ReactNode } from "react"
import { Skeleton } from "@/components/ui/skeleton"

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

function RecordSkeletons() {
  return (
    <div className="divide-y overflow-hidden rounded-xl border bg-card">
      {[0, 1, 2, 3, 4, 5].map((item) => (
        <div key={item} className="flex gap-3 px-4 py-4">
          <Skeleton className="size-8 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-40 max-w-full" />
            <Skeleton className="mt-2 h-4 w-3/4" />
          </div>
          <Skeleton className="hidden h-3 w-20 sm:block" />
        </div>
      ))}
    </div>
  )
}
function CollectionSkeleton({ label }: { label: string }) {
  return (
    <LoadingRegion label={label}>
      <div className="space-y-4">
        <Skeleton className="h-[50px] w-full rounded-xl border" />
        <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
          <div>
            <Skeleton className="mb-2 h-3 w-24" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div>
            <Skeleton className="mb-2 h-3 w-20" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>
        <RecordSkeletons />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-40" />
        </div>
      </div>
    </LoadingRegion>
  )
}
export function DashboardInquiriesSkeleton() {
  return <CollectionSkeleton label="Loading inquiries" />
}
export function DashboardConversationsSkeleton() {
  return <CollectionSkeleton label="Loading chat history" />
}
export function DashboardCommentsSkeleton() {
  return <CollectionSkeleton label="Loading blog comments" />
}
export function DashboardSubscribersSkeleton() {
  return <CollectionSkeleton label="Loading newsletter subscribers" />
}
export function DashboardStaticAnswersSkeleton() {
  return <CollectionSkeleton label="Loading static questions and answers" />
}
export function DashboardOverviewSkeleton() {
  return (
    <LoadingRegion label="Loading dashboard overview">
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[66px] rounded-xl border" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <div>
          <Skeleton className="mb-3 h-4 w-28" />
          <RecordSkeletons />
        </div>
        <Skeleton className="h-64 rounded-xl border" />
      </div>
    </LoadingRegion>
  )
}
export function DashboardAvailabilitySkeleton() {
  return (
    <LoadingRegion label="Loading availability settings">
      <div className="max-w-4xl rounded-xl border bg-card p-5">
        <Skeleton className="mb-6 h-10 w-64 max-w-full" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i}>
              <Skeleton className="mb-2 h-3 w-24" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ))}
        </div>
        <Skeleton className="mt-6 h-10 w-32" />
      </div>
    </LoadingRegion>
  )
}
