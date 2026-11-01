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

  "project-management": `
# Project Management

A collaborative application for project tasks, subtasks, bugs, discussions,
membership, and progress. Montasim's documented role was frontend development
with responsive Tailwind CSS interfaces.

## Interface and architecture

React components organize project overviews and team workflows. Redux actions
and a shared HTTP helper connect controls to project updates and membership
operations. The repository also includes an Express and Mongoose backend;
these describe the overall application, not Montasim's individual backend work.

## Evidence and limits

The README documents the frontend contribution and links a video preview.
Current deployment, end-to-end operation, and productivity improvements were
not verified. The backend test command is a placeholder. The linked repository
was created in 2020; that date does not establish when Montasim joined the work.
`,
  "warehouse-management-client": `
# POSDash Client

A legacy React inventory client with Firebase sign-in, item browsing, stock update and delivery controls, and user-specific item pages. Data workflows depend on a separate POSDash API.

## Architecture

React Router maps inventory, item details, account, and static information screens.

Firebase handles client sign-in; a token hook sends an email to the API and stores the returned token locally for requests.

Item-detail request code loads records and submits stock and delivery updates to the separate API.

## Implementation boundaries

The client embeds a legacy Heroku API address; current end-to-end operation was not verified.

Only some account-oriented routes use the client authentication guard; backend authorization remains a separate responsibility.

This client references warehouse-management-server, not inventory-management-system-server.
`,
  "inventory-management-system-server": `
# Inventory Management System Server

A legacy Express and MongoDB API organizing pharmacy and non-pharmacy products, orders, returns, customers, employees, and supplier records into resource routers.

## Architecture

An Express entry point mounts product, order, setup, people, return, and supplier routers with JSON parsing and CORS.

Pharmacy and non-pharmacy routes are grouped separately; other modules handle related inventory records.

The inspected product router uses collection reads, insertOne, updateOne, and deleteOne directly from request handlers.

## Implementation boundaries

The source lacks authentication and authorization middleware for data-changing endpoints.

Purchase paths mount order routers in the inspected entry point, so distinct purchase behavior is not established.

Legacy connection configuration requires remediation, and no automated tests or working deployment were verified.
`,
  technofire: `
# TechnoFire

A legacy PHP and MariaDB fire-safety catalog prototype with database-backed product pages, galleries, client content, and a session-based administration area, co-developed with Abid Hasan Piash.

## Architecture

Server-rendered PHP pages compose shared includes for navigation, catalog sections, galleries, and company information.

MySQLi queries read MariaDB catalog and settings records for public and administrative views.

The admin area includes session-based login and screens for product, category, gallery, client, and site-setting management.

## Implementation boundaries

The repository documents legacy authentication, SQL handling, and upload weaknesses; it is a reference prototype rather than a production-ready system.

No automated tests, verified deployment, or measured business outcomes were established.

The project credits both Montasim and Abid Hasan Piash; the inspected source does not establish exclusive authorship of individual features.
`,

  "school-management-backend": `
# School Management Backend

A modular Express and MongoDB prototype for school administration and website content, with admission resources, student records, academic downloads, and Google Drive file integration.

## Architecture

Express composes school resource routes with domain controllers, services, and Joi validation.

MongoDB connection middleware and shared collection helpers support resource operations.

The admission-form service uploads files to Google Drive and records file identifiers and links in MongoDB.

Request logging, rate limiting, response helpers, and email utilities support the API.

## Implementation status

The repository is a prototype; its test command is a failing placeholder and no automated suite is included.

Database, email, and Google Drive operations require configured external services; they were not executed during this review.

Access control and file handling need production validation; no school adoption or live availability is claimed.

The source repository is private.
`,
  "school-management": `
# School Management

A responsive Next.js school website prototype for notices, admissions, routines, results, downloads, staff, and galleries, using local sample content and a demonstration admin interface.

## Architecture

Next.js App Router pages separate admissions, notices, routines, results, downloads, gallery, and other school information.

React components and Tailwind CSS provide shared navigation, content cards, and responsive layouts; Swiper supports carousel presentation.

Pages read bundled sample data and static assets, including sample downloadable documents.

A React authentication context holds a demonstration user in memory; admin navigation and layouts illustrate the interface without a secure backend.

## Implementation status

Public pages use repository-local sample content rather than a connected school database.

Admin login uses client-side in-memory state and does not establish server-side authentication or authorization.

The teacher admin route is a placeholder, and forms should not be assumed to persist submissions.

No integration with the separate school-management backend was verified.

The source repository is private.
`,
  "survey-module-backend": `
# Survey Module Backend

An Express and Mongoose API prototype for school-dropout research, separating surveys, templates, and completed survey records alongside user, role, permission, and authentication modules.

## Architecture

Express mounts survey, survey-template, perform-survey, authentication, user, role, and permission routers.

Separate Mongoose models represent surveys, templates, and completed survey records with school and location fields.

Survey services call Mongoose create, find, update, and delete operations with common service-error handling.

Application middleware includes request sanitization, compression, rate limiting, and database connection handling.

## Implementation status

Automated test scripts exist, but no checked-in test files establish passing coverage.

No live deployment, hosted API documentation, or research outcomes were verified.

The completed-survey model contains domain-specific school and location fields; this is not evidence of a general-purpose form builder.

Management endpoints and external integrations require authorization and runtime validation before production use.

The source repository is private.
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
