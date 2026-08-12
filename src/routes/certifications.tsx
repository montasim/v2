import * as React from "react"
import { createFileRoute } from "@tanstack/react-router"
import { CertificationCard } from "@/components/portfolio/certification-card"
import { FilterBar } from "@/components/shared/filter-bar"
import { FooterActions, PageIntro } from "@/components/shared/page-intro"
import { PageShell } from "@/components/shared/page-shell"
import { ResultsGrid } from "@/components/shared/results-grid"
import { certifications, descriptions } from "@/lib/content"
import { createMeta } from "@/lib/site"

const years = [
  "all",
  ...Array.from(new Set(certifications.map((item) => item.year)))
    .sort()
    .reverse(),
]
export const Route = createFileRoute("/certifications")({
  head: () =>
    createMeta(
      "Certifications",
      descriptions.certifications,
      "/certifications"
    ),
  component: Page,
})
function Page() {
  const [filter, setFilter] = React.useState("all")
  const visible = certifications.filter(
    (item) => filter === "all" || item.year === filter
  )
  return (
    <PageShell padded>
      <PageIntro
        title="Certifications"
        description={descriptions.certifications}
      />
      <FilterBar
        value={filter}
        onValueChange={setFilter}
        items={years.map((year) => ({
          value: year,
          label: year === "all" ? "All years" : year,
        }))}
      />
      <ResultsGrid aria-label="Certification list">
        {visible.map((item) => (
          <CertificationCard key={item.id} item={item} />
        ))}
      </ResultsGrid>
      <FooterActions />
    </PageShell>
  )
}
