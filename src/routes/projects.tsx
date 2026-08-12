import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"
import { CatalogPage } from "@/components/shared/catalog-page"
import { ProjectCard } from "@/components/portfolio/project-card"
import { descriptions } from "@/lib/content/descriptions"
import { projectCatalog } from "@/lib/content/projects"
import { catalogFilterNavigation } from "@/lib/content/shared"
import { createMeta } from "@/lib/site"

export const Route = createFileRoute("/projects")({
  head: () => createMeta("Projects", descriptions.projects, "/projects"),
  validateSearch: z.object({
    filter: projectCatalog.filterSchema.catch("all").default("all"),
  }),
  component: Page,
})
function Page() {
  const { filter } = Route.useSearch()
  const navigate = Route.useNavigate()

  return (
    <CatalogPage
      title="Projects"
      description={descriptions.projects}
      filter={filter}
      filters={projectCatalog.filters}
      records={projectCatalog.records}
      matches={projectCatalog.matches}
      onFilterChange={(nextFilter) =>
        navigate(catalogFilterNavigation(nextFilter))
      }
      resultLabel="projects"
      renderRecord={(project) => (
        <ProjectCard key={project.id} project={project} />
      )}
    />
  )
}
