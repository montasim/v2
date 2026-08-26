import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"
import { ArrowUpRightIcon } from "@/components/ui/icons"

import { RecommendationDetails } from "@/components/portfolio/recommendations"
import { CatalogPage } from "@/components/shared/catalog-page"
import { ExternalAction } from "@/components/shared/navigation-action"
import { descriptions } from "@/lib/content/descriptions"
import {
  linkedInRecommendationsUrl,
  recommendationCatalog,
} from "@/lib/content/recommendations"
import { catalogFilterNavigation } from "@/lib/content/shared"
import { createMeta } from "@/lib/site"

export const Route = createFileRoute("/recommendations")({
  head: () =>
    createMeta(
      "Recommendations",
      descriptions.recommendations,
      "/recommendations"
    ),
  validateSearch: z.object({
    filter: recommendationCatalog.filterSchema.catch("all").default("all"),
  }),
  component: Page,
})

function Page() {
  const { filter } = Route.useSearch()
  const navigate = Route.useNavigate()

  return (
    <CatalogPage
      title="Recommendations"
      description={descriptions.recommendations}
      filter={filter}
      filters={recommendationCatalog.filters}
      records={recommendationCatalog.records}
      matches={recommendationCatalog.matches}
      onFilterChange={(nextFilter) =>
        navigate(catalogFilterNavigation(nextFilter))
      }
      resultLabel="recommendations"
      introAction={
        <ExternalAction
          href={linkedInRecommendationsUrl}
          variant="link"
          className="mt-4 h-auto p-0 font-medium text-strong-foreground"
        >
          View recommendations on LinkedIn
          <ArrowUpRightIcon />
        </ExternalAction>
      }
      renderRecord={(item, index) => (
        <RecommendationDetails
          key={`${item.name}-${item.date}`}
          item={item}
          index={index}
        />
      )}
    />
  )
}
