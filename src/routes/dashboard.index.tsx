import { createFileRoute } from "@tanstack/react-router"

import { getOwnerDashboard } from "@/features/owner-dashboard/application/dashboard"
import { DashboardHeader, Overview } from "@/routes/dashboard"

export const Route = createFileRoute("/dashboard/")({
  loader: () => getOwnerDashboard(),
  component: DashboardOverviewPage,
})

function DashboardOverviewPage() {
  const data = Route.useLoaderData()
  return (
    <>
      <DashboardHeader title="Overview" />
      <Overview data={data} />
    </>
  )
}
