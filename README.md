# Montasim Portfolio v2

> A production-oriented software engineering portfolio for recruiters, collaborators, and technical peers.

Montasim Portfolio v2 turns a static multi-page prototype into a server-rendered TanStack Start application. It preserves the prototype's compact editorial interface while adding reusable components, typed file-based routes, validated JSON content, structured server logging, responsive navigation, dark mode, and complete social-sharing metadata.

![Montasim Portfolio v2 desktop preview](public/images/portfolio-preview.png)

## Why this project?

The original prototype proved the content and visual direction, but its repeated HTML, CDN scripts, and page-local styles made ongoing changes expensive. This implementation keeps the approved interface while giving the portfolio one maintainable application shell and a small set of reusable content patterns.

The result is designed for two audiences:

- Visitors can scan experience, projects, skills, education, certifications, and recommendations on any screen size.
- Contributors can update structured JSON catalogs without duplicating page markup; Neon stores only operational application data.

## Current capabilities

- Full-document server rendering through TanStack Start
- Eight typed routes with route-specific titles, descriptions, canonical links, Open Graph tags, and Twitter card metadata
- Responsive desktop navigation and an accessible shadcn `Sheet` menu on small screens
- System-aware light and dark themes with a persistent manual toggle
- Buffered, portfolio-grounded AI assistant with a pinned zero-cost OpenRouter primary, Gemini fallback, and Groq final fallback
- Focused citation-ready TOON evidence, exact-question answers, deterministic claim validation, durable limits, and provider telemetry
- Guided role and project inquiry workflows with Neon as the source of truth plus idempotent Google Sheets and Resend delivery
- Shareable, validated URL filters for project, education, certification, and recommendation catalogs
- Reusable catalog, detail-page, navigation-action, experience, project, skill, and section modules
- Zod validation for every JSON content catalog during application startup
- Structured Pino request logs with authorization and cookie redaction
- Optimized WebP interface assets plus a 1200 by 630 PNG social preview
- Static `robots.txt`, XML sitemap, web app manifest, resume, and credential downloads

## Explore the portfolio

| Route              | Purpose                              |
| ------------------ | ------------------------------------ |
| `/`                | Portfolio overview                   |
| `/experience`      | Complete role and company history    |
| `/projects`        | Filterable project catalog           |
| `/skills`          | Complete skills catalog              |
| `/education`       | Filterable academic history          |
| `/certifications`  | Filterable professional credentials  |
| `/recommendations` | Expandable colleague recommendations |
| `/resume`          | Web resume and PDF download          |

The original approved static pages remain in [`prototypes/`](prototypes/) for visual comparison. They are reference artifacts, not application entry points.

## Local development

### Prerequisites

- Node.js 22.12 or newer
- pnpm 11 or newer

The public content is version-controlled JSON. Neon Postgres is required for comments, view counts, owner-dashboard data, inquiries, chat telemetry, and limits. Dynamic chat also needs at least one generation provider; the complete portfolio knowledge packet is compiled locally from the public catalogs and does not require an embedding service or database index.

### Install and run

From the project directory:

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Copy [`.env.example`](.env.example) to `.env.local` and add the services you want to enable:

```dotenv
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key
OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_FREE_MODEL=minimax/minimax-m3:free
UPTIMEROBOT_READ_ONLY_API_KEY=your_read_only_uptimerobot_key
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
CHAT_RATE_LIMIT_SECRET=generate_a_separate_32_byte_secret
INQUIRY_RATE_LIMIT_SECRET=generate_a_separate_32_byte_secret
RESEND_API_KEY=your_resend_key
FROM_EMAIL="Portfolio <portfolio@your-domain.com>"
EMAIL_TO=your_inbox@example.com
GOOGLE_SERVICE_ACCOUNT_EMAIL=portfolio-writer@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"
GOOGLE_SHEET_ID=your_spreadsheet_id
# Optional; these defaults keep inquiry types in separate tabs
GOOGLE_ROLE_INQUIRIES_RANGE="'Role Inquiries'!A:J"
GOOGLE_PROJECT_INQUIRIES_RANGE="'Project Inquiries'!A:J"
```

