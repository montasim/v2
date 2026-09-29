import { createFileRoute, Link, notFound } from "@tanstack/react-router"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { getContactContext } from "@/features/contact/application/contact-context"
import { ContactPage } from "@/features/contact/ui/contact-page"
import { projectCatalog } from "@/lib/content/projects"
import { createMeta } from "@/lib/site"

export const Route = createFileRoute("/projects_/$slug_/contact")({
  loader: async ({ params }) => {
    const project = projectCatalog.findBySlug(params.slug)
    if (!project) throw notFound()

    const contact = await getContactContext({
      data: {
        topic: "support",
        app: params.slug,
        from: `/projects/${params.slug}`,
      },
    })

    return { contact, project, slug: params.slug }
  },
  head: ({ loaderData }) =>
    loaderData
      ? createMeta(
          `${loaderData.project.title} Support — Contact Montasim`,
          `Contact Montasim for help with ${loaderData.project.title}. Report a problem, suggest an improvement, or ask a question.`,
          `/projects/${loaderData.slug}/contact`
        )
      : {},
  component: ProjectContactPage,
})

function ProjectContactPage() {
  const { contact, project, slug } = Route.useLoaderData()

  return (
    <ContactPage
      initial={contact}
      showContextControls={false}
      breadcrumb={
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Overview</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/projects" search={{ filter: "all" }}>
                  Projects
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/projects/$slug" params={{ slug }}>
                  {project.title}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Contact support</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      }
    />
  )
}
