import { createFileRoute } from "@tanstack/react-router"

import { ProjectStatusPage } from "@/components/portfolio/project-status-page"
import { getProjectStatus } from "@/features/project-status/application/project-status"
import { descriptions } from "@/lib/content/descriptions"
import { createMeta } from "@/lib/site"

export const Route = createFileRoute("/status")({
  head: () => createMeta("Status", descriptions.status, "/status"),
  loader: () => getProjectStatus(),
  component: Page,
})

function Page() {
  const snapshot = Route.useLoaderData()

  return (
    <ProjectStatusPage description={descriptions.status} snapshot={snapshot} />
  )
}
