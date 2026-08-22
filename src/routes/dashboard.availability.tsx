import { createFileRoute, useRouter } from "@tanstack/react-router"

import { DashboardAvailabilitySkeleton } from "@/components/dashboard/dashboard-skeletons"
import { getOwnerAvailability } from "@/features/owner-dashboard/application/dashboard"
import { AvailabilityForm, DashboardHeader } from "@/routes/dashboard"

export const Route = createFileRoute("/dashboard/availability")({
  loader: () => getOwnerAvailability(),
  pendingComponent: DashboardAvailabilitySkeleton,
  pendingMs: 150,
  pendingMinMs: 300,
  component: DashboardAvailabilityPage,
})

function DashboardAvailabilityPage() {
  const settings = Route.useLoaderData()
  const router = useRouter()
  return (
    <>
      <DashboardHeader title="Availability" />
      <AvailabilityForm
        settings={settings}
        refresh={() => router.invalidate()}
      />
    </>
  )
}
