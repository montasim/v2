import { createFileRoute, useRouter } from "@tanstack/react-router"
import { z } from "zod"

import {
  DashboardEmptyState,
  DashboardPageHeader,
} from "@/components/dashboard/dashboard-page-state"
import { DashboardCommentsSkeleton } from "@/components/dashboard/dashboard-skeletons"
import {
  EmailDomainDistribution,
  EmailDomainFilterEmptyState,
  EmailDomainFilters,
} from "@/components/dashboard/email-domain-insights"
import { getOwnerComments } from "@/features/owner-dashboard/application/dashboard"
import { EMAIL_DOMAIN_ALL } from "@/features/owner-dashboard/domain/email-domain-filters"
import { Comments, Pagination } from "@/routes/dashboard"

export const Route = createFileRoute("/dashboard/comments")({
  validateSearch: z.object({
    page: z.coerce.number().int().positive().catch(1).default(1),
    q: z.string().trim().max(120).catch("").default(""),
    domain: z
      .string()
      .trim()
      .max(253)
      .catch(EMAIL_DOMAIN_ALL)
      .default(EMAIL_DOMAIN_ALL),
  }),
  loaderDeps: ({ search: { domain, page, q } }) => ({
    domain,
    page,
    query: q,
  }),
  loader: ({ deps }) => getOwnerComments({ data: deps }),
  pendingComponent: DashboardCommentsSkeleton,
  pendingMs: 150,
  pendingMinMs: 300,
  component: DashboardCommentsPage,
})

function DashboardCommentsPage() {
  const data = Route.useLoaderData()
  const navigate = Route.useNavigate()
  const search = Route.useSearch()
  const router = useRouter()

  function updateFilters({ domain, query }: { domain: string; query: string }) {
    void navigate({
      replace: true,
      search: { domain, page: 1, q: query },
    })
  }

  function clearFilters() {
    updateFilters({ domain: EMAIL_DOMAIN_ALL, query: "" })
  }

  return (
    <>
      <DashboardPageHeader
        title="Blog comments"
        onRefresh={() => router.invalidate()}
      />
      {data.allTotal ? (
        <div className="space-y-7">
          <EmailDomainDistribution
            domains={data.facets.domains}
            kind="comments"
            total={data.allTotal}
          />
          <EmailDomainFilters
            domain={search.domain}
            domains={data.facets.domains}
            kind="comments"
            query={search.q}
            resultTotal={data.total}
            onChange={updateFilters}
          />
          {data.items.length ? (
            <Comments data={data.items} refresh={() => router.invalidate()} />
          ) : (
            <EmailDomainFilterEmptyState
              kind="comments"
              onClear={clearFilters}
            />
          )}
        </div>
      ) : (
        <DashboardEmptyState kind="comments" />
      )}
      <Pagination
        {...data}
        label="comments"
        onPageChange={(page) =>
          navigate({
            search: { domain: search.domain, page, q: search.q },
          })
        }
      />
    </>
  )
}
