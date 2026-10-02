import { createFileRoute } from "@tanstack/react-router"

import { DashboardOverviewSkeleton } from "@/components/dashboard/dashboard-skeletons"
import { getOwnerDashboard } from "@/features/owner-dashboard/application/dashboard"
import { Overview } from "@/routes/dashboard"

export const Route = createFileRoute("/dashboard/")({
  loader: () => getOwnerDashboard(),
  pendingComponent: DashboardOverviewSkeleton,
  pendingMs: 150,
  pendingMinMs: 300,
  component: DashboardOverviewPage,
})

function DashboardOverviewPage() {
  const data = Route.useLoaderData()
  return <Overview data={data} />
}
