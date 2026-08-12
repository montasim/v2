import * as React from "react"
import { createFileRoute } from "@tanstack/react-router"
import { FilterBar } from "@/components/shared/filter-bar"
import { FooterActions, PageIntro } from "@/components/shared/page-intro"
import { PageShell } from "@/components/shared/page-shell"
import { ResultsGrid } from "@/components/shared/results-grid"
import { ProjectCard } from "@/components/portfolio/project-card"
import { descriptions, projects } from "@/lib/content"
import { createMeta } from "@/lib/site"

const categories = [
  { value: "all", label: "All work" },
  { value: "website", label: "Web apps" },
  { value: "extension", label: "Extensions" },
  { value: "package", label: "npm packages" },
  { value: "skill", label: "AI skills" },
  { value: "dataset", label: "Datasets" },
  { value: "tool", label: "Developer tools" },
  { value: "api", label: "APIs" },
  { value: "template", label: "Templates" },
]
export const Route = createFileRoute("/projects")({
  head: () => createMeta("Projects", descriptions.projects, "/projects"),
  component: Page,
})
function Page() {
  const [filter, setFilter] = React.useState("all")
  const visible = projects.filter(
    (project) => filter === "all" || project.type === filter
  )
  return (
    <PageShell padded>
      <PageIntro title="Projects" description={descriptions.projects} />
      <FilterBar value={filter} onValueChange={setFilter} items={categories} />
      <p className="sr-only" aria-live="polite">
        {visible.length} {visible.length === 1 ? "project" : "projects"} shown
      </p>
      <ResultsGrid aria-label="Project catalog">
        {visible.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </ResultsGrid>
      <FooterActions />
    </PageShell>
  )
}
