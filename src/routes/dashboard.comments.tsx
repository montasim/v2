import { createFileRoute, useRouter } from "@tanstack/react-router"
import { z } from "zod"

import {
  DashboardEmptyState,
  DashboardPageHeader,
} from "@/components/dashboard/dashboard-page-state"
import { DashboardCommentsSkeleton } from "@/components/dashboard/dashboard-skeletons"
import { getOwnerComments } from "@/features/owner-dashboard/application/dashboard"
import { Comments, Pagination } from "@/routes/dashboard"

export const Route = createFileRoute("/dashboard/comments")({
  validateSearch: z.object({
    page: z.coerce.number().int().positive().catch(1).default(1),
  }),
  loaderDeps: ({ search: { page } }) => ({ page }),
  loader: ({ deps }) => getOwnerComments({ data: deps }),
  pendingComponent: DashboardCommentsSkeleton,
  pendingMs: 150,
  pendingMinMs: 300,
  component: DashboardCommentsPage,
})

function DashboardCommentsPage() {
  const data = Route.useLoaderData()
  const navigate = Route.useNavigate()
  const router = useRouter()
  return (
    <>
      <DashboardPageHeader
        title="Blog comments"
        onRefresh={() => router.invalidate()}
      />
      {data.items.length ? (
        <Comments data={data.items} refresh={() => router.invalidate()} />
      ) : (
        <DashboardEmptyState kind="comments" />
      )}
      <Pagination
        {...data}
        label="comments"
        onPageChange={(page) => navigate({ search: { page } })}
      />
    </>
  )
}
