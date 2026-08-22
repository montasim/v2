import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

import { getOwnerConversations } from "@/features/owner-dashboard/application/dashboard"
import { Conversations, DashboardHeader, Pagination } from "@/routes/dashboard"

export const Route = createFileRoute("/dashboard/conversations")({
  validateSearch: z.object({
    page: z.coerce.number().int().positive().catch(1).default(1),
  }),
  loaderDeps: ({ search: { page } }) => ({ page }),
  loader: ({ deps }) => getOwnerConversations({ data: deps }),
  component: DashboardConversationsPage,
})

function DashboardConversationsPage() {
  const data = Route.useLoaderData()
  const navigate = Route.useNavigate()
  return (
    <>
      <DashboardHeader title="Chat history" />
      <Conversations data={data.items} />
      <Pagination
        {...data}
        label="exchanges"
        onPageChange={(page) => navigate({ search: { page } })}
      />
    </>
  )
}
