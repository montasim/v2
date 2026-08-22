import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

import { DashboardInquiriesSkeleton } from "@/components/dashboard/dashboard-skeletons"
import { InquiryStats } from "@/components/dashboard/inquiry-stats"
import { getOwnerInquiries } from "@/features/owner-dashboard/application/dashboard"
import { DashboardHeader, Inquiries, Pagination } from "@/routes/dashboard"

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
  return (
    <>
      <DashboardHeader title="Role & projects" />
      <div className="space-y-7">
        <InquiryStats {...data.stats} />
        <Inquiries data={data.items} />
      </div>
      <Pagination
        {...data}
        label="inquiries"
        onPageChange={(page) => navigate({ search: { page } })}
      />
    </>
  )
}
