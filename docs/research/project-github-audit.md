# Project GitHub evidence audit

Audited 2026-08-20 against the current default branch of every GitHub repository referenced by `src/data/projects.json`. The repository metadata/topics endpoint, GitHub language analysis, checked-in manifests/configuration, and first-party README files are treated as primary evidence. A package being installed proves that it is part of the checked-in stack, but not necessarily that every feature using it is active in production. Product concepts, data subject matter, workflow names, and standards are called out separately rather than presented as implementation technologies.

Common source pattern for every entry:

- `Repository metadata / topics` is the repository page plus `https://api.github.com/repos/{owner}/{repo}/topics`.
- `Languages` is `https://api.github.com/repos/{owner}/{repo}/languages`.
- Manifest and README links point to the repository's current default branch.

## Projects 1–15

All 15 repositories were accessible on `main`. Their current `topics` arrays in `projects.json` already exactly match GitHub.

### 1. Routempo

- Repository: https://github.com/montasim/Routempo
- Verified technologies: TanStack Start, React, TypeScript, Tailwind CSS, Drizzle ORM, Neon PostgreSQL, Better Auth, Web Push, Vitest, Playwright.
- GitHub topics: `behavioral-measurement`, `consistency`, `habits`, `productivity`, `routine`, `tracking`
- Evidence: [package.json](https://github.com/montasim/Routempo/blob/main/package.json), [README](https://github.com/montasim/Routempo/blob/main/README.md), [languages](https://api.github.com/repos/montasim/Routempo/languages), [topics](https://api.github.com/repos/montasim/Routempo/topics)
- Ambiguity: Existing `Productivity` and `Behavior tracking` are product/domain concepts, not implementation technologies. The current technology list is materially incomplete.

### 2. Foliofarer

- Repository: https://github.com/montasim/foliofarer
- Verified technologies: Next.js, React, TypeScript, Three.js, React Three Fiber, Drei, React Three Rapier, Tailwind CSS, Playwright. Generator tooling also includes polygon-clipping, Earcut, and simplex-noise.
- GitHub topics: `3d-portfolio`, `accessibility`, `developer-portfolio`, `interactive-portfolio`, `nextjs`, `playwright`, `portfolio-website`, `procedural-generation`, `react`, `react-three-fiber`, `threejs`, `typescript`, `webgl`
- Evidence: [package.json](https://github.com/montasim/foliofarer/blob/main/package.json), [README](https://github.com/montasim/foliofarer/blob/main/README.md), [languages](https://api.github.com/repos/montasim/foliofarer/languages), [topics](https://api.github.com/repos/montasim/foliofarer/topics)
- Ambiguity: Procedural generation is a technique, while the named generator libraries are concrete technologies.

### 3. VidQuery

- Repository: https://github.com/montasim/VidQuery
- Verified technologies: WXT, React, TypeScript, Chrome Manifest V3, Chrome Extensions API, Tailwind CSS, Gemini API, Zod, Vitest. The companion website uses TanStack Start.
- GitHub topics: `ai-assistant`, `browser-extension`, `chrome-extension`, `gemini`, `typescript`, `video-transcript`, `youtube`
- Evidence: [extension manifest](https://github.com/montasim/VidQuery/blob/main/apps/extension/package.json), [web manifest](https://github.com/montasim/VidQuery/blob/main/apps/web/package.json), [README](https://github.com/montasim/VidQuery/blob/main/README.md), [topics](https://api.github.com/repos/montasim/VidQuery/topics)
- Ambiguity: YouTube is an external platform/product surface rather than an implementation technology.

### 4. Thoughtline

- Repository: https://github.com/montasim/Thoughtline
- Verified technologies: WXT, React 19, TypeScript, Chrome Manifest V3, Chrome Extensions API, Tailwind CSS, Gemini API, Groq API, Zod, Vitest, Playwright. The companion website uses TanStack Start.
- GitHub topics: `ai-assistant`, `chrome-extension`, `linkedin`, `productivity`, `react`, `typescript`, `writing-assistant`
- Evidence: [extension manifest](https://github.com/montasim/Thoughtline/blob/main/apps/extension/package.json), [web manifest](https://github.com/montasim/Thoughtline/blob/main/apps/web/package.json), [README](https://github.com/montasim/Thoughtline/blob/main/README.md), [topics](https://api.github.com/repos/montasim/Thoughtline/topics)
- Ambiguity: LinkedIn and productivity describe the integration/product domain.

### 5. MulaLens

- Repository: https://github.com/montasim/MulaLens
- Verified technologies: TypeScript, Chrome Manifest V3, Chrome Extensions API, esbuild, TanStack Start, React, Tailwind CSS, Vitest, Netlify; hosted b4join API integration.
- GitHub topics: `ai-summaries`, `ai-summarizer`, `chrome-extension`, `deshi-mula`, `deshi-mula-com`, `deshimula`, `extension`, `leet-speak-decoder`, `productivity-tool`, `salary-lookup`, `sentiment-analysis`
- Evidence: [extension package](https://github.com/montasim/MulaLens/blob/main/apps/extension/package.json), [web package](https://github.com/montasim/MulaLens/blob/main/apps/web/package.json), [Chrome manifest](https://github.com/montasim/MulaLens/blob/main/apps/extension/extension/manifest.json), [README](https://github.com/montasim/MulaLens/blob/main/README.md), [topics](https://api.github.com/repos/montasim/MulaLens/topics)
- Ambiguity: Important correction: existing `Gemini API` and `AI summaries` are not implementation technologies in this repository. The README says the extension is a thin client to the hosted b4join API and bundles neither a backend API key nor research dataset. The AI-related topics remain valid product/discovery metadata.

### 6. Skillfoliox

- Repository: https://github.com/montasim/Skillfoliox
- Verified technologies: TanStack Start/Router, React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui, Radix UI, React Markdown, Vitest, Netlify.
- GitHub topics: `agent-skills`, `ai-agents`, `claude-code`, `cursor`, `developer-tools`, `openai-codex`, `react`, `shadcn-ui`, `skill-library`, `skill-md`, `tailwindcss`, `tanstack-start`, `typescript`
- Evidence: [package.json](https://github.com/montasim/Skillfoliox/blob/main/package.json), [README](https://github.com/montasim/Skillfoliox/blob/main/README.md), [languages](https://api.github.com/repos/montasim/Skillfoliox/languages), [topics](https://api.github.com/repos/montasim/Skillfoliox/topics)
- Ambiguity: `Agent Skills` is the catalog/domain format rather than the website implementation.

### 7. ship-agent-skill

- Repository: https://github.com/montasim/ship-agent-skill
- Verified technologies: Agent Skills, JavaScript, Node.js >=18, npm; zero runtime dependencies and Node's built-in test runner.
- GitHub topics: `agent-skills`, `ai-agents`, `claude-code`, `codex`, `developer-tools`, `github-releases`, `npm-publish`, `release-automation`, `skill-validation`, `software-supply-chain`
- Evidence: [package.json](https://github.com/montasim/ship-agent-skill/blob/main/package.json), [preflight implementation](https://github.com/montasim/ship-agent-skill/blob/main/skills/ship-agent-skill/scripts/preflight.mjs), [topics](https://api.github.com/repos/montasim/ship-agent-skill/topics)
- Ambiguity: GitHub Releases, release automation, and software supply chain describe the workflow domain.

### 8. verify-project-release

- Repository: https://github.com/montasim/verify-project-release
- Verified technologies: Agent Skills, JavaScript, Node.js >=18, npm; zero runtime dependencies and Node's built-in test runner.
- GitHub topics: `agent-skills`, `ai-agents`, `claude-code`, `codex`, `continuous-integration`, `developer-tools`, `npm`, `npm-package`, `release-verification`, `software-supply-chain`
- Evidence: [package.json](https://github.com/montasim/verify-project-release/blob/main/package.json), [scripts](https://github.com/montasim/verify-project-release/tree/main/skills/verify-project-release/scripts), [topics](https://api.github.com/repos/montasim/verify-project-release/topics)
- Ambiguity: CI and release verification are purposes, not implementation technologies; existing `CI` is unsupported as a technology label.

### 9. write-project-readme

- Repository: https://github.com/montasim/write-project-readme
- Verified technologies: Agent Skills, JavaScript, Node.js >=18, npm; zero runtime dependencies and Node's built-in test runner.
- GitHub topics: `agent-skills`, `claude-code`, `codex`, `documentation`, `readme`, `readme-generator`
- Evidence: [package.json](https://github.com/montasim/write-project-readme/blob/main/package.json), [README checker](https://github.com/montasim/write-project-readme/blob/main/skills/write-project-readme/scripts/check-readme.mjs), [topics](https://api.github.com/repos/montasim/write-project-readme/topics)
- Ambiguity: Documentation is the project purpose, not a technology.

### 10. craft-github-release

- Repository: https://github.com/montasim/craft-github-release
- Verified technologies: Agent Skills, JavaScript, Node.js >=18, npm; zero runtime dependencies and Node's built-in test runner.
- GitHub topics: `agent-skills`, `ai-agents`, `changelog`, `claude-code`, `codex`, `developer-tools`, `github-releases`, `npm`, `release-notes`, `semantic-versioning`
- Evidence: [package.json](https://github.com/montasim/craft-github-release/blob/main/package.json), [evidence collector](https://github.com/montasim/craft-github-release/blob/main/skills/craft-github-release/scripts/collect-release-evidence.mjs), [topics](https://api.github.com/repos/montasim/craft-github-release/topics)
- Ambiguity: GitHub Releases and semantic versioning are workflow targets/concepts rather than implementation technologies.

### 11. sync-project-metadata

- Repository: https://github.com/montasim/sync-project-metadata
- Verified technologies: Agent Skills, JavaScript, Node.js >=18, npm; zero runtime dependencies and Node's built-in test runner.
- GitHub topics: `agent-skills`, `ai-agents`, `automation`, `claude-code`, `codex`, `developer-tools`, `metadata-management`, `npm`, `project-metadata`, `release-automation`
- Evidence: [package.json](https://github.com/montasim/sync-project-metadata/blob/main/package.json), [metadata auditor](https://github.com/montasim/sync-project-metadata/blob/main/skills/sync-project-metadata/scripts/audit-metadata.mjs), [topics](https://api.github.com/repos/montasim/sync-project-metadata/topics)
- Ambiguity: Automation and metadata management are project purposes, not technologies.

### 12. prepare-netlify-deployment

- Repository: https://github.com/montasim/prepare-netlify-deployment
- Verified technologies: Agent Skills, JavaScript, Python, Node.js >=18, npm, Netlify; zero runtime dependencies and Node's built-in test runner.
- GitHub topics: `agent-skills`, `ai-agents`, `claude-code`, `codex`, `deployment`, `developer-tools`, `netlify`, `server-side-rendering`, `single-page-application`, `web-development`
- Evidence: [package.json](https://github.com/montasim/prepare-netlify-deployment/blob/main/package.json), [Python auditor](https://github.com/montasim/prepare-netlify-deployment/blob/main/skills/prepare-netlify-deployment/scripts/audit_netlify.py), [languages](https://api.github.com/repos/montasim/prepare-netlify-deployment/languages), [topics](https://api.github.com/repos/montasim/prepare-netlify-deployment/topics)
- Ambiguity: Deployment is the purpose; Netlify is the target platform. The current technology list omits the checked-in JavaScript/Node.js/npm implementation.

### 13. audit-frontend-consistency

- Repository: https://github.com/montasim/audit-frontend-consistency
- Verified technologies: Agent Skills, JavaScript, Node.js >=18, npm; zero runtime dependencies and Node's built-in test runner.
- GitHub topics: `accessibility`, `agent-skills`, `ai-agents`, `claude-code`, `codex`, `design-system`, `developer-tools`, `frontend`, `responsive-design`, `user-interface`
- Evidence: [package.json](https://github.com/montasim/audit-frontend-consistency/blob/main/package.json), [skill source](https://github.com/montasim/audit-frontend-consistency/tree/main/skills), [topics](https://api.github.com/repos/montasim/audit-frontend-consistency/topics)
- Ambiguity: Accessibility and design systems are audit concerns, not repository implementation dependencies.

### 14. prepare-github-project

- Repository: https://github.com/montasim/prepare-github-project
- Verified technologies: Agent Skills, JavaScript, Node.js >=18, npm; zero runtime dependencies and Node's built-in test runner. GitHub CLI is a workflow prerequisite if external tools are included in the taxonomy.
- GitHub topics: `agent-skills`, `ai-agents`, `claude-code`, `codex`, `continuous-integration`, `developer-tools`, `devops`, `github`, `repository-management`, `repository-metadata`
- Evidence: [package.json](https://github.com/montasim/prepare-github-project/blob/main/package.json), [repository auditor](https://github.com/montasim/prepare-github-project/blob/main/skills/prepare-github-project/scripts/audit-github-project.mjs), [topics](https://api.github.com/repos/montasim/prepare-github-project/topics)
- Ambiguity: GitHub and CI are target platform/workflow concepts, not core implementation dependencies.

### 15. publish-skill-to-skillfolio

- Repository: https://github.com/montasim/publish-skill-to-skillfolio
- Verified technologies: Agent Skills, JavaScript, Python, Node.js >=18, npm; zero runtime dependencies and Node's built-in test runner.
- GitHub topics: `agent-skills`, `ai-agents`, `catalog-management`, `claude-code`, `codex`, `developer-tools`, `npm`, `sitemap`, `skill-catalog`, `skillfolio`
- Evidence: [package.json](https://github.com/montasim/publish-skill-to-skillfolio/blob/main/package.json), [Python validator](https://github.com/montasim/publish-skill-to-skillfolio/blob/main/skills/publish-skill-to-skillfolio/scripts/validate_catalog_entry.py), [languages](https://api.github.com/repos/montasim/publish-skill-to-skillfolio/languages), [topics](https://api.github.com/repos/montasim/publish-skill-to-skillfolio/topics)
- Ambiguity: Catalog management and sitemaps are purpose/output concepts. The current technology list omits Python and Node.js.

## Projects 16–31

### 16. ensure-social-preview

- Repository: https://github.com/montasim/ensure-social-preview (default branch `main`)
- Verified technologies: JavaScript; Node.js >=18; npm packaging; Agent Skills (`SKILL.md` workflow). Open Graph and Twitter Cards are standards the skill audits, not runtime frameworks.
- GitHub topics: `agent-skills`, `claude-code`, `codex`, `developer-tools`, `npm-package`, `og-image`, `open-graph`, `seo`, `social-preview`, `twitter-cards`
- Evidence: [package.json](https://github.com/montasim/ensure-social-preview/blob/main/package.json), [README](https://github.com/montasim/ensure-social-preview/blob/main/README.md), [languages](https://api.github.com/repos/montasim/ensure-social-preview/languages), [topics](https://api.github.com/repos/montasim/ensure-social-preview/topics)
- Ambiguity: `SEO`, `Open Graph`, and `Twitter Cards` describe the audited domain/standards. The root manifest has no runtime dependencies.

### 17. Bangladesh Location Registry

- Repository: https://github.com/montasim/bangladesh-location-registry (default branch `main`)
- Verified technologies: JavaScript; Node.js >=24; JSON and JSON Schema in the checked-in repository; release tooling produces JSON, JSONL, and compressed SQLite artifacts. `Government data` and `data provenance` are subject/domain descriptors.
- GitHub topics: `administrative-divisions`, `bangladesh`, `census`, `data-provenance`, `dataset`, `government-data`, `json`, `jsonl`, `location-data`, `postal-code`, `public-facilities`, `sqlite`, `upazila`, `village`
- Evidence: [package.json](https://github.com/montasim/bangladesh-location-registry/blob/main/package.json), [README release formats](https://github.com/montasim/bangladesh-location-registry/blob/main/README.md#download-and-use), [schemas](https://github.com/montasim/bangladesh-location-registry/tree/main/schemas), [languages](https://api.github.com/repos/montasim/bangladesh-location-registry/languages), [topics](https://api.github.com/repos/montasim/bangladesh-location-registry/topics)
- Ambiguity: JSONL and SQLite datasets are release assets rather than files committed repeatedly to Git. The README's download links still use the former `address-bd-data` repository path, so those links should be checked separately when metadata is updated.

### 18. EduCanvas

- Repository: https://github.com/montasim/EduCanvas (default branch `main`)
- Verified technologies: Next.js 16, React 19, TypeScript, Tailwind CSS 4, MongoDB driver, Better Auth/Google OAuth, Google APIs, Resend, Radix UI, Playwright.
- GitHub topics: `content-management`, `education`, `nextjs`, `tailwindcss`, `typescript`, `website-starter`
- Evidence: [package.json](https://github.com/montasim/EduCanvas/blob/main/package.json), [README tech stack](https://github.com/montasim/EduCanvas/blob/main/README.md), [Playwright config](https://github.com/montasim/EduCanvas/blob/main/playwright.config.ts), [languages](https://api.github.com/repos/montasim/EduCanvas/languages), [topics](https://api.github.com/repos/montasim/EduCanvas/topics)
- Ambiguity: `CMS` and `Education` are product/category descriptors, not implementation technologies.

### 19. content-types-lite

- Repository: https://github.com/montasim/content-types-lite (default branch `main`)
- Verified technologies: TypeScript library; dual ESM/CommonJS output; tsup; zero runtime dependencies; pnpm workspace. Demo site: TanStack Start/Router, React, Tailwind CSS, Vite, Vitest, Netlify adapter.
- GitHub topics: `commonjs`, `content-negotiation`, `content-type`, `esm`, `http-headers`, `javascript`, `media-types`, `mime`, `mime-types`, `npm-package`, `parser`, `typescript`, `validation`, `zero-dependency`
- Evidence: [library manifest](https://github.com/montasim/content-types-lite/blob/main/packages/content-types-lite/package.json), [web manifest](https://github.com/montasim/content-types-lite/blob/main/apps/web/package.json), [workspace manifest](https://github.com/montasim/content-types-lite/blob/main/package.json), [languages](https://api.github.com/repos/montasim/content-types-lite/languages), [topics](https://api.github.com/repos/montasim/content-types-lite/topics)
- Ambiguity: ESM, CommonJS, and zero-dependency are package characteristics/output formats rather than frameworks.

### 20. http-status-lite

- Repository: https://github.com/montasim/http-status-lite (default branch `main`)
- Verified technologies: TypeScript library; dual ESM/CommonJS output; tsup; zero runtime dependencies; pnpm workspace. Demo site: TanStack Start/Router, React, Tailwind CSS, Vite, Netlify adapter.
- GitHub topics: `browser`, `commonjs`, `esm`, `fetch`, `http`, `http-status`, `http-status-codes`, `iana`, `javascript`, `lightweight`, `nodejs`, `rfc9110`, `status-codes`, `type-safe`, `typescript`, `zero-dependency`
- Evidence: [library manifest](https://github.com/montasim/http-status-lite/blob/main/packages/http-status-lite/package.json), [web manifest](https://github.com/montasim/http-status-lite/blob/main/apps/web/package.json), [workspace manifest](https://github.com/montasim/http-status-lite/blob/main/package.json), [languages](https://api.github.com/repos/montasim/http-status-lite/languages), [topics](https://api.github.com/repos/montasim/http-status-lite/topics)
- Ambiguity: RFC 9110 and IANA are authoritative standards/data sources, not implementation technologies; browser/fetch are supported environments/APIs.

### 21. mime-types-lite

- Repository: https://github.com/montasim/mime-types-lite (default branch `main`)
- Verified technologies: TypeScript library; dual ESM/CommonJS output; tsup; zero runtime dependencies; pnpm workspace. Demo site: TanStack Start/Router, React, Tailwind CSS, Vite, Vitest, Netlify adapter.
- GitHub topics: `commonjs`, `content-type`, `esm`, `file-extension`, `http`, `media-type`, `mime`, `mime-types`, `typescript`, `uploads`, `validation`, `zero-dependency`
- Evidence: [library manifest](https://github.com/montasim/mime-types-lite/blob/main/packages/mime-types-lite/package.json), [web manifest](https://github.com/montasim/mime-types-lite/blob/main/apps/web/package.json), [workspace manifest](https://github.com/montasim/mime-types-lite/blob/main/package.json), [languages](https://api.github.com/repos/montasim/mime-types-lite/languages), [topics](https://api.github.com/repos/montasim/mime-types-lite/topics)
- Ambiguity: ESM, CommonJS, and zero-dependency are package characteristics/output formats.

### 22. client-parser

- Repository: https://github.com/montasim/client-parser (default branch `main`)
- Verified technologies: TypeScript library; CommonJS plus ESM output; tsup; Vitest; zero runtime dependencies; pnpm workspace. Demo site: TanStack Start/Router, React, Tailwind CSS, Vite, Netlify adapter.
- GitHub topics: `bot-detection`, `browser-detection`, `client-hints`, `device-detection`, `mobile-detection`, `os-detection`, `typescript`, `user-agent`, `user-agent-parser`, `zero-dependency`
- Evidence: [library manifest](https://github.com/montasim/client-parser/blob/main/packages/client-parser/package.json), [web manifest](https://github.com/montasim/client-parser/blob/main/apps/web/package.json), [workspace manifest](https://github.com/montasim/client-parser/blob/main/package.json), [languages](https://api.github.com/repos/montasim/client-parser/languages), [topics](https://api.github.com/repos/montasim/client-parser/topics)
- Ambiguity: User-Agent and Client Hints are parsed browser/HTTP inputs, not frameworks.

### 23. b4joinacompany

- Repository: https://github.com/montasim/b4joinacompany (default branch `main`)
- Verified technologies: Next.js 16, React 19, TypeScript, Tailwind CSS, MongoDB, Better Auth, Zod, Vitest. The README documents optional Gemini and Groq answer synthesis with a deterministic fallback.
- GitHub topics: `career-tools`, `company-research`, `due-diligence`, `employment`, `job-search`, `web-application`
- Evidence: [package.json](https://github.com/montasim/b4joinacompany/blob/main/package.json), [README tech stack and AI behavior](https://github.com/montasim/b4joinacompany/blob/main/README.md), [languages](https://api.github.com/repos/montasim/b4joinacompany/languages), [topics](https://api.github.com/repos/montasim/b4joinacompany/topics)
- Ambiguity: Gemini/Groq do not appear as SDK dependencies in the manifest; their first-party README evidence indicates provider integration, likely through direct HTTP calls. They should be described as integrations, not core frameworks.

### 24. Book Heaven

- Repository: https://github.com/montasim/book-heaven (default branch `main`)
- Verified technologies: Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui/Radix UI, PostgreSQL, Prisma 7, Redis/ioredis, BullMQ, Socket.IO, TanStack Query/Table, Firebase, Stripe, Resend, React Hook Form, Zod. The README also documents ZhipuAI/Gemini and optional pgvector retrieval.
- GitHub topics: `admin-dashboard`, `book-management`, `nextjs`, `shadcn-ui`, `tailwindcss`, `typescript`
- Evidence: [package.json](https://github.com/montasim/book-heaven/blob/main/package.json), [README architecture/stack](https://github.com/montasim/book-heaven/blob/main/README.md), [Prisma schema](https://github.com/montasim/book-heaven/blob/main/prisma/schema.prisma), [languages](https://api.github.com/repos/montasim/book-heaven/languages), [topics](https://api.github.com/repos/montasim/book-heaven/topics)
- Ambiguity: The repository has a Prisma schema but no committed migrations. AI providers and pgvector are documented integrations/capabilities rather than named package dependencies.

### 25. Markdown Typing SVG

- Repository: https://github.com/montasim/markdown-typing-svg (default branch `main`)
- Verified technologies: Next.js, React, TypeScript, Tailwind CSS, SVG generation, Zod, Radix Toast.
- GitHub topics: `animation`, `generator`, `github-readme`, `nextjs`, `profile-readme`, `svg`, `typescript`, `typing`, `typing-animation`
- Evidence: [package.json](https://github.com/montasim/markdown-typing-svg/blob/main/package.json), [README](https://github.com/montasim/markdown-typing-svg/blob/main/README.md), [languages](https://api.github.com/repos/montasim/markdown-typing-svg/languages), [topics](https://api.github.com/repos/montasim/markdown-typing-svg/topics)
- Ambiguity: `API` is an application surface/capability, not a technology. SVG is a web format used by the implementation.

### 26. Shrnkly

- Repository: https://github.com/montasim/shrnkly-url-shortener (default branch `main`)
- Verified technologies: Next.js, React, TypeScript, Tailwind CSS, Prisma with MongoDB, next-intl, QRCode, React Hook Form, Zod, Jest, pnpm. ioredis is installed but the README reports no active Redis runtime integration.
- GitHub topics: `code-sharing`, `developer-tools`, `link-expiration`, `link-shortener`, `link-tracking`, `password-protection`, `productivity`, `qr-code`, `qr-code-generator`, `text-sharing`, `url-shortener`, `url-shortening`
- Evidence: [package.json](https://github.com/montasim/shrnkly-url-shortener/blob/main/package.json), [README implementation caveats](https://github.com/montasim/shrnkly-url-shortener/blob/main/README.md), [Prisma schema](https://github.com/montasim/shrnkly-url-shortener/blob/main/prisma/schema.prisma), [languages](https://api.github.com/repos/montasim/shrnkly-url-shortener/languages), [topics](https://api.github.com/repos/montasim/shrnkly-url-shortener/topics)
- Ambiguity: Do not list Redis as an active technology without qualification. Docker files are checked in, but the README identifies the container path as stale/broken; Docker therefore should not be advertised as a reliable current deployment technology.

### 27. GitHub README Counter

- Repository: https://github.com/montasim/github-readme-counter (default branch `main`)
- Verified technologies: JavaScript, Node.js >=20, Express, SVG generation; pnpm lockfile. `API`/web service describe the delivery surface.
- GitHub topics: `api`, `counter`, `customizable-svg`, `dynamic-svg`, `expressjs`, `github`, `glitch`, `nodejs`, `real-time`, `server`, `svg`, `visitor-counter`, `web-application`, `web-service`
- Evidence: [package.json](https://github.com/montasim/github-readme-counter/blob/main/package.json), [server entry](https://github.com/montasim/github-readme-counter/blob/main/server.js), [README](https://github.com/montasim/github-readme-counter/blob/main/README.md), [languages](https://api.github.com/repos/montasim/github-readme-counter/languages), [topics](https://api.github.com/repos/montasim/github-readme-counter/topics)
- Ambiguity: `real-time` and `GitHub` are product/context labels; no real-time transport library is installed.

### 28. Ramadan Clock

- Repository: https://github.com/montasim/ramadan-clock (default branch `main`)
- Verified technologies: Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui/Radix UI, PostgreSQL, Prisma ORM, NextAuth, Zod, Vitest, jsPDF/html2canvas, Moment Timezone.
- GitHub topics: `iftar`, `islamic-calendar`, `prayer-times`, `ramadan`, `sehar`
- Evidence: [package.json](https://github.com/montasim/ramadan-clock/blob/main/package.json), [README tech stack](https://github.com/montasim/ramadan-clock/blob/main/README.md), [Prisma schema](https://github.com/montasim/ramadan-clock/blob/main/prisma/schema.prisma), [languages](https://api.github.com/repos/montasim/ramadan-clock/languages), [topics](https://api.github.com/repos/montasim/ramadan-clock/topics)
- Ambiguity: The GitHub topics are entirely domain/product descriptors and intentionally do not enumerate the technical stack.

### 29. DevTools

- Repository: https://github.com/montasim/devtools (default branch `main`)
- Verified technologies: Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui/Radix UI, CodeMirror 6, TanStack React Query, PostgreSQL, Prisma 7, Better Auth, Vitest, Zod.
- GitHub topics: `api-request-builder`, `base64-encoder-decoder`, `cors-checker`, `curl-converter`, `developer-tools`, `devtools`, `hash-generator`, `html-entity-encoder`, `json-formatter`, `json-validator`, `markdown-previewer`, `password-generator`, `qr-code-generator`, `regex-tester`, `url-encoder`, `websocket-tester`
- Evidence: [package.json](https://github.com/montasim/devtools/blob/main/package.json), [README tech stack](https://github.com/montasim/devtools/blob/main/README.md), [Prisma schema](https://github.com/montasim/devtools/blob/main/prisma/schema.prisma), [languages](https://api.github.com/repos/montasim/devtools/languages), [topics](https://api.github.com/repos/montasim/devtools/topics)
- Ambiguity: GitHub topics enumerate individual product tools rather than the application stack.

### 30. PostCraft

- Repository: https://github.com/montasim/PostCraft (default branch `master`)
- Verified technologies: Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui/Radix UI, MongoDB/Mongoose, Better Auth, Inngest, Redux Toolkit/React Redux, Gemini SDK, OpenRouter SDK, OpenAI SDK, Resend, Zod. The README additionally documents Groq and ZhipuAI providers.
- GitHub topics: `ai-social-manager`, `content-creation`, `content-creation-automation`, `content-creation-tool`, `post-generator`, `social-media-automation`
- Evidence: [package.json](https://github.com/montasim/PostCraft/blob/master/package.json), [README stack](https://github.com/montasim/PostCraft/blob/master/README.md), [languages](https://api.github.com/repos/montasim/PostCraft/languages), [topics](https://api.github.com/repos/montasim/PostCraft/topics)
- Ambiguity: GitHub's dominant HTML byte count comes from tracked generated/reference material and should not be treated as the application's primary implementation language; the application manifest and source are TypeScript/Next.js. Groq and ZhipuAI are documented provider integrations rather than installed named SDKs.

### 31. TIN Audit Checker - Bangladesh

- Repository: https://github.com/montasim/tin-audit-checker (default branch `main`)
- Verified technologies: Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/Base UI, SheetJS (`xlsx`) for the bundled data workflow.
- GitHub topics: `assessment-year-2023-24`, `bangladesh-tax`, `bangladesh-tin`, `income-tax`, `nbr-audit`, `risk-based-audit`, `tax-return-audit`, `tin-checker`
- Evidence: [package.json](https://github.com/montasim/tin-audit-checker/blob/main/package.json), [README tech stack and provenance warning](https://github.com/montasim/tin-audit-checker/blob/main/README.md), [languages](https://api.github.com/repos/montasim/tin-audit-checker/languages), [topics](https://api.github.com/repos/montasim/tin-audit-checker/topics)
- Ambiguity: `Bangladesh tax data` and `Privacy-first` are dataset/product descriptors. The repository README explicitly says the dataset's claimed NBR provenance and redistribution rights are unverified, so neither should be converted into a technology claim or an authoritative-data claim.

## Cross-project metadata guidance

- Keep `technologies` for evidenced languages, frameworks, libraries, infrastructure, formats, and named external integrations. Product concepts such as productivity, education, AI summaries, privacy-first, and behavior tracking should remain in descriptions or topics.
- GitHub topics should normally be copied exactly from the topics API rather than inferred from dependencies. Topics intentionally mix technical search terms with product/domain discoverability terms.
- Qualify dependencies that are installed but documented as inactive (Shrnkly/Redis), checked-in but broken (Shrnkly/Docker), or referenced only as optional/documented providers.
- For monorepos, describe both the publishable library and its demo site only when the portfolio intends to represent the full repository; otherwise prefer the package's own manifest.
