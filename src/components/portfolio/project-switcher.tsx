import { useNavigate } from "@tanstack/react-router"

import { ProjectTypeIcon } from "@/components/portfolio/project-type-icon"
import { BreadcrumbSwitcher } from "@/components/shared/breadcrumb-switcher"
import type { BreadcrumbSwitcherOption } from "@/components/shared/breadcrumb-switcher"
import { projectCaseStudyCatalog } from "@/lib/content/project-case-studies"
import type { ProjectCaseStudy } from "@/lib/content/project-case-studies"
import { projectCatalog } from "@/lib/content/projects"
import type { Project } from "@/lib/content/projects"

function projectOption(
  project: Project,
  value: string
): BreadcrumbSwitcherOption {
  return {
    value,
    title: project.title,
    keywords: [project.type],
    imageUrl: project.logoUrl,
    fallbackIcon: <ProjectTypeIcon type={project.type} className="size-4" />,
  }
}

const projectSlug = (project: Project) => project.id.replace(/^project-/, "")

// Same slug derivation as projectCatalog.findBySlug, and only projects whose
// detail route resolves (the route 404s without a case study).
export const projectSwitcherOptions: readonly BreadcrumbSwitcherOption[] =
  projectCatalog.records
    .filter((project) => projectCaseStudyCatalog.findByProjectId(project.id))
    .map((project) => projectOption(project, projectSlug(project)))

export const caseStudySwitcherOptions: readonly BreadcrumbSwitcherOption[] =
  projectCaseStudyCatalog.records.map((caseStudy) =>
    projectOption(caseStudy.project, caseStudy.slug)
  )

export function ProjectSwitcher({
  current,
  label,
}: {
  current: Project
  label: string
}) {
  const navigate = useNavigate()
  return (
    <BreadcrumbSwitcher
      label={label}
      current={projectSlug(current)}
      options={projectSwitcherOptions}
      onSelect={(slug) =>
        void navigate({ to: "/projects/$slug", params: { slug } })
      }
      ariaLabel="Switch project"
      searchPlaceholder="Find a project…"
      emptyText="No projects found."
    />
  )
}

export function CaseStudySwitcher({
  current,
  label,
}: {
  current: ProjectCaseStudy
  label: string
}) {
  const navigate = useNavigate()
  return (
    <BreadcrumbSwitcher
      label={label}
      current={current.slug}
      options={caseStudySwitcherOptions}
      onSelect={(slug) =>
        void navigate({ to: "/case-studies/$slug", params: { slug } })
      }
      ariaLabel="Switch case study"
      searchPlaceholder="Find a case study…"
      emptyText="No case studies found."
    />
  )
}
