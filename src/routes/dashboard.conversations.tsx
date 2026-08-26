import { createFileRoute, useRouter } from "@tanstack/react-router"
import { z } from "zod"

import {
  DashboardEmptyState,
  DashboardPageHeader,
} from "@/components/dashboard/dashboard-page-state"
import { DashboardConversationsSkeleton } from "@/components/dashboard/dashboard-skeletons"
import {
  ConversationFilterEmptyState,
  ConversationFilters,
  ConversationModelUsage,
} from "@/components/dashboard/conversation-insights"
import { getOwnerConversations } from "@/features/owner-dashboard/application/dashboard"
import { CONVERSATION_MODEL_ALL } from "@/features/owner-dashboard/domain/conversation-filters"
import { Conversations, Pagination } from "@/routes/dashboard"

export const Route = createFileRoute("/dashboard/conversations")({
  validateSearch: z.object({
    page: z.coerce.number().int().positive().catch(1).default(1),
    q: z.string().trim().max(120).catch("").default(""),
    model: z
      .string()
      .trim()
      .max(160)
      .catch(CONVERSATION_MODEL_ALL)
      .default(CONVERSATION_MODEL_ALL),
  }),
  loaderDeps: ({ search: { model, page, q } }) => ({
    model,
    page,
    query: q,
  }),
  loader: ({ deps }) => getOwnerConversations({ data: deps }),
  pendingComponent: DashboardConversationsSkeleton,
  pendingMs: 150,
  pendingMinMs: 300,
  component: DashboardConversationsPage,
})

function DashboardConversationsPage() {
  const data = Route.useLoaderData()
  const navigate = Route.useNavigate()
  const search = Route.useSearch()
  const router = useRouter()

  function updateFilters({ model, query }: { model: string; query: string }) {
    void navigate({
      replace: true,
      search: { model, page: 1, q: query },
    })
  }

  function clearFilters() {
    updateFilters({ model: CONVERSATION_MODEL_ALL, query: "" })
  }

  return (
    <>
      <DashboardPageHeader
        title="Chat history"
        onRefresh={() => router.invalidate()}
      />
      {data.allTotal ? (
        <div className="space-y-7">
          <ConversationModelUsage
            models={data.facets.models}
            total={data.allTotal}
          />
          <ConversationFilters
            model={search.model}
            models={data.facets.models}
            query={search.q}
            resultTotal={data.total}
            onChange={updateFilters}
          />
          {data.items.length ? (
            <Conversations data={data.items} />
          ) : (
            <ConversationFilterEmptyState onClear={clearFilters} />
          )}
        </div>
      ) : (
        <DashboardEmptyState kind="conversations" />
      )}
      <Pagination
        {...data}
        label="exchanges"
        onPageChange={(page) =>
          navigate({
            search: { model: search.model, page, q: search.q },
          })
        }
      />
    </>
  )
}
