import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { BadgeList } from "@/components/shared/badge-list"
import {
  DownloadAction,
  ExternalAction,
} from "@/components/shared/navigation-action"
import { PageSection } from "@/components/shared/page-section"
import { PageShell } from "@/components/shared/page-shell"
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
    expect(markup).toContain("motion-reveal")
  })

  it("supports a subtle reveal for dense section surfaces", () => {
    const markup = renderToStaticMarkup(
      <PageSection
        headingId="availability-heading"
        title="Availability"
        revealVariant="subtle"
      >
        <p>Current working preferences</p>
      </PageSection>
    )

    expect(markup).toContain("motion-reveal-subtle")
    expect(markup).not.toContain('revealVariant="subtle"')
  })

  it("applies shared page spacing while preserving main semantics", () => {
    const page = renderToStaticMarkup(<PageShell padded>Content</PageShell>)

    expect(page).toMatch(/^<main/)
    expect(page).toContain("py-12 sm:py-16")
  })

  it("centralizes external and download navigation semantics", () => {
    const external = renderToStaticMarkup(
      <ExternalAction href="https://example.com" variant="link">
        External
      </ExternalAction>
    )
    const download = renderToStaticMarkup(
      <DownloadAction href="/file.pdf" variant="link">
        Download
      </DownloadAction>
    )

    expect(external).toContain('target="_blank"')
    expect(external).toContain('rel="noreferrer"')
    expect(download).toContain('download=""')
  })
})
