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
    page: z.coerce.number().int().min(1).catch(1).default(1),
  }),
  component: Page,
})
function Page() {
  const { filter, page } = Route.useSearch()
  const navigate = Route.useNavigate()

  return (
    <CatalogPage
      title="Projects"
      description={descriptions.projects}
      filter={filter}
      filters={projectCatalog.filters}
      records={projectCatalog.orderedForFilter(filter)}
      matches={projectCatalog.matches}
      onFilterChange={(nextFilter) =>
        navigate({
          ...catalogFilterNavigation(nextFilter),
          search: { filter: nextFilter, page: 1 },
        })
      }
      page={page}
      pageSize={5}
      resultsId="project-results"
      onPageChange={async (nextPage) => {
        await navigate({
          resetScroll: false,
          search: (previous) => ({ ...previous, page: nextPage }),
        })
        requestAnimationFrame(() => {
          const results = document.getElementById("project-results")
          results?.focus({ preventScroll: true })
          results?.scrollIntoView({ block: "start" })
        })
      }}
      resultLabel="projects"
      renderRecord={(project) => (
        <ProjectCard key={project.id} project={project} />
      )}
    />
  )
}
