import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"
import { CertificationCard } from "@/components/portfolio/certification-card"
import { CatalogPage } from "@/components/shared/catalog-page"
import { descriptions } from "@/lib/content/descriptions"
import { certificationCatalog } from "@/lib/content/certifications"
import { catalogFilterNavigation } from "@/lib/content/shared"
import { createMeta } from "@/lib/site"

export const Route = createFileRoute("/certifications")({
  head: () =>
    createMeta(
      "Certifications",
      descriptions.certifications,
      "/certifications"
    ),
  validateSearch: z.object({
    filter: certificationCatalog.filterSchema.catch("all").default("all"),
  }),
  component: Page,
})
function Page() {
  const { filter } = Route.useSearch()
  const navigate = Route.useNavigate()

  return (
    <CatalogPage
      title="Certifications"
      description={descriptions.certifications}
      filter={filter}
      filters={certificationCatalog.filters}
      records={certificationCatalog.records}
      matches={certificationCatalog.matches}
      onFilterChange={(nextFilter) =>
        navigate(catalogFilterNavigation(nextFilter))
      }
      resultLabel="certifications"
      renderRecord={(item) => <CertificationCard key={item.id} item={item} />}
    />
  )
}
