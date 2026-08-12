import * as React from "react"
import { createFileRoute } from "@tanstack/react-router"
import { ArrowUpRightIcon } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import {
  linkedInRecommendationsUrl,
  RecommendationDetails,
} from "@/components/portfolio/recommendations"
import { FilterBar } from "@/components/shared/filter-bar"
import { FooterActions, PageIntro } from "@/components/shared/page-intro"
import { PageShell } from "@/components/shared/page-shell"
import { ResultsGrid } from "@/components/shared/results-grid"
import { descriptions, recommendations } from "@/lib/content"
import { createMeta } from "@/lib/site"

const years = [
  "all",
  ...Array.from(
    new Set(recommendations.map((item) => item.date.split(", ").at(-1) ?? ""))
  )
    .filter(Boolean)
    .sort()
    .reverse(),
]

export const Route = createFileRoute("/recommendations")({
  head: () =>
    createMeta(
      "Recommendations",
      descriptions.recommendations,
      "/recommendations"
    ),
  component: Page,
})

function Page() {
  const [filter, setFilter] = React.useState("all")
  const visible = recommendations.filter(
    (item) => filter === "all" || item.date.endsWith(filter)
  )

  return (
    <PageShell padded>
      <PageIntro
        title="Recommendations"
        description={descriptions.recommendations}
      />
      <Button
        asChild
        variant="link"
        className="mt-4 h-auto p-0 font-medium text-foreground"
      >
        <a href={linkedInRecommendationsUrl} target="_blank" rel="noreferrer">
          View recommendations on LinkedIn
          <ArrowUpRightIcon />
        </a>
      </Button>
      <FilterBar
        value={filter}
        onValueChange={setFilter}
        items={years.map((year) => ({
          value: year,
          label: year === "all" ? "All years" : year,
        }))}
      />
      <ResultsGrid aria-label="Recommendation list">
        {visible.map((item) => (
          <RecommendationDetails
            key={`${item.name}-${item.date}`}
            item={item}
          />
        ))}
      </ResultsGrid>
      <FooterActions />
    </PageShell>
  )
}
