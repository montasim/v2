import { createFileRoute, useRouter } from "@tanstack/react-router"
import { z } from "zod"

import {
  DashboardEmptyState,
  DashboardPageHeader,
} from "@/components/dashboard/dashboard-page-state"
import { DashboardInquiriesSkeleton } from "@/components/dashboard/dashboard-skeletons"
import { InquiryStats } from "@/components/dashboard/inquiry-stats"
import { getOwnerInquiries } from "@/features/owner-dashboard/application/dashboard"
import { Inquiries, Pagination } from "@/routes/dashboard"

export const Route = createFileRoute("/dashboard/inquiries")({
  validateSearch: z.object({
    page: z.coerce.number().int().positive().catch(1).default(1),
  }),
  loaderDeps: ({ search: { page } }) => ({ page }),
  loader: ({ deps }) => getOwnerInquiries({ data: deps }),
  pendingComponent: DashboardInquiriesSkeleton,
  pendingMs: 150,
  pendingMinMs: 300,
  component: DashboardInquiriesPage,
})

function DashboardInquiriesPage() {
  const data = Route.useLoaderData()
  const navigate = Route.useNavigate()
  const router = useRouter()
  return (
    <>
      <DashboardPageHeader
        title="Inquiries"
        onRefresh={() => router.invalidate()}
      />
      {data.items.length ? (
        <div className="space-y-7">
          <InquiryStats {...data.stats} />
          <Inquiries data={data.items} />
        </div>
      ) : (
        <DashboardEmptyState kind="inquiries" />
      )}
      <Pagination
        {...data}
        label="inquiries"
        onPageChange={(page) => navigate({ search: { page } })}
      />
    </>
  )
}
