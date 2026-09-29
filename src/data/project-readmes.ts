import type { ProjectCaseStudy } from "@/lib/content/project-case-studies"
import type { Project } from "@/lib/content/projects"

export const projectReadmes: Readonly<Record<string, string>> = {
  "air-traffic-control": `
# Air Traffic Control

Draw flight paths. Land aircraft. Avoid collisions.

Air Traffic Control is an arcade game for browsers and Linux. Guide airliners, commuter aircraft, and helicopters to their matching runways or helipads while keeping traffic apart.

## How to play

Choose an airfield and difficulty, then press an aircraft with a mouse, finger, or pen and draw its route. Release when the matching landing area lights up. Each safe landing earns a point; a collision or an aircraft leaving the sector ends the shift. A practice flight introduces the controls without changing your records.

## Build a local career

Start at Saltmarsh Gateway or River Bend and unlock more locations through career promotions. Nine airfields, three difficulty levels, seven ranks, and nine achievements provide different traffic challenges. Completed shifts count toward progression; practice, restarts, and abandoned shifts do not.

## Play in your browser or on Linux

[Play in the browser](https://airtrafficcontrol.netlify.app) or [install from the Snap Store](https://snapcraft.io/air-traffic-control). The browser version caches assets for offline use after an online visit. The Electron Linux version bundles the game for offline play.

## Saves and controls

Progress and settings are stored locally in IndexedDB. Browser and desktop saves are separate, with no cloud synchronization or save export. Clearing site data can erase browser progress. Menus support keyboard navigation, but drawing flight paths requires a pointer. Resizing or changing orientation can require a shift restart.

## Engineering

A TypeScript simulation handles traffic pacing, route geometry, and aircraft-shaped collision checks independently of Phaser rendering. Versioned local saves track progression. Vite produces the browser build and the assets bundled by Electron. Automated tests cover simulation, progression, storage, audio, and UI behavior; broader real-device testing and difficulty balancing remain ongoing.
`,
}

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
