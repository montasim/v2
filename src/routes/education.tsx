import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"
import { ArrowUpRightIcon } from "@phosphor-icons/react"
import { Card, CardContent } from "@/components/ui/card"
import { EntityAvatar } from "@/components/shared/entity-avatar"
import { CatalogPage } from "@/components/shared/catalog-page"
import { ExternalAction } from "@/components/shared/navigation-action"
import { descriptions } from "@/lib/content/descriptions"
import { educationCatalog } from "@/lib/content/education"
import { catalogFilterNavigation } from "@/lib/content/shared"
import { createMeta } from "@/lib/site"

export const Route = createFileRoute("/education")({
  head: () => createMeta("Education", descriptions.education, "/education"),
  validateSearch: z.object({
    filter: educationCatalog.filterSchema.catch("all").default("all"),
  }),
  component: Page,
})
function Page() {
  const { filter } = Route.useSearch()
  const navigate = Route.useNavigate()

  return (
    <CatalogPage
      title="Education"
      description={descriptions.education}
      filter={filter}
      filters={educationCatalog.filters}
      records={educationCatalog.records}
      matches={educationCatalog.matches}
      onFilterChange={(nextFilter) =>
        navigate(catalogFilterNavigation(nextFilter))
      }
      resultLabel="education records"
      renderRecord={(item) => (
        <article key={item.id} className="grid gap-4 sm:grid-cols-[3.5rem_1fr]">
          <EntityAvatar
            src={item.logoUrl}
            fallback={item.logo}
            className="rounded-lg"
          />
          <div>
            <p className="mb-2 text-sm text-muted-foreground">{item.period}</p>
            <Card>
              <CardContent className="p-5 sm:p-6">
                <h2 className="font-semibold text-foreground">{item.degree}</h2>
                <p className="mt-1 text-sm font-medium">{item.institution}</p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {item.details}
                </p>
                {item.institutionUrl ? (
                  <ExternalAction
                    href={item.institutionUrl}
                    variant="link"
                    className="mt-5 h-auto gap-2 p-0 font-medium text-foreground"
                  >
                    Visit institution
                    <ArrowUpRightIcon />
                  </ExternalAction>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </article>
      )}
    />
  )
}
