import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { BadgeList } from "@/components/shared/badge-list"
import { PageSection } from "@/components/shared/page-section"
import { PageShell } from "@/components/shared/page-shell"
import { ResultsGrid } from "@/components/shared/results-grid"
import { Card } from "@/components/ui/card"

describe("shared component interfaces", () => {
  it("limits badge lists and reports the remaining item count", () => {
    const markup = renderToStaticMarkup(
      <BadgeList
        items={["React", "TypeScript", "Node.js"]}
        label="Technologies"
        limit={2}
      />
    )

    expect(markup).toContain('aria-label="Technologies"')
    expect(markup).toContain("React")
    expect(markup).toContain("TypeScript")
    expect(markup).toContain("+1 more")
    expect(markup).not.toContain("Node.js")
  })

  it("keeps semantic elements when a card supplies the visual surface", () => {
    const markup = renderToStaticMarkup(
      <Card asChild>
        <article aria-label="Example">Content</article>
      </Card>
    )

    expect(markup).toMatch(/^<article/)
    expect(markup).toContain('data-slot="card"')
    expect(markup).not.toContain("<div")
  })

  it("connects reusable page sections to their headings", () => {
    const markup = renderToStaticMarkup(
      <PageSection headingId="sample-heading" title="Sample">
        <p>Content</p>
      </PageSection>
    )

    expect(markup).toContain('aria-labelledby="sample-heading"')
    expect(markup).toContain('id="sample-heading"')
  })

  it("applies the shared page and result spacing", () => {
    const page = renderToStaticMarkup(
      <PageShell padded>
        <ResultsGrid aria-label="Results">
          <article>Result</article>
        </ResultsGrid>
      </PageShell>
    )

    expect(page).toContain("py-12 sm:py-16")
    expect(page).toContain("mt-6 grid gap-5")
  })
})
