import * as React from "react"
import { createFileRoute } from "@tanstack/react-router"
import { ArrowUpRightIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { EntityAvatar } from "@/components/shared/entity-avatar"
import { FilterBar } from "@/components/shared/filter-bar"
import { FooterActions, PageIntro } from "@/components/shared/page-intro"
import { PageShell } from "@/components/shared/page-shell"
import { ResultsGrid } from "@/components/shared/results-grid"
import { descriptions, education } from "@/lib/content"
import { createMeta } from "@/lib/site"

const filters = [
  { value: "all", label: "All education" },
  { value: "bsc", label: "B.Sc." },
  { value: "hsc", label: "HSC" },
  { value: "ssc", label: "SSC" },
]
function typeOf(degree: string) {
  if (degree.includes("Higher Secondary")) return "hsc"
  if (degree.includes("Secondary School")) return "ssc"
  return "bsc"
}
export const Route = createFileRoute("/education")({
  head: () => createMeta("Education", descriptions.education, "/education"),
  component: Page,
})
function Page() {
  const [filter, setFilter] = React.useState("all")
  const visible = education.filter(
    (item) => filter === "all" || typeOf(item.degree) === filter
  )
  return (
    <PageShell padded>
      <PageIntro title="Education" description={descriptions.education} />
      <FilterBar value={filter} onValueChange={setFilter} items={filters} />
      <ResultsGrid aria-label="Education history">
        {visible.map((item) => (
          <article
            key={item.id}
            className="grid gap-4 sm:grid-cols-[3.5rem_1fr]"
          >
            <EntityAvatar
              src={item.logoUrl}
              fallback={item.logo}
              className="rounded-lg"
            />
            <div>
              <p className="mb-2 text-sm text-muted-foreground">
                {item.period}
              </p>
              <Card>
                <CardContent className="p-5 sm:p-6">
                  <h2 className="font-semibold text-foreground">
                    {item.degree}
                  </h2>
                  <p className="mt-1 text-sm font-medium">{item.institution}</p>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {item.details}
                  </p>
                  {item.institutionUrl ? (
                    <Button
                      asChild
                      variant="link"
                      className="mt-5 h-auto gap-2 p-0 font-medium text-foreground"
                    >
                      <a
                        href={item.institutionUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Visit institution
                        <ArrowUpRightIcon />
                      </a>
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          </article>
        ))}
      </ResultsGrid>
      <FooterActions />
    </PageShell>
  )
}
