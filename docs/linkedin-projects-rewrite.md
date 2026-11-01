# LinkedIn Projects: Proposed Revision

Applied to LinkedIn on 2026-11-01: 5 revised, 6 added, address-bd deleted, DevTools set to 50+ in Featured and About.
Source of truth: `src/data/projects.json` and `src/data/casestudy.json` in this portfolio repo.

## Summary

| # | Project | Action | Why |
|---|---|---|---|
| 1 | Patient Portal (MyMedicalHub) | Revise | Good content. Tighten it and lead with the result. |
| 2 | Telemedicine (MyMedicalHub) | Revise + **shorten title** | The title is a 230-character sentence. Also check the "React 14" claim. |
| 3 | Clinical Movement Re-annotation (MyMedicalHub) | Revise | The "54+ modules" claim conflicts with your Senior role (see open questions). |
| 4 | DevTools | Revise + **fix count** | It says 30+ in Featured, 40+ here and in About, and 50+ in your portfolio. Pick one. |
| 5 | PostCraft | Revise | Your portfolio shows multi-provider AI with fallback, not Gemini only. |
| 6 | address-bd | **Remove** | Your decision. Delete it from LinkedIn Projects. |
| 7 | **Air Traffic Control** | **Add** | Published on Google Play, Microsoft Store and Snap Store. Your only shipped multi-platform app. |
| 8 | **BugReceipt** | **Add** | Published on the Chrome Web Store, with a demo video. Strong signal for engineers. |
| 9 | **Liftuno** | **Add** | Client product (React Native / Expo) on the Snap Store. Shows client work. |
| 10 | **Coaching Management** | **Add** | Client multi-tenant SaaS with biometric devices and SMS. Shows client work. |
| 11 | **CLM API (WaTheta, freelance)** | **Add** | Backend and Meta messaging APIs (NestJS, Redis, BullMQ). Shows backend depth plus a named client. |
| 12 | **MulaLens** | **Add** | Published on the Chrome Web Store. |

**Optional extras** (lower priority): FormFlow (bilingual multi-tenant workflow SaaS), Skillfoliox (AI coding-agent skills catalog, which supports an "AI-first" headline), TIN Audit Checker (private lookup across 72,342 tax returns).

**Not recommended for LinkedIn:** the 10+ individual agent-skill npm packages (group them under Skillfoliox instead), legacy or prototype work (TechnoFire, POSDash, School Management, MCQ Topper, Survey Module) and small utilities (counters, typing SVG, *-lite packages). They dilute the list.

**Recommended order on LinkedIn** (the top 2–3 show on your main profile): Telemedicine → Patient Portal → Air Traffic Control → PostCraft → BugReceipt → DevTools, then the rest.

---

## Revised existing projects

### 1. MyMedicalHub Patient Portal: HIPAA-Compliant Multi-Tenant Healthcare SaaS
**Associated with:** MyMedicalHub International · **Skills:** React.js, Redux Toolkit, MediaPipe, WebRTC, Multi-tenant SaaS

```
A HIPAA-compliant, multi-tenant healthcare portal used by 1,000+ patients and clinicians across 250+ client configurations. Patients complete biometric movement assessments, an AI-assisted intake chatbot, exercise programs and clinical reports, and connect with providers through telemedicine.

My role: frontend architecture, feature delivery and production stability. I grew from Junior to Senior on this product.

Key contributions:
• Biometric movement engine: built the core assessment system from scratch, with real-time MediaPipe pose estimation (adaptive frame rate), video recording with imperative lifecycle control, multi-person detection, face-orientation validation and a priority-queued audio-feedback pipeline.
• Intake chatbot: led a full rewrite on Redux Toolkit, with dynamic question routing, conditional visibility, group-based scaffolding and real-time answer persistence.
• Clinical reports: report viewers with HTML/PDF rendering and download lifecycle management.
• Platform: replaced 5 legacy UI dependencies (Bootstrap, Reactstrap, react-table and others) with custom components; built API-driven theming, SSO login and a feature-flag architecture that gates every feature per tenant.
```

### 2. MyMedicalHub Telemedicine: Real-Time Video & Movement Assessment
**New title** (the old one was a full sentence) · **Associated with:** MyMedicalHub International · **Skills:** WebRTC, Socket.IO, Next.js, MediaPipe, AWS S3

