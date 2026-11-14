import { z } from "zod"
import projectReadmesBnJson from "@/data/project-readmes.bn.json"
import type { ContentLanguage } from "@/lib/content/content-language"
import { localizeCaseStudy } from "@/lib/content/project-case-studies"
import type { ProjectCaseStudy } from "@/lib/content/project-case-studies"
import { localizeProject } from "@/lib/content/projects"
import type { Project } from "@/lib/content/projects"

export const projectReadmes: Readonly<Record<string, string>> = {
  "clm-api": `
# CLM API

CLM API is a shared customer lifecycle management backend. My freelance work for WaTheta focused on messaging integrations and conversation workflows.

## My contribution

I implemented WhatsApp, Messenger, and Instagram messaging features, inbound event handling and deduplication, keyword-based automation, and agent routing by skill, department, and priority. Additional work covered durable WhatsApp coexistence bindings, history synchronization, quoted replies, SLA timers, and real-time presence and typing events with conversation access checks.

The implementation uses TypeScript, NestJS, MongoDB/Mongoose, Redis, BullMQ, Socket.IO, and Zod. Unit and end-to-end test changes accompany the messaging work.

## Verified scope

The available Git history contains 47 commits authored by me from 28 May to 10 June 2026, using Bangladesh time. This is the verified contribution window, not confirmation of contractual start and end dates. The broader CLM platform is team work.

The source repository is private. The linked case study summarizes implementation evidence without publishing client source code. Production deployment, operational performance, and external-provider behavior were not independently verified.
`,

  "mcq-topper-backend": `
# MCQ Topper Backend

An Express API foundation for a multiple-choice-question learning platform.

## What is implemented

Versioned domain routers organize questions, exams, courses, enrolment, results,
and supporting content. Shared middleware configures Helmet, HPP, CORS, payload
limits, request timeouts, and rate limiting. Controller and response helpers
provide common handling, and Nodemailer utilities support error notifications.

## Implementation boundaries

This is a scaffold. Most domain operations return placeholder responses;
persistence is not active in the inspected server flow. Route names do not
establish completed authentication, authorization, question storage, exam
execution, or result calculation. No live deployment or measured product
outcomes are verified.

## Delivery assets

The repository includes Docker, Compose, PM2, and Vercel configuration, plus
Swagger and Postman resources. These are starting points for implementation
and validation. The source repository is private.
`,
  "air-traffic-control": `
# Air Traffic Control

Draw flight paths. Land aircraft. Avoid collisions.

Air Traffic Control is an arcade game for Android, browsers, Windows, and Linux. Guide airliners, commuter aircraft, and helicopters to their matching runways or helipads while keeping traffic apart.

## How to play

Choose an airfield and difficulty, then press an aircraft with a mouse, finger, or pen and draw its route. Release when the matching landing area lights up. Each safe landing earns a point; a collision or an aircraft leaving the sector ends the shift. A practice flight introduces the controls without changing your records.

## Build a local career

Start at Saltmarsh Gateway or River Bend and unlock more locations through career promotions. The browser and desktop versions described here feature nine airfields, three difficulty levels, seven ranks, and nine achievements. The Android release on Google Play features twelve airfields. Completed shifts count toward progression; practice, restarts, and abandoned shifts do not.

## Play on Android, in your browser, on Windows, or on Linux

[Get it on Google Play for Android](https://play.google.com/store/apps/details?id=dev.montasim.airtrafficcontrol), [play in the browser](https://airtrafficcontrol.netlify.app), [install for Windows from the Microsoft Store](https://apps.microsoft.com/detail/9N5536ZQ2XZM), or [install for Linux from the Snap Store](https://snapcraft.io/air-traffic-control). The browser version caches assets for offline use after an online visit. The Electron desktop version bundles the game for offline play.

## Saves and controls

Progress and settings are stored locally in IndexedDB. Browser and desktop saves are separate, with no cloud synchronization or save export. Clearing site data can erase browser progress. Menus support keyboard navigation, but drawing flight paths requires a pointer. Resizing or changing orientation can require a shift restart.

## Engineering

A TypeScript simulation handles traffic pacing, route geometry, and aircraft-shaped collision checks independently of Phaser rendering. Versioned local saves track progression. Vite produces the browser build and the assets bundled by Electron. Automated tests cover simulation, progression, storage, audio, and UI behavior; broader real-device testing and difficulty balancing remain ongoing.
`,
}

const readmeHeadings = {
  en: {
    whatItIs: "What it is",
    problem: "The problem",
    delivers: "What it delivers",
    limits: "Limits to know",
    status: "Status and role",
    statusLabel: "Status",
    roleLabel: "My role",
    scopeLabel: "Scope",
  },
  bn: {
    whatItIs: "এটা কী",
    problem: "সমস্যাটা",
    delivers: "যা পাওয়া যায়",
    limits: "যে সীমাবদ্ধতা জানা দরকার",
    status: "অবস্থা ও ভূমিকা",
    statusLabel: "অবস্থা",
    roleLabel: "আমার ভূমিকা",
    scopeLabel: "পরিসর",
  },
} as const satisfies Record<ContentLanguage, Record<string, string>>

const translatedReadmes = new Map(
  Object.entries(
    z.record(z.string().min(1), z.string().min(1)).parse(projectReadmesBnJson)
  )
)
for (const key of translatedReadmes.keys()) {
  if (!(key in projectReadmes)) {
    throw new Error(`Bangla README has no English source: ${key}`)
  }
}

function projectSlug(project: Project) {
  return project.id.replace(/^project-/, "")
}

function bulletList(items: readonly string[]) {
  return items.map((item) => `- ${item}`).join("\n")
}

// Built only from the project's own facts, so no section is generic filler.
function createProjectReadme(
  project: Project,
  caseStudy: ProjectCaseStudy,
  language: ContentLanguage
) {
  const text = localizeCaseStudy(caseStudy, language)
  const { description } = localizeProject(project, language)
  const heading = readmeHeadings[text.language]
  return `
# ${project.title}

> ${description}

## ${heading.whatItIs}

${text.summary}

## ${heading.problem}

${text.problem}

## ${heading.delivers}

${bulletList(text.outcomes)}

## ${heading.limits}

${bulletList(text.constraints)}

## ${heading.status}

- **${heading.statusLabel}:** ${text.status}
- **${heading.roleLabel}:** ${text.role}
- **${heading.scopeLabel}:** ${text.scope}
`
}

export function getProjectReadme(
  project: Project,
  caseStudy: ProjectCaseStudy,
  language: ContentLanguage = "en"
) {
  const slug = projectSlug(project)
  if (!(slug in projectReadmes)) {
    return createProjectReadme(project, caseStudy, language)
  }
  return (
    (language === "bn" ? translatedReadmes.get(slug) : undefined) ??
    projectReadmes[slug]
  )
}

export function hasProjectReadmeTranslation(project: Project) {
  const slug = projectSlug(project)
  return !(slug in projectReadmes) || translatedReadmes.has(slug)
}
