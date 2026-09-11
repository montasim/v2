import type { ProjectCaseStudy } from "@/lib/content/project-case-studies"
import type { Project } from "@/lib/content/projects"

const ispcine = `
# ISPCine

> A modern cinema app for the movie, series, and live-TV services available through your ISP network.

Many internet service providers include access to their own FTP or media servers. These catalogs can contain a large collection of movies and TV series, but their websites are often difficult to browse, unfriendly on smaller screens, and missing conveniences such as search, watch history, and resume playback.

ISPCine brings supported ISP media catalogs into one clean, familiar, and easy-to-use application. It helps you discover what is available on your network, play it comfortably, and return to what you were watching without navigating several outdated provider websites.

**[Download ISPCine](https://ispcine.netlify.app)**

## What you can do

- Browse movies and TV series with posters, banners, and useful title details.
- Watch supported live-TV channels from the same application.
- Search large catalogs and move through results with pagination.
- Play videos with seeking and resume from your previous position.
- Return to unfinished titles through Continue Watching and Watch History.
- Save interesting titles to My List.
- Use available subtitles while watching.
- Download supported content and manage downloads in one place.
- Switch between multiple supported ISP media providers.
- Check whether a provider is reachable from your current network.

## Supported platforms

ISPCine currently supports **Windows 11** and **Ubuntu/Debian** desktop systems. The experience is designed to feel consistent across supported platforms, with a focused interface that works well from browsing through playback.

## Supported media providers

Current provider integrations include:

- ICC FTP Server
- CineplexBD
- RoyalFlix
- StreamTube Media Server
- IBCCL FTP
- MultiMovies
- Supported live-TV sources

Provider availability depends on your current ISP, network, and location. A provider listed here may still be inaccessible if your ISP does not permit access to it. Live-TV channel availability can also change according to the provider and network.

## How ISPCine handles content

ISPCine does **not** host, upload, sell, or supply movies, TV series, live-TV channels, or other media. It presents catalogs and streams that are already accessible through a supported provider on your network.

You should use ISPCine only with media services and content that you are legally authorized to access. ISPCine cannot make an unavailable provider accessible and does not bypass an ISP's network restrictions.

## A simpler viewing experience

The app detects supported providers available on your network and translates their different catalog layouts into one consistent experience. Instead of learning a separate interface for every server, you can browse, search, save, play, and resume content through the same controls.

Your saved list, playback progress, and history help make repeated viewing more convenient. Provider and availability checks also explain when a service cannot be reached, rather than leaving you with an unresponsive page.

## Project status

ISPCine is currently in an **early stage of development**. Core browsing, playback, history, list, subtitle, download, provider-selection, and network-check experiences are available, but bugs, incomplete features, and provider compatibility issues should still be expected.

Feedback, bug reports, and feature suggestions are valuable while the app continues to improve.

## Planned provider support

Community requests currently being evaluated include:

- SamOnline
- CircleFTP
- Additional ISP media providers requested by users

To suggest a provider, share its name and exact address or URL. A screenshot of its browse or details page, or a sample link that you are allowed to share, can make compatibility testing easier.

## Try ISPCine

If your ISP media server appears in the supported list, **[download ISPCine](https://ispcine.netlify.app)** and share your experience. If you need another provider, send its name and address so its compatibility can be reviewed for a future release.
`

export const projectReadmes: Readonly<Record<string, string>> = {
  ispcine,
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
