import { createFileRoute } from "@tanstack/react-router"

import { DashboardStaticAnswersSkeleton } from "@/components/dashboard/dashboard-skeletons"
import { StaticAnswerCatalog } from "@/components/dashboard/static-answer-catalog"
import { getOwnerStaticAnswers } from "@/features/owner-dashboard/application/dashboard"
import { DashboardHeader } from "@/routes/dashboard"

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
      <DashboardHeader
        title="Static questions & answers"
        description="Review every exact-match assistant answer compiled into the portfolio. This page is read-only; update the source files to change an answer."
      />
      <StaticAnswerCatalog catalog={catalog} />
    </>
  )
}