```
A HIPAA-conscious telemedicine platform for remote physical therapy and musculoskeletal rehab. Patients and licensed providers meet in real-time video consultations with clinical-grade movement assessment and AI-assisted repetition counting, across multiple tenants with patient, provider and admin roles.

Key contributions:
• Replaced the third-party OpenTok service with peer-to-peer WebRTC on self-hosted STUN/TURN servers, turning a usage-based vendor bill into a fixed server cost and reducing call latency and dropped connections.
• Session recording with the MediaRecorder API and archival to AWS S3.
• Real-time two-way event system on Socket.IO for live session orchestration.
• Led the migration from legacy React patterns to a modern architecture for WebRTC peer management, socket lifecycle and recording state machines.
• Separated real-time state into a context-driven layer, apart from Redux-persisted domain state.
• Tenant-aware feature flags for per-organisation rollout of AI exercise counting and athlete-rehab modes.
• Owned CI/CD and production deployments across 4 environments.
```

### 3. Clinical Movement Re-annotation: Canvas-Based ROM Correction
**Associated with:** MyMedicalHub International · **Skills:** Konva.js, JavaScript, Canvas API, Tailwind CSS, Security

```
A standalone clinical review tool where providers select recorded exercise frames, correct detected key points, lines and angles, compare against reference guidance, and save validated range-of-motion measurements.

Key contributions:
• Interactive annotation engine in Konva.js: custom line and angle primitives, affine transforms (zoom, pan), layer management and hit detection.
• Dual-canvas rendering: raw source layer plus annotation overlay, composited for pixel-accurate correction.
• Review state machine for exercise statuses (Completed, Retake, Human-expert) with event-driven UI transitions and auto-initialised video playback.
• Client-side image processing: dynamic resizing and aspect-ratio normalisation for before/after comparison, with lazy loading.
• Modular ES6 architecture with feature-based code splitting.
• Hardened the app with CSP headers, XSS sanitisation and CSRF mitigation; touch-gesture support for tablets.

Started as the first canvas annotation tool I built as a Junior engineer and grew into its own microservice.
```

### 4. DevTools: Privacy-First Developer Toolbox
**Skills:** Next.js, TypeScript, PostgreSQL, Prisma, System Design · **Link:** live site + GitHub

```
A searchable toolbox of 50+ developer tools in one interface, built so everyday tasks don't send you across a dozen single-purpose websites with unclear privacy.

• Local by default: formatters and generators (JSON, Base64, JWT, UUID, hashes, RSA keys, regex) run entirely in the browser, with no account and nothing sent to a server.
• Server-backed when it adds value: account sync, password-protected expiring share links, short links, webhook inspection and saved items (PostgreSQL + Prisma), each clearly marked as leaving the browser.
• Plugin architecture: every tool is a definition with configurable tabs (editor, saved, shared, history) on a shared core, so new tools reuse search, history and sharing.
• Command palette (Cmd+K), context menus, dark mode, fully responsive.
• TypeScript, lint, build and GitHub Actions checks on every change to main.
```

### 5. PostCraft: AI-Powered Social Media Manager
**Skills:** Next.js, TypeScript, Generative AI, Inngest, MongoDB · **Link:** live site

```
An AI publishing workspace that turns one idea into scored, platform-ready posts for LinkedIn, X and Facebook, then schedules and publishes them.

• Generation: multiple ranked post variants per topic, with brand guardrails (banned words, mandatory rules) and audience and tone personas.
• Resilience: multi-provider AI selection with provider and key fallback (including Google Gemini), so one failing endpoint doesn't stop the workflow.
• Publishing: direct OAuth publishing and scheduling with per-platform previews and character-limit checks before anything is posted.
• Background jobs: heavy generation and scheduled posting run on Inngest queues for a non-blocking UI, with rate-limit and quota alerts.
• Publishing history is stored for library and insights views.

Stack: Next.js · TypeScript · Redux Toolkit · MongoDB · Inngest · Better Auth · Tailwind CSS
```

---

## New projects to add

### 7. Air Traffic Control: Cross-Platform Arcade Game
**Skills:** TypeScript, Phaser, Electron, Progressive Web Apps, Playwright
**Links (add as media/links):** Google Play · Microsoft Store · Snap Store · live web version · GitHub

```
A flight-path drawing arcade game published on Google Play (Android), the Microsoft Store (Windows) and the Snap Store (Linux), and playable in the browser. Players guide three aircraft types to land safely, avoid collisions and build a career that works fully offline.

• One TypeScript codebase shipped to four platforms: Android, web (PWA), Windows and Linux (Electron).
• Simulation kept separate from rendering, so routing, landing and collision rules stay testable and match what players see.
• Aircraft routing, traffic pacing, landing checks and collision geometry; 12 airfields on Android (9 on web and desktop), 3 difficulty levels, 7 career ranks and 9 achievements.
• Offline play and local career progress with IndexedDB, no account needed.
• Automated tests for simulation, progression, storage, audio and UI with Vitest and Playwright.
```

### 8. BugReceipt: Privacy-First Bug Reporting Extension
**Skills:** TypeScript, React, Chrome Extensions, TanStack Start, Privacy
**Links:** Chrome Web Store · demo video (YouTube) · GitHub

