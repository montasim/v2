import { createFileRoute } from "@tanstack/react-router"

import { DashboardStaticAnswersSkeleton } from "@/components/dashboard/dashboard-skeletons"
import { StaticAnswerCatalog } from "@/components/dashboard/static-answer-catalog"
import { getOwnerStaticAnswers } from "@/features/owner-dashboard/application/dashboard"

export const Route = createFileRoute("/dashboard/static-answers")({
  loader: () => getOwnerStaticAnswers(),
  pendingComponent: DashboardStaticAnswersSkeleton,
  pendingMs: 150,
  pendingMinMs: 300,
  component: DashboardStaticAnswersPage,
})

function DashboardStaticAnswersPage() {
  const catalog = Route.useLoaderData()

  return (
    <>
      <StaticAnswerCatalog catalog={catalog} />
    </>
  )
}
