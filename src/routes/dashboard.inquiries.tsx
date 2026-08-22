import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

import { getOwnerInquiries } from "@/features/owner-dashboard/application/dashboard"
import { DashboardHeader, Inquiries, Pagination } from "@/routes/dashboard"

export const Route = createFileRoute("/dashboard/inquiries")({
  validateSearch: z.object({
    page: z.coerce.number().int().positive().catch(1).default(1),
  }),
  loaderDeps: ({ search: { page } }) => ({ page }),
  loader: ({ deps }) => getOwnerInquiries({ data: deps }),
  component: DashboardInquiriesPage,
})

function DashboardInquiriesPage() {
  const data = Route.useLoaderData()
  const navigate = Route.useNavigate()
  return (
    <>
      <DashboardHeader title="Role & projects" />
      <Inquiries data={data.items} />
      <Pagination
        {...data}
        label="inquiries"
        onPageChange={(page) => navigate({ search: { page } })}
      />
    </>
  )
}
