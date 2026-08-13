import { createFileRoute, Link } from "@tanstack/react-router"
import { ResumeView } from "@/components/portfolio/resume-view"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { PageShell } from "@/components/shared/page-shell"
import { descriptions } from "@/lib/content/descriptions"
import { createMeta } from "@/lib/site"

export const Route = createFileRoute("/resume")({
  head: () => createMeta("Resume", descriptions.resume, "/resume"),
  component: Page,
})
function Page() {
  return (
    <PageShell padded>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/">Overview</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Resume</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <ResumeView />
    </PageShell>
  )
}
