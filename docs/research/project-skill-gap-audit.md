# Project skill-gap audit

Audited: 2026-08-20

Scope: the 31 repositories referenced by `src/data/projects.json`, checked on their default branches. Evidence was limited to repository-owned source, direct manifests, configuration, workflows, tests, and substantive architecture documentation. Lockfile-only packages, generated files, dataset text, future plans without execution evidence, normal Git repository existence, and Foliofarer's self-referential portfolio data were excluded.

The earlier [all-project technology audit](project-github-audit.md) remains the source-by-source baseline for the rest of each project's stack. This follow-up rechecked every current `skills.json` item and made a deeper pass over the 12 requested borderline skills.

## Decision summary

| Skill                 | Verdict  | Project evidence | Required metadata change                                                                        |
| --------------------- | -------- | ---------------: | ----------------------------------------------------------------------------------------------- |
| GitHub Actions        | Add/keep |  21 repositories | Add to the 21 project technology arrays listed below.                                           |
| Git                   | Add/keep |  10 repositories | Add only where Git is invoked by project tooling, not merely because the code is hosted in Git. |
| React Testing Library | Add/keep |   4 repositories | Add to Routempo, Skillfoliox, Thoughtline, and VidQuery.                                        |
| System Design         | Add/keep |  15 repositories | Add where the repository documents concrete architecture, boundaries, or deployment design.     |
| PhpMyAdmin            | Remove   |                0 | Remove from `skills.json`; no project implementation evidence.                                  |
| Lighthouse            | Remove   |                0 | Remove; no Lighthouse/LHCI config, execution result, workflow, or direct dependency.            |
| Scrum                 | Remove   |                0 | Remove; no project-owned sprint/backlog/process evidence.                                       |
| Agile Methodologies   | Remove   |                0 | Remove; no explicit project practice evidence.                                                  |
| Microsoft Office      | Remove   |                0 | Remove the umbrella label. XLSX handling and Microsoft APIs do not prove Office-suite use.      |
| Opentok               | Remove   |                0 | Remove; no SDK, import, dependency, or configuration.                                           |
| Microservices         | Remove   |                0 | Remove; no repository contains an implemented multi-service system.                             |
| SSO                   | Remove   |                0 | Remove; social OAuth login is not evidence of SSO/SAML/enterprise OIDC.                         |

## Positive evidence and exact project additions

### GitHub Actions — 21 projects

Each repository below contains an executable workflow under `.github/workflows`:

