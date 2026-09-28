import type { ProjectCaseStudy } from "@/lib/content/project-case-studies"
import type { Project } from "@/lib/content/projects"

export const projectReadmes: Readonly<Record<string, string>> = {}

const projectTypeLabels: Record<Project["type"], string> = {
  website: "web application",
  desktop: "desktop application",
  extension: "browser extension",
  package: "software package",
  skill: "AI-agent skill",
  dataset: "data resource",
  tool: "developer tool",
  api: "API",
  template: "project template",
}

function projectSlug(project: Project) {
  return project.id.replace(/^project-/, "")
}

function bulletList(items: readonly string[]) {
  return items.map((item) => `- ${item}`).join("\n")
}

function createProjectReadme(project: Project, caseStudy: ProjectCaseStudy) {
  const type = projectTypeLabels[project.type]
  return `
# ${project.title}

> ${project.description}

${project.title} is a ${type} created to make a real workflow clearer, faster, and easier to trust. It turns a focused product idea into something people can use, evaluate, and understand without needing to inspect the source code.

## Why ${project.title} exists

${caseStudy.problem}

The goal is not simply to add another tool. ${project.title} is designed to reduce the friction around that problem and give people a more dependable way to complete the work.

## What it delivers

${bulletList(caseStudy.outcomes)}

## The experience

${caseStudy.summary}

The project brings the important parts of the workflow into one coherent experience. Its interface and behavior are shaped around the people using it, while the implementation stays focused on predictable results and honest feedback.

## What to know

Every product has boundaries. These are the most important considerations for ${project.title}:

${bulletList(caseStudy.constraints)}

These limitations are presented openly so visitors can understand where the project works well, what it depends on, and what may change in future versions.

## Current status

**${caseStudy.status}.** The current release demonstrates the core value of the project and the main end-to-end experience.

My role was ${caseStudy.role.toLocaleLowerCase()}, covering ${caseStudy.scope.toLocaleLowerCase()}. The related case study explains the decisions and delivery process in greater depth for visitors who want the engineering story behind the product.
`
}

export function getProjectReadme(
  project: Project,
  caseStudy: ProjectCaseStudy
) {
  return (
    projectReadmes[projectSlug(project)] ??
    createProjectReadme(project, caseStudy)
  )
}