OpenRouter is attempted first with one pinned, reviewed `:free` model. The app does not pass an OpenRouter model pool or the random `openrouter/free` router, so the primary model and its answer quality remain stable. The request sends no tools or plugins, sets every OpenRouter price ceiling to zero, and rejects a response unless reported cost is exactly zero. Gemini `gemini-3.5-flash` is the first direct generation fallback; Groq `openai/gpt-oss-120b` is the final generation fallback. Exact catalog matches use no model request. Dynamic questions select at most 12 relevant facts from the compiled portfolio and send that compact TOON packet to each provider. Models return prose claims and fact IDs; the server validates the IDs, numbers, dates, names, evidence roles, and citations before accepting an answer. The live path does not spend another model call on review; independent quality judging remains an offline evaluation gate. Every visitor is limited to 60 total chat requests per 10 minutes; dynamic generations also have 180-per-10-minute and 900-per-day safeguards, while OpenRouter receives a separate shared safety budget of 18 requests per minute and 900 per day. Attempt budgets are 12 seconds for OpenRouter, 22 seconds for Gemini, and 10 seconds for Groq inside a 50-second shared deadline. If all three fail validation or availability checks, the endpoint returns a safe streamed handoff. OpenRouter is the only provider for which the code proves zero spend; Gemini and Groq billing remain governed by their account quotas.

Initialize the operational database before using dynamic features:

```bash
pnpm db:migrate
```

No chat-indexing step is required. A build validates the public catalogs and compiles their complete facts, derived counts and chronology, relationships, evidence IDs, and direct citation URLs into a deterministic TOON packet. Resend requires a verified sender domain. Share the target spreadsheet with the service-account email as an editor. Neon accepts each inquiry first; Sheets and email are secondary delivery channels.

The public `/status` route reads project availability from UptimeRobot's v3 API. Create the project monitors in UptimeRobot, use an account-level read-only API key for `UPTIMEROBOT_READ_ONLY_API_KEY`, and keep the key server-only. Results are cached for five minutes, and the last successful snapshot is retained if the provider has a temporary outage.

After changing public portfolio data, regenerate the versioned exact-answer artifact and review its diff:

```bash
pnpm chat:compile-exact
pnpm chat:verify-exact
pnpm test -- src/features/chat/knowledge
```

The runtime fails closed when the artifact hash does not match the newly compiled knowledge packet. `pnpm build` runs the same non-writing verification and also compares all 450 artifact records with their clean-room source, preventing stale exact questions or prose from being deployed.

### Production build preview

```bash
pnpm build
pnpm preview
```

`pnpm preview` verifies the generated Vite output locally. It is not a production hosting process.

## How it works

```mermaid
flowchart LR
    A[Domain JSON catalogs] --> B[Domain-local Zod validation]
    B --> C[Catalog projections]
    C --> D[Reusable page modules]
    D --> E[TanStack Start SSR]
    E --> H[Accessible responsive pages]
    F[Incoming request] --> G[Pino request logger]
    G --> E
    I[Assistant panel] --> J[Chat API]
    J --> S[Validated catalogs to compiled knowledge]
    S -->|Exact normalized question| T[Exact cited answer]
    S -->|Every other safe question| R[Select up to 12 relevant facts]
    R --> M[Pinned OpenRouter, then Gemini, then Groq]
    M --> L[Deterministic claim and citation checks]
    L --> U[Canonical cited answer]
    I --> N[Inquiry server function]
    N --> O[Neon source of truth]
    O --> P[Resend and Google Sheets delivery]
```

Route files own metadata and domain-specific record rendering. Domain-local catalog modules validate JSON, normalize classifications, and expose featured records and filters. Reusable catalog and detail-page modules own repeated page workflows, while navigation actions centralize internal, external, download, and email behavior. Malformed content fails during development and builds instead of reaching visitors silently.

The assistant validates all public catalogs, normalizes each record, derives counts and chronology, and attaches stable evidence IDs and direct citation URLs. A clean-room catalog of 450 normalized exact questions can answer without a provider; it references the same evidence ledger and is rejected before build or at runtime if its source or knowledge hash is stale. Every other safe question receives a focused evidence packet selected by deterministic intent rules and lexical ranking. Generated claims cite fact IDs and pass server-side factual checks before they are served. Recommendations can support collaboration claims, but not substitute for technical, ranking, count, or career-impact evidence. The live evaluation suite independently judges relevance, usefulness, tone, and evidence quality without adding a reviewer call to visitor requests.

