# School and survey portfolio evidence

Reviewed through authenticated GitHub API access on 2026-09-30. All three repositories are private.

## School Management Backend

- Repository: https://github.com/montasim/school-management-backend
- Branch: `main`
- Reviewed commit: `e6c594d5762f60504c5e2bab88f0ba8171a3b37e`
- Repository creation: 2023-10-23T11:10:46Z
- Earliest commit returned by paginated history: `46554def6f1ba0bcdf8dafe1be535edeb26e45e2` (2023-10-23T11:10:07Z)
- Article: `/blog/organizing-school-resources-and-document-storage`

## School Management

- Repository: https://github.com/montasim/school-management
- Branch: `master`
- Reviewed commit: `34d267a0c0039720f518811e2ac0c57a7f1d1603`
- Repository creation: 2023-10-23T07:56:28Z
- Earliest commit returned by paginated history: `0954d29c89234f2257fbe2a519acc25b0b40e00d` (2023-10-01T16:29:05Z)
- Article: `/blog/prototyping-a-school-information-architecture`

## Survey Module Backend

- Repository: https://github.com/montasim/survey-module-backend
- Branch: `main`
- Reviewed commit: `2d063a80f68076505d1aabd836b2d8b3a467ec8d`
- Repository creation: 2024-03-05T20:30:00Z
- Earliest commit returned by paginated history: `7405c0b5eb0ae06aefca71d8e35657b95453eda5` (2024-03-05T20:27:32Z)
- Article: `/blog/separating-surveys-from-completed-field-records`

## Inspected implementation evidence

- School backend: `src/app.js`, `src/app/middlewares/databaseMiddleware.js`, and the admission-form service and Joi schema under `src/app/modules/admission/admissionForm/` support the middleware, MongoDB, validation, and Drive-upload descriptions.
- School frontend: `app/notice/page.js`, `app/admin/layout.js`, `contexts/authContext.js`, and the route inventory support local demonstration data, App Router page composition, and in-memory admin state. No frontend-to-backend integration is claimed.
- Survey backend: `src/app.js`, `src/routes/v1/api.routes.js`, survey model and service files, and the survey-template and perform-survey models support the routing, Mongoose CRUD, and field-record descriptions.
- Each repository README was used for declared purpose and limitations, checked against representative implementation files.

No environment values, credentials, personal records, or source archives were copied into the portfolio. No live deployment, adoption, measured impact, or production readiness is claimed. Employment/client classifications were not inferred from repository ownership.

Each project has a dedicated case study, a case-study-derived article, and a custom overview reflecting its prototype status. The existing knowledge compiler adds six exact answers per project, bringing the catalog to 547 answers.

The prompt-size regression ceiling is now 500,000 characters (125,000 estimated tokens) to accommodate these additional records. Runtime provider settings are unchanged; the test is a catalog-size guard, not a guarantee of fit for every provider.

## Client-work classification

The portfolio owner subsequently confirmed the projects covered by this note as client work. Their project records now set `clientWork: true`; this classification comes from the owner, not an inference from repository ownership.
