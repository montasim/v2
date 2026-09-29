# MCQ Topper Backend portfolio evidence

Reviewed on 2026-09-30 through authenticated GitHub API access.

- Repository: https://github.com/montasim/mcq-topper-backend (private)
- Branch: `main`
- Reviewed commit: `26e8d7b6c1483d9067d4992dca3b502687a7216c`
- Repository created: 2024-01-28T06:08:31Z
- Earliest commit returned by the paginated history: `977f5de42ec89ba65a4f292441ef283cc237259a`, authored 2024-03-03T14:51:20Z

## Evidence used

| Source at reviewed commit | Supported portfolio content |
| --- | --- |
| `src/app.js` | Express middleware, payload limits, timeouts, rate limiting, and email error notification path |
| `src/routes/v1/app.routes.js` | Configurable `/api/{API_VERSION}` prefix |
| `src/routes/v1/api.routes.js` | Domain routing for questions, exams, courses, enrolment, results, and supporting content |
| `src/modules/question/question.controller.js` | Fixed placeholder response; does not demonstrate persisted question creation |
| `src/server.js` | HTTP lifecycle; database shutdown wiring is commented out |
| `package.json` | JavaScript ES modules, Node.js, Express, Nodemailer, and PM2 tooling |
| `Dockerfile`, Compose variants, `ecosystem.config.json`, `vercel.json` | Deployment configuration exists; deployment success was not verified |
| `README.md` | Explicit scaffold status and incomplete domain logic, consistent with inspected source |

No credentials, environment values, or private source files were copied into the portfolio.
The public-facing text summarizes architecture and implementation boundaries.
No live URL, product adoption, performance result, complete authentication flow,
or working database persistence is claimed. No employment/client classification
is inferred from repository ownership.

## Portfolio integration

- Project and case-study slug: `mcq-topper-backend`
- Blog slug: `structuring-an-mcq-learning-api`
- Blog content derives from the case study using the existing catalog convention.
- Chat knowledge automatically consumes all three catalogs. Regeneration adds
  two project answers, three case-study answers, and one blog answer.
- A custom project overview avoids the default overview's completed-product wording.
- The prompt-size regression ceiling increases from 460,000 to 470,000 characters
  to accommodate the added source evidence; no runtime model limits were changed.

## Client-work classification

The portfolio owner subsequently confirmed the projects covered by this note as client work. Their project records now set `clientWork: true`; this classification comes from the owner, not an inference from repository ownership.
