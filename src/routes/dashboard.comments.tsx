import { createFileRoute, useRouter } from "@tanstack/react-router"
import { z } from "zod"

import { DashboardCommentsSkeleton } from "@/components/dashboard/dashboard-skeletons"
import { getOwnerComments } from "@/features/owner-dashboard/application/dashboard"
import { Comments, DashboardHeader, Pagination } from "@/routes/dashboard"

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
      <DashboardHeader title="Blog comments" />
      <Comments data={data.items} refresh={() => router.invalidate()} />
      <Pagination
        {...data}
        label="comments"
        onPageChange={(page) => navigate({ search: { page } })}
      />
    </>
  )
}
