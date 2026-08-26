import { createFileRoute, useRouter } from "@tanstack/react-router"
import { z } from "zod"

import {
  DashboardEmptyState,
  DashboardPageHeader,
} from "@/components/dashboard/dashboard-page-state"
import { DashboardSubscribersSkeleton } from "@/components/dashboard/dashboard-skeletons"
import { Subscribers } from "@/components/dashboard/subscribers"
import { getOwnerSubscribers } from "@/features/owner-dashboard/application/dashboard"
import { Pagination } from "@/routes/dashboard"

export const Route = createFileRoute("/dashboard/subscribers")({
  validateSearch: z.object({
    page: z.coerce.number().int().positive().catch(1).default(1),
  }),
  loaderDeps: ({ search: { page } }) => ({ page }),
  loader: ({ deps }) => getOwnerSubscribers({ data: deps }),
  pendingComponent: DashboardSubscribersSkeleton,
  pendingMs: 150,
  pendingMinMs: 300,
  component: DashboardSubscribersPage,
})

function DashboardSubscribersPage() {
  const data = Route.useLoaderData()
  const navigate = Route.useNavigate()
  const router = useRouter()

  return (
    <>
      <DashboardPageHeader
        title="Newsletter subscribers"
        description="People who asked to receive new article notifications."
        onRefresh={() => router.invalidate()}
      />
      {data.items.length ? (
        <Subscribers data={data.items} />
      ) : (
        <DashboardEmptyState kind="subscribers" />
      )}
      <Pagination
        {...data}
        label="subscribers"
        onPageChange={(page) => navigate({ search: { page } })}
      />
    </>
  )
}