```
A Chrome extension that captures everything a developer needs to reproduce a web bug (console logs, network requests, reproduction steps, environment details and a screen recording or screenshot) in one reviewable report. Available on the Chrome Web Store.

• Privacy filtering before anything leaves the browser: tokens, email addresses, secret-shaped fields and sensitive URLs are stripped automatically.
• Every captured item can be reviewed, edited or removed before export.
• Export as a local Markdown-and-visual bundle, or send a size-limited report by email (TanStack Start endpoint + Resend).
• Background session ownership, isolated page instrumentation and persistent evidence storage that survives navigation.
• CI quality gate and a checksummed Chrome release workflow on GitHub Actions.

Stack: WXT · React 19 · TypeScript · Chrome Manifest V3 · Zod · Vitest
```

### 9. Liftuno: Gym Management Platform (Client Project)
**Skills:** React Native, Expo, TypeScript, Convex, Multi-tenant SaaS
**Links:** Snap Store · website

```
A bilingual (English/Bangla) gym-management platform built for a client, replacing paper ledgers in Bangladeshi gyms with one system for members, billing, attendance, receipts and staff operations. Available on the Snap Store.

• Domain design for gyms, members, access, invitations, attendance, offers, payments and audit history.
• Billing that keeps prepaid coverage, outstanding balances, partial payments, offers and reversals financially accurate.
• Multi-tenant, role-aware access with Better Auth and Convex, including invitation lifecycle and sign-in attempt limits.
• Tests focused on the highest-risk rules: money and access control.

Stack: Expo · React Native · React 19 · TypeScript · Convex · Better Auth · Zod · Vitest
```

### 10. Coaching Management: Multi-Tenant SaaS for Coaching Institutes (Client Project)
**Skills:** Next.js, PostgreSQL, Prisma, Multi-tenant SaaS, System Design

```
A multi-tenant SaaS platform built for a client, letting coaching institutes run academics, attendance, finance and communication from one place without any organisation seeing another's data.

• Multi-tenant data model with granular roles for platform admins, organisation admins, finance and academic staff.
• Workflows for students, teachers, class sections, enrolment, fees, payments and expenses.
• Biometric attendance: encrypted device credentials and a vendor-adapter model so multiple fingerprint-device brands work through one integration.
• Scheduled and batched SMS for attendance alerts and marketing outreach.

Stack: Next.js · React 19 · TypeScript · PostgreSQL · Supabase · Prisma · TanStack Query · Zod · Vitest
```

### 11. CLM API: Omnichannel Messaging Backend (Freelance, WaTheta)
**Skills:** NestJS, Meta Graph API, Redis, BullMQ, Socket.IO

```
Freelance backend work for WaTheta on a multi-tenant customer lifecycle management platform, letting support teams receive, route and reply to WhatsApp, Messenger and Instagram conversations from one inbox.

• Meta messaging integrations: Instagram comments, Messenger postbacks, opt-ins, referrals and reactions.
• Keyword automation and automatic agent assignment in the inbound message pipeline.
• WhatsApp coexistence: durable bindings, signup completion, contact and history sync, and media lifecycle handling.
• Real-time inbox events: presence, typing, join/leave, mark-read, quoted replies and SLA timers, with access checks.
• Unit and end-to-end tests for automation, routing and messaging flows.

Stack: TypeScript · NestJS · MongoDB · Redis · BullMQ · Socket.IO · Jest
```

### 12. MulaLens: Workplace Research Extension
**Skills:** TypeScript, Chrome Extensions, React, Tailwind CSS
**Links:** Chrome Web Store · demo video (YouTube) · GitHub

```
A Chrome extension, published on the Chrome Web Store, that adds structured company context (identity, workplace, salary, jobs, employee stories and cited research) directly onto Deshi Mula company pages, so job seekers can decide without leaving the page.

• Company-page detection and in-page panel injection.
• Integration with hosted lookup APIs, with clear loading, error and "advisory evidence" states.
• Full release pipeline: packaging, store artwork, privacy documentation, ADRs and automated checks.

Stack: TypeScript · Chrome Manifest V3 · React · Tailwind CSS · esbuild · Vitest
```

---

## Decisions confirmed

1. **DevTools:** 50+ tools. Also update the DevTools Featured item (says 30+) and the About section (says 40+) so all three match.
2. **54+ modules:** across 3 microservices, as the Senior role says. The number stays out of the Re-annotation project.
3. **"React 14":** changed to "legacy React patterns".
4. **Stores:** Google Play, Microsoft Store and Snap Store only. There is no Apple App Store listing.
5. **Client names:** Liftuno and Coaching Management stay as "a client".
6. **Freelance experience:** not adding Experience entries. CLM API still names WaTheta in its project title.
