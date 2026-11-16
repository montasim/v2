import { createFileRoute, stripSearchParams } from "@tanstack/react-router"
import { z } from "zod"
import { Card, cardInsetClassName } from "@/components/ui/card"
import { EntityAvatar } from "@/components/shared/entity-avatar"
import { CatalogPage } from "@/components/shared/catalog-page"
import { ExternalLink } from "@/components/shared/navigation-action"
import { descriptions } from "@/lib/content/descriptions"
import { educationCatalog } from "@/lib/content/education"
import { catalogFilterNavigation } from "@/lib/content/shared"
import { createMeta } from "@/lib/site"

export const Route = createFileRoute("/education")({
  head: () => createMeta("Education", descriptions.education, "/education"),
  validateSearch: z.object({
    filter: educationCatalog.filterSchema.catch("all").default("all"),
  }),
  search: { middlewares: [stripSearchParams({ filter: "all" })] },
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
        <Card key={item.id} asChild className={cardInsetClassName}>
          <article>
            <header className="flex items-start gap-3">
              <EntityAvatar
                src={item.logoUrl}
                fallback={item.logo}
                className="mt-0.5 size-9 border-0"
                imageClassName="object-contain"
              />
              <div>
                <h2 className="text-sm font-semibold text-strong-foreground">
                  {item.degree}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.institutionUrl ? (
                    <ExternalLink
                      href={item.institutionUrl}
                      className="rounded-sm underline-offset-4 hover:text-foreground link-underline focus-visible:outline-2 focus-visible:outline-offset-4"
                    >
                      {item.institution}
                    </ExternalLink>
                  ) : (
                    item.institution
                  )}
                  {item.period ? ` · ${item.period}` : null}
                </p>
              </div>
            </header>
            <p className="mt-4 ml-12 text-sm leading-relaxed text-muted-foreground">
              {item.details}
            </p>
          </article>
        </Card>
      )}
    />
  )
}
