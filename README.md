# Montasim Portfolio v2

> A production-oriented software engineering portfolio for recruiters, collaborators, and technical peers.

Montasim Portfolio v2 turns a static multi-page prototype into a server-rendered TanStack Start application. It preserves the prototype's compact editorial interface while adding reusable components, typed file-based routes, validated JSON content, structured server logging, responsive navigation, dark mode, and complete social-sharing metadata.

![Montasim Portfolio v2 desktop preview](public/images/portfolio-preview.png)

## Why this project?

The original prototype proved the content and visual direction, but its repeated HTML, CDN scripts, and page-local styles made ongoing changes expensive. This implementation keeps the approved interface while giving the portfolio one maintainable application shell and a small set of reusable content patterns.

The result is designed for two audiences:

- Visitors can scan experience, projects, skills, education, certifications, and recommendations on any screen size.
- Contributors can update structured JSON catalogs without adding a database or duplicating page markup.

## Current capabilities

- Full-document server rendering through TanStack Start
- Eight typed routes with route-specific titles, descriptions, canonical links, Open Graph tags, and Twitter card metadata
- Responsive desktop navigation and an accessible shadcn `Sheet` menu on small screens
- System-aware light and dark themes with a persistent manual toggle
- Portfolio-grounded streaming AI assistant with Gemini primary and Groq fallback providers
- Guided role and project inquiry workflows with editable answer review, Google Sheets storage, and Resend delivery
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

No conventional database is required. The portfolio pages run without external services. The assistant and inquiry workflow require provider credentials; completed inquiries are appended to Google Sheets and delivered by email.

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

Gemini `gemini-3.5-flash` is the primary assistant model. Groq `openai/gpt-oss-120b` is attempted once only when Gemini fails before visible text. Both are isolated behind the same application port, so changing a provider does not affect the UI or route contract. Resend requires a verified sender domain outside its testing restrictions. Share the target spreadsheet with the service-account email as an editor. New submissions go to `Role Inquiries` or `Project Inquiries`; both tabs use the columns timestamp, inquiry ID, intent, name, email, role, work arrangement, project type, timeline, and additional context. The inquiry ID makes retries safe to process without adding duplicate rows.

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
    J --> K[Provider adapter]
    K --> L[Gemini]
    K --> M[Groq fallback]
    I --> N[Inquiry server function]
    N --> O[Resend adapter]
    N --> P[Google Sheets adapter]
```

Route files own metadata and domain-specific record rendering. Domain-local catalog modules validate JSON, normalize classifications, and expose featured records and filters. Reusable catalog and detail-page modules own repeated page workflows, while navigation actions centralize internal, external, download, and email behavior. Malformed content fails during development and builds instead of reaching visitors silently.

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

| Area         | Technology                                            |
| ------------ | ----------------------------------------------------- |
| Application  | TanStack Start, TanStack Router, React 19, TypeScript |
| AI           | AI SDK, Google Gemini, Groq                           |
| Email        | Resend                                                |
| Inquiry data | Google Sheets API                                     |
| Build        | Vite 8                                                |
| Interface    | Tailwind CSS 4, shadcn/ui, Radix UI, Phosphor Icons   |
| Validation   | Zod 4                                                 |
| Logging      | Pino 10                                               |
| Content      | Local JSON files                                      |
| Testing      | Vitest                                                |
| Quality      | ESLint, Prettier, TypeScript, Lighthouse              |

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

| Command          | Purpose                                     |
| ---------------- | ------------------------------------------- |
| `pnpm dev`       | Start the development server on port 3000   |
| `pnpm build`     | Create client and server production bundles |
| `pnpm preview`   | Preview the production build locally        |
| `pnpm test`      | Run the Vitest suite once                   |
| `pnpm typecheck` | Check TypeScript without emitting files     |
| `pnpm lint`      | Run ESLint                                  |
| `pnpm format`    | Format TypeScript and JavaScript files      |
| `pnpm check`     | Check TypeScript and JavaScript formatting  |

The verified release gate is:

```bash
pnpm lint
pnpm test
pnpm typecheck
pnpm build
```

## Verified quality

The current implementation passes ESLint, two Vitest content and metadata checks, TypeScript, and a production build. A local Lighthouse run against the warmed production preview reported:

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
- A 1200 by 630 PNG preview at `public/images/social-preview.png`
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

Configure all eight required assistant and inquiry environment variables in the Netlify site before deployment. The two inquiry-range variables are optional. Provider and service-account credentials remain server-only and must never use a public Vite prefix.

Do not present `pnpm preview` as the production server.

## Status and limitations

- This is a portfolio application backed by version-controlled JSON, not a content management system.
- Content changes require a rebuild and redeployment.
- AI answers are limited to text-only portfolio questions, 500 characters per question, 12 retained messages, and the evidence available in the version-controlled catalogs.
- Structured inquiry details are stored in Google Sheets and sent through the separate Resend workflow. They are never inserted into AI prompts or conversation history.
- Catalog filters are validated during routing and render correctly during SSR.
- External project, credential, institution, and social links can change independently of this repository.
- The canonical production domain is configured but the v2 deployment has not been verified from this repository.
- The landing route remains the largest client bundle because it presents every overview catalog; route-level code splitting keeps detail pages isolated.

## Support and security

For portfolio questions, use the email action in the application. Reproducible implementation problems should be reported through the repository's issue tracker after the project is published.

This application has no authentication or general-purpose database; Google Sheets stores only submitted inquiry fields. Its chat and inquiry endpoints validate bounded inputs server-side, reject cross-site chat requests, and return sanitized provider errors. Do not add secrets to JSON catalogs, browser code, or files under `public/`; everything there is shipped to visitors. Report security concerns privately to the maintainer rather than disclosing sensitive details publicly.

## Contributing

Focused fixes and content corrections are welcome. Keep changes modular, preserve the approved prototype's information architecture and visual language, and run the complete release gate before submitting work.

The repository does not currently include separate contribution or code-of-conduct documents.

## Funding

Optional support is available through [SupportKori](https://www.supportkori.com/montasim). Code reviews, bug reports, and useful feedback are equally valuable.

## Author

Built and maintained by [Montasim](https://github.com/montasim).

## License

This project does not currently include an open-source license. Source availability does not grant permission to copy, modify, or redistribute it.