The server entry wraps TanStack Start's default handler to record the request method, path, response status, and elapsed time. It redacts authorization and cookie fields from structured logs.

## Project structure

```text
src/
├── components/
│   ├── layout/       # Application shell, navigation, footer, side rails
│   ├── portfolio/    # Experience, project, and skill patterns
│   ├── shared/       # Catalog pages, detail pages, actions, sections
│   └── ui/           # Owned shadcn components
├── data/             # JSON content catalogs
├── features/chat/    # Assistant domain, ports, adapters, server orchestration, UI
├── lib/
│   └── content/      # Domain-local validation and catalog projections
├── routes/           # TanStack Router file-based routes
├── router.tsx        # Router configuration
├── server.ts         # SSR entry and Pino request logging
└── styles.css        # Tailwind imports and shadcn theme tokens
public/               # Images, PDFs, manifest, robots, and sitemap
prototypes/           # Approved static reference implementation
```

## Technology

| Area             | Technology                                                     |
| ---------------- | -------------------------------------------------------------- |
| Application      | TanStack Start, TanStack Router, React 19, TypeScript          |
| AI               | AI SDK, pinned zero-cost OpenRouter, Gemini and Groq fallbacks |
| Email            | Resend                                                         |
| Operational data | Neon Postgres                                                  |
| Inquiry delivery | Resend, Google Sheets API                                      |
| Build            | Vite 8                                                         |
| Interface        | Tailwind CSS 4, shadcn/ui, Radix UI, Hugeicons                 |
| Validation       | Zod 4                                                          |
| Logging          | Pino 10                                                        |
| Content          | Local JSON files                                               |
| Testing          | Vitest                                                         |
| Quality          | ESLint, Prettier, TypeScript, Lighthouse                       |

## Updating content

Edit the relevant file in [`src/data/`](src/data/):

- `profile.json` for identity, summary, and social links
- `experience.json` for roles and companies
- `projects.json` for the project catalog
- `skills.json` for grouped capabilities
- `education.json`, `certifications.json`, and `recommendations.json` for supporting credentials
- `organizations.json` and `volunteering.json` for community work

Keep public asset paths rooted at `/images` or `/documents`. Run `pnpm test` and `pnpm typecheck` after changes; the Zod schemas reject missing or invalid required values.

## Development commands

| Command                     | Purpose                                               |
| --------------------------- | ----------------------------------------------------- |
| `pnpm dev`                  | Start the development server on port 3000             |
| `pnpm build`                | Verify exact answers and build production bundles     |
| `pnpm preview`              | Preview the production build locally                  |
| `pnpm chat:verify-exact`    | Verify all exact-answer source records and their hash |
| `pnpm chat:evaluate --help` | Inspect the live 300-question evaluation runner       |
| `pnpm test`                 | Run the Vitest suite once                             |
| `pnpm typecheck`            | Check TypeScript without emitting files               |
| `pnpm lint`                 | Run ESLint                                            |
| `pnpm format`               | Format TypeScript and JavaScript files                |
| `pnpm check`                | Check TypeScript and JavaScript formatting            |

The verified release gate is:

```bash
pnpm lint
pnpm test
pnpm typecheck
pnpm build
```

## Verified quality

The release gate validates formatting, ESLint, the complete Vitest suite, TypeScript, exact-answer freshness, and the production build. The chat-specific suite also covers the 468 exact answers, a 300-question paraphrase corpus, claim-to-evidence traceability, provider failover, zero-cost OpenRouter enforcement, and inert Markdown rendering. A local Lighthouse run against the warmed production preview reported:

Run `pnpm chat:evaluate` as a separate provider-backed acceptance gate. It forces all 300 non-exact questions through dynamic generation, uses a third provider as the independent judge, shares the production OpenRouter safety budget, and writes a non-overwriting JSON report under `artifacts/chat-evaluation/`. A smaller cross-category smoke run is available with `pnpm chat:evaluate -- --limit 16`. This network gate requires three configured providers and is intentionally separate from deterministic builds.

