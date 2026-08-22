import { createFileRoute } from "@tanstack/react-router"

import { DashboardOverviewSkeleton } from "@/components/dashboard/dashboard-skeletons"
import { getOwnerDashboard } from "@/features/owner-dashboard/application/dashboard"
import { DashboardHeader, Overview } from "@/routes/dashboard"

export const Route = createFileRoute("/dashboard/")({
  loader: () => getOwnerDashboard(),
  pendingComponent: DashboardOverviewSkeleton,
  pendingMs: 150,
  pendingMinMs: 300,
  component: DashboardOverviewPage,
})

function DashboardOverviewPage() {
  const data = Route.useLoaderData()
  return (
    <>
      <DashboardHeader
        title="Overview"
        description="Monitor portfolio activity and keep your public availability current."
      />
      <Overview data={data} />
    </>
  )
}
