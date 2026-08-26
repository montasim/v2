import { createFileRoute, useRouter } from "@tanstack/react-router"
import { z } from "zod"

import {
  DashboardEmptyState,
  DashboardPageHeader,
} from "@/components/dashboard/dashboard-page-state"
import { DashboardSubscribersSkeleton } from "@/components/dashboard/dashboard-skeletons"
import {
  EmailDomainDistribution,
  EmailDomainFilterEmptyState,
  EmailDomainFilters,
} from "@/components/dashboard/email-domain-insights"
import { Subscribers } from "@/components/dashboard/subscribers"
import { getOwnerSubscribers } from "@/features/owner-dashboard/application/dashboard"
import { EMAIL_DOMAIN_ALL } from "@/features/owner-dashboard/domain/email-domain-filters"
import { Pagination } from "@/routes/dashboard"

export const Route = createFileRoute("/dashboard/subscribers")({
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
  loader: ({ deps }) => getOwnerSubscribers({ data: deps }),
  pendingComponent: DashboardSubscribersSkeleton,
  pendingMs: 150,
  pendingMinMs: 300,
  component: DashboardSubscribersPage,
})

function DashboardSubscribersPage() {
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
        title="Newsletter subscribers"
        description="People who asked to receive new article notifications."
        onRefresh={() => router.invalidate()}
      />
      {data.allTotal ? (
        <div className="space-y-7">
          <EmailDomainDistribution
            domains={data.facets.domains}
            kind="subscribers"
            total={data.allTotal}
          />
          <EmailDomainFilters
            domain={search.domain}
            domains={data.facets.domains}
            kind="subscribers"
            query={search.q}
            resultTotal={data.total}
            onChange={updateFilters}
          />
          {data.items.length ? (
            <Subscribers data={data.items} />
          ) : (
            <EmailDomainFilterEmptyState
              kind="subscribers"
              onClear={clearFilters}
            />
          )}
        </div>
      ) : (
        <DashboardEmptyState kind="subscribers" />
      )}
      <Pagination
        {...data}
        label="subscribers"
        onPageChange={(page) =>
          navigate({
            search: { domain: search.domain, page, q: search.q },
          })
        }
      />
    </>
  )
}
