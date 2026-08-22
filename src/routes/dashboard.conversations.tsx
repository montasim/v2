import { createFileRoute, useRouter } from "@tanstack/react-router"
import { z } from "zod"

import {
  DashboardEmptyState,
  DashboardPageHeader,
} from "@/components/dashboard/dashboard-page-state"
import { DashboardConversationsSkeleton } from "@/components/dashboard/dashboard-skeletons"
import { getOwnerConversations } from "@/features/owner-dashboard/application/dashboard"
import { Conversations, Pagination } from "@/routes/dashboard"

export const Route = createFileRoute("/dashboard/conversations")({
  validateSearch: z.object({
    page: z.coerce.number().int().positive().catch(1).default(1),
  }),
  loaderDeps: ({ search: { page } }) => ({ page }),
  loader: ({ deps }) => getOwnerConversations({ data: deps }),
  pendingComponent: DashboardConversationsSkeleton,
  pendingMs: 150,
  pendingMinMs: 300,
  component: DashboardConversationsPage,
})

function DashboardConversationsPage() {
  const data = Route.useLoaderData()
  const navigate = Route.useNavigate()
  const router = useRouter()
  return (
    <>
      <DashboardPageHeader
        title="Chat history"
        onRefresh={() => router.invalidate()}
      />
      {data.items.length ? (
        <Conversations data={data.items} />
      ) : (
        <DashboardEmptyState kind="conversations" />
      )}
      <Pagination
        {...data}
        label="exchanges"
        onPageChange={(page) => navigate({ search: { page } })}
      />
    </>
  )
}
