import { createFileRoute, useRouter } from "@tanstack/react-router"
import { z } from "zod"

import {
  DashboardEmptyState,
  DashboardPageHeader,
} from "@/components/dashboard/dashboard-page-state"
import { DashboardInquiriesSkeleton } from "@/components/dashboard/dashboard-skeletons"
import {
  InquiryFilterEmptyState,
  InquiryFilters,
} from "@/components/dashboard/inquiry-filters"
import { InquiryStats } from "@/components/dashboard/inquiry-stats"
import { getOwnerInquiries } from "@/features/owner-dashboard/application/dashboard"
import { inquiryTypeFilters } from "@/features/owner-dashboard/domain/inquiry-filters"
import { Inquiries, Pagination } from "@/routes/dashboard"

export const Route = createFileRoute("/dashboard/inquiries")({
  validateSearch: z.object({
    page: z.coerce.number().int().positive().catch(1).default(1),
    q: z.string().trim().max(120).catch("").default(""),
    type: z.enum(inquiryTypeFilters).catch("all").default("all"),
  }),
  loaderDeps: ({ search: { page, q, type } }) => ({
    page,
    query: q,
    type,
  }),
  loader: ({ deps }) => getOwnerInquiries({ data: deps }),
  pendingComponent: DashboardInquiriesSkeleton,
  pendingMs: 150,
  pendingMinMs: 300,
  component: DashboardInquiriesPage,
})

function DashboardInquiriesPage() {
  const data = Route.useLoaderData()
  const navigate = Route.useNavigate()
  const search = Route.useSearch()
  const router = useRouter()

  function updateFilters({
    query,
    type,
  }: {
    query: string
    type: (typeof inquiryTypeFilters)[number]
  }) {
    void navigate({
      replace: true,
      search: { page: 1, q: query, type },
    })
  }

  function clearFilters() {
    updateFilters({ query: "", type: "all" })
  }

  return (
    <>
      <DashboardPageHeader
        title="Inquiries"
        onRefresh={() => router.invalidate()}
      />
      {data.allTotal ? (
        <div className="space-y-7">
          <InquiryStats {...data.stats} />
          <InquiryFilters
            query={search.q}
            type={search.type}
            typeCounts={data.facets.types}
            resultTotal={data.total}
            onChange={updateFilters}
          />
          {data.items.length ? (
            <Inquiries data={data.items} />
          ) : (
            <InquiryFilterEmptyState onClear={clearFilters} />
          )}
        </div>
      ) : (
        <DashboardEmptyState kind="inquiries" />
      )}
      <Pagination
        {...data}
        label="inquiries"
        onPageChange={(page) =>
          navigate({
            search: { page, q: search.q, type: search.type },
          })
        }
      />
    </>
  )
}