- [MulaLens release](https://github.com/montasim/MulaLens/blob/main/.github/workflows/release.yml)
- [Thoughtline CI](https://github.com/montasim/Thoughtline/blob/main/.github/workflows/ci.yml) and [release](https://github.com/montasim/Thoughtline/blob/main/.github/workflows/release.yml)
- [VidQuery CI](https://github.com/montasim/VidQuery/blob/main/.github/workflows/ci.yml) and [release](https://github.com/montasim/VidQuery/blob/main/.github/workflows/release.yml)
- [audit-frontend-consistency CI](https://github.com/montasim/audit-frontend-consistency/blob/main/.github/workflows/ci.yml)
- [Bangladesh Location Registry CI](https://github.com/montasim/bangladesh-location-registry/blob/main/.github/workflows/ci.yml)
- [client-parser CI](https://github.com/montasim/client-parser/blob/main/.github/workflows/ci.yml) and [publish](https://github.com/montasim/client-parser/blob/main/.github/workflows/publish.yml)
- [content-types-lite CI](https://github.com/montasim/content-types-lite/blob/main/.github/workflows/ci.yml) and [publish](https://github.com/montasim/content-types-lite/blob/main/.github/workflows/publish.yml)
- [craft-github-release CI](https://github.com/montasim/craft-github-release/blob/main/.github/workflows/ci.yml)
- [DevTools CI](https://github.com/montasim/devtools/blob/main/.github/workflows/ci.yml)
- [ensure-social-preview CI](https://github.com/montasim/ensure-social-preview/blob/main/.github/workflows/ci.yml)
- [http-status-lite CI](https://github.com/montasim/http-status-lite/blob/main/.github/workflows/ci.yml), [publish](https://github.com/montasim/http-status-lite/blob/main/.github/workflows/publish.yml), and [registry](https://github.com/montasim/http-status-lite/blob/main/.github/workflows/registry.yml)
- [mime-types-lite CI](https://github.com/montasim/mime-types-lite/blob/main/.github/workflows/ci.yml) and [release](https://github.com/montasim/mime-types-lite/blob/main/.github/workflows/release.yml)
- [prepare-github-project CI](https://github.com/montasim/prepare-github-project/blob/main/.github/workflows/ci.yml)
- [prepare-netlify-deployment CI](https://github.com/montasim/prepare-netlify-deployment/blob/main/.github/workflows/ci.yml)
- [publish-skill-to-skillfolio CI](https://github.com/montasim/publish-skill-to-skillfolio/blob/main/.github/workflows/ci.yml)
- [Ramadan Clock CI](https://github.com/montasim/ramadan-clock/blob/main/.github/workflows/ci.yml)
- [ship-agent-skill CI](https://github.com/montasim/ship-agent-skill/blob/main/.github/workflows/ci.yml)
- [Shrnkly scheduled workflow](https://github.com/montasim/shrnkly-url-shortener/blob/main/.github/workflows/url-cleanup.yml) — present, but the repository README identifies this workflow as mismatched; retain that caveat if the project description discusses CI quality.
- [sync-project-metadata CI](https://github.com/montasim/sync-project-metadata/blob/main/.github/workflows/ci.yml)
- [verify-project-release CI](https://github.com/montasim/verify-project-release/blob/main/.github/workflows/ci.yml)
- [write-project-readme CI](https://github.com/montasim/write-project-readme/blob/main/.github/workflows/ci.yml) and [publish](https://github.com/montasim/write-project-readme/blob/main/.github/workflows/publish.yml)

### Git — 10 projects

These projects invoke Git as part of their implementation, release automation, audit tooling, or deployment filtering:

- [ship-agent-skill preflight](https://github.com/montasim/ship-agent-skill/blob/main/skills/ship-agent-skill/scripts/preflight.mjs)
- [verify-project-release verifier](https://github.com/montasim/verify-project-release/blob/main/skills/verify-project-release/scripts/verify-release.mjs)
- [audit-frontend-consistency CLI](https://github.com/montasim/audit-frontend-consistency/blob/main/bin/audit-frontend-consistency.js)
- [write-project-readme CLI](https://github.com/montasim/write-project-readme/blob/main/bin/write-project-readme.js)
- [prepare-github-project audit script](https://github.com/montasim/prepare-github-project/blob/main/skills/prepare-github-project/scripts/audit-github-project.mjs)
- [craft-github-release evidence collector](https://github.com/montasim/craft-github-release/blob/main/skills/craft-github-release/scripts/collect-release-evidence.mjs)
- [MulaLens Netlify build filter](https://github.com/montasim/MulaLens/blob/main/apps/web/netlify.toml)
- [VidQuery Netlify build filter](https://github.com/montasim/VidQuery/blob/main/apps/web/netlify.toml)
- [Thoughtline Netlify build filter](https://github.com/montasim/Thoughtline/blob/main/apps/web/netlify.toml)
- [Shrnkly release scripts](https://github.com/montasim/shrnkly-url-shortener/blob/main/package.json)

### React Testing Library — 4 projects

- [Routempo component test](https://github.com/montasim/Routempo/blob/main/src/components/add-routine-dialog.test.tsx)
- [Skillfoliox component test](https://github.com/montasim/Skillfoliox/blob/main/src/components/skill-detail-frame.test.tsx)
- [Thoughtline extension test](https://github.com/montasim/Thoughtline/blob/main/apps/extension/tests/unit/calibration-view.test.tsx)
- [VidQuery extension test](https://github.com/montasim/VidQuery/blob/main/apps/extension/tests/unit/popup-app.test.tsx)

DevTools directly declares `@testing-library/react`, but no repository source imports it; a declaration alone was not counted as active use.

### System Design — 15 projects

Concrete architecture/boundary/deployment documentation supports adding `System Design` to Routempo, EduCanvas, Book Heaven, PostCraft, Shrnkly, Skillfoliox, Thoughtline, VidQuery, b4joinacompany, DevTools, Foliofarer, GitHub README Counter, Ramadan Clock, http-status-lite, and mime-types-lite. Representative strong evidence includes the [Routempo architecture](https://github.com/montasim/Routempo#architecture), [EduCanvas architecture](https://github.com/montasim/EduCanvas#architecture), and [Book Heaven architecture](https://github.com/montasim/book-heaven#architecture). This is a demonstrated design competency, not a package dependency.

## Rejected evidence for the eight removals

- **PhpMyAdmin:** Foliofarer contains the label only inside its portfolio/learning data. No audited application contains phpMyAdmin configuration, exported phpMyAdmin artifacts, or operational documentation.
- **Lighthouse:** Markdown Typing SVG has a manual/future [SEO validation guide](https://github.com/montasim/markdown-typing-svg/blob/main/plans/seo-testing-validation-guide.md), not an executed audit or configured tool. Client Parser merely recognizes the Lighthouse user-agent in a detector. Neither proves Lighthouse use.
- **Scrum / Agile Methodologies:** occurrences in the b4join dataset are third-party story content, not the project's development process. Portfolio skill strings and future planning prose were also excluded.
- **Microsoft Office:** TIN Audit Checker uses SheetJS to process workbook files, while other projects mention Microsoft Graph/Outlook. Neither is evidence for using the Office suite as a project technology.
- **Opentok:** the only exact claims are Foliofarer portfolio content; no SDK or implementation exists in the audited project source.
- **Microservices:** Book Heaven documents an externally deployed Socket.IO service but does not contain its source; Shrnkly has a package keyword while documenting one Next.js application. Neither meets the implementation threshold.
- **SSO:** OAuth providers in Better Auth/NextAuth projects implement social sign-in. None documents or implements SAML or an enterprise OIDC SSO flow.

## Full current skill-count check

Counts below are the application's current evidence counts before applying this audit. `P` means projects and `E` means experience roles. The four additions above currently show zero because their project technology labels are missing.

| Category                    | Skill counts (`skill P/E`)                                                                                                                                                                                                                                                                                                                                                                                             |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend                    | React.js 13/4; Next.js 10/0; TypeScript 19/1; JavaScript 12/2; HTML5 0/2; CSS 0/2; Tailwind CSS 11/2; Redux.js 1/1; TanStack Start 8/0; TanStack Query 1/0; React Three Fiber 1/0; Three.js 1/0; Drei 1/0; React Three Rapier 1/0; shadcn/ui 2/0; Radix UI 1/0; React Hook Form 1/0; React Markdown 1/0; CodeMirror 6 1/0; next-intl 1/0; Vite 1/0; Bootstrap 0/1; jQuery 0/1; Responsive Web Design 0/1; Konva.js 0/1 |
| Backend & APIs              | Node.js 13/2; Express.js 1/1; Socket.io 1/0; REST APIs 7/0; Better Auth 5/0; NextAuth 1/0; Zod 4/0; BullMQ 1/0; Inngest 1/0; Web Push 1/0; Resend 1/0; Stripe 1/0; Google Drive API 1/0; Python 2/0; PHP 0/1                                                                                                                                                                                                           |
| Databases & ORM             | PostgreSQL 4/1; MongoDB 4/0; Prisma 4/0; Drizzle ORM 1/0; Mongoose 1/0; Redis 1/0; SQLite 1/0; PhpMyAdmin 0/0                                                                                                                                                                                                                                                                                                          |
| AI & Agent Development      | Agent Skills 10/0; Gemini API 4/0; Groq API 2/0; OpenRouter 1/0                                                                                                                                                                                                                                                                                                                                                        |
| Browser Extensions          | WXT 2/0; Chrome Extensions API 3/0; Chrome Manifest V3 3/0                                                                                                                                                                                                                                                                                                                                                             |
| Cloud & DevOps              | Microsoft Azure 0/2; Docker 0/1; GitHub Actions 0/0; CI/CD 0/1; Git 0/0; Netlify 3/0; npm 10/0; tsup 4/0; esbuild 1/0; IT Operations 0/2                                                                                                                                                                                                                                                                               |
| Testing & Quality           | Jest 1/0; Vitest 8/0; Playwright 3/0; React Testing Library 0/0; Lighthouse 0/0                                                                                                                                                                                                                                                                                                                                        |
| Design & Collaboration      | Figma 0/2; Scrum 0/0; Agile Methodologies 0/0                                                                                                                                                                                                                                                                                                                                                                          |
| Office Productivity         | Microsoft Word 0/2; Microsoft Excel 0/2; Microsoft PowerPoint 0/2; Microsoft Office 0/0                                                                                                                                                                                                                                                                                                                                |
| Real-Time & Computer Vision | WebRTC 0/1; Opentok 0/0; MediaPipe 0/1                                                                                                                                                                                                                                                                                                                                                                                 |
| Architecture & Security     | System Design 0/0; Microservices 0/0; SSO 0/0                                                                                                                                                                                                                                                                                                                                                                          |

Experience-only skills with positive counts remain valid catalog entries; their lack of a project match is not a removal signal. The unsupported zero-evidence entries are exactly PhpMyAdmin, Lighthouse, Scrum, Agile Methodologies, Microsoft Office, Opentok, Microservices, and SSO. `System Design`, `GitHub Actions`, `Git`, and `React Testing Library` become supported after correcting project labels.

## Additional project-label correction

`mime-types-lite` currently lists `Vitest`, but its tests import Node's built-in `node:test` and no direct manifest declares Vitest. Remove `Vitest` from that project's technologies. The corrected Vitest count is therefore **7 projects**, not 8. [Runtime test evidence](https://github.com/montasim/mime-types-lite/blob/main/packages/mime-types-lite/test/runtime/lookup.test.mjs)

No other current `skills.json` label contradicted the verified project/experience evidence baseline. Project technologies intentionally omitted from the skill catalog because they are formats or narrow utilities include ESM, CommonJS, JSON, JSONL, SVG, QRCode, SheetJS, jsPDF, and Aladhan API.
