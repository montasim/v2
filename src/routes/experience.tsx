import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"
import { ExperienceList } from "@/components/portfolio/experience-list"
import { CatalogPage } from "@/components/shared/catalog-page"
import { createMeta } from "@/lib/site"
import { descriptions } from "@/lib/content/descriptions"
import { experienceCatalog } from "@/lib/content/experience"
import { catalogFilterNavigation } from "@/lib/content/shared"

export const Route = createFileRoute("/experience")({
  head: () => createMeta("Experience", descriptions.experience, "/experience"),
  validateSearch: z.object({
    filter: experienceCatalog.filterSchema.catch("all").default("all"),
  }),
  component: Page,
})
function Page() {
  const { filter } = Route.useSearch()
  const navigate = Route.useNavigate()

  return (
    <CatalogPage
      title="Experience"
      description={descriptions.experience}
      filter={filter}
      filters={experienceCatalog.filters}
      records={experienceCatalog.records}
      matches={experienceCatalog.matches}
      onFilterChange={(nextFilter) =>
        navigate(catalogFilterNavigation(nextFilter))
      }
      resultLabel="roles"
      renderRecords={(records) => <ExperienceList card records={records} />}
      emptyState={
        <p className="py-8 text-sm text-muted-foreground">
          Independent work and venture details haven’t been added yet.
        </p>
      }
    />
  )
}