| Category       | Score |
| -------------- | ----: |
| Performance    |    91 |
| Accessibility  |   100 |
| Best practices |   100 |
| SEO            |   100 |

The same run measured a cumulative layout shift of `0.002`, total blocking time of `50 ms`, and a warmed server response time of `10 ms`. Lighthouse results vary by machine and throttling profile, so these values are verification evidence rather than a performance guarantee.

## SEO and social sharing

Every route uses TanStack Router document-head management for deduplicated metadata. The application includes:

- Unique route titles and descriptions
- Canonical URLs rooted at `https://montasim.dev`
- Open Graph and Twitter large-card metadata
- A 1200 by 630 PNG preview at `public/images/social-preview-v2.png`
- Crawl directives in `public/robots.txt`
- All public routes in `public/sitemap.xml`
- A web app manifest with an optimized icon

Update the canonical URL in [`src/lib/site.ts`](src/lib/site.ts), `public/robots.txt`, and `public/sitemap.xml` before deploying to a different domain.

## Deployment

The repository includes the official Netlify TanStack Start adapter and a
[`netlify.toml`](netlify.toml) configuration. Import the repository into Netlify;
the platform will install dependencies with pnpm, run `pnpm build`, publish the
client assets from `dist/client`, and deploy SSR through the generated Netlify
Function.

The deployment configuration pins the project's supported Node.js and pnpm
versions. Verify server-side rendering, static assets, canonical URLs, and the
social preview after the first deployment.

Configure the server-only variables from [`.env.example`](.env.example) in Netlify; never use a public Vite prefix for credentials. Apply migrations to the production `DATABASE_URL` before routing traffic to a release that requires the new operational schema. The two inquiry-range variables and `OPENROUTER_FREE_MODEL` are optional.

The application no longer reads the legacy portfolio evidence tables. Forward migration `0008_solid_raider` removes both evidence tables and the database vector extension. On an existing deployment, deploy and verify the focused-evidence runtime before applying that cleanup migration; a fresh environment can apply the complete migration chain before receiving traffic.

Do not present `pnpm preview` as the production server.

## Status and limitations

- This is a portfolio application backed by version-controlled JSON, not a content management system.
- Content changes require a rebuild and redeployment.
- AI answers are limited to text-only portfolio questions, 500 characters per question, 12 retained messages, and the complete structured evidence compiled from the version-controlled catalogs.
- Structured inquiry details are stored authoritatively in Neon, then delivered independently through Google Sheets and Resend. They are never inserted into AI prompts or conversation history.
- Catalog filters are validated during routing and render correctly during SSR.
- External project, credential, institution, and social links can change independently of this repository.
- The canonical production domain is configured but the v2 deployment has not been verified from this repository.
- The landing route remains the largest client bundle because it presents every overview catalog; route-level code splitting keeps detail pages isolated.

## Support and security

For portfolio questions, use the email action in the application. Reproducible implementation problems should be reported through the repository's issue tracker after the project is published.

The owner dashboard uses Neon Auth and restricts access to `OWNER_EMAIL`. Neon stores operational records; public portfolio content remains in validated JSON catalogs. Chat and inquiry inputs are bounded and validated server-side, cross-site mutations are rejected, visitor identifiers are HMAC-hashed, and provider errors are sanitized. Do not add secrets to JSON catalogs, browser code, or files under `public/`; everything there is shipped to visitors. Report security concerns privately to the maintainer rather than disclosing sensitive details publicly.

## Contributing

Focused fixes and content corrections are welcome. Keep changes modular, preserve the approved prototype's information architecture and visual language, and run the complete release gate before submitting work.

The repository does not currently include separate contribution or code-of-conduct documents.

## Funding

Optional support is available through [SupportKori](https://www.supportkori.com/montasim). Code reviews, bug reports, and useful feedback are equally valuable.

## Author

Built and maintained by [Montasim](https://github.com/montasim).

## License

This project does not currently include an open-source license. Source availability does not grant permission to copy, modify, or redistribute it.
