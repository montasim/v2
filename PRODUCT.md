# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Portfolio visitors: hiring managers, software developers, collaborators, and prospective clients evaluating Montasim's experience and work.
- Portfolio owner: Montasim, reviewing public content, assistant behavior, inquiries, and other operational data through an authenticated dashboard.

## Product Purpose

Present Montasim's software-engineering experience through verifiable work, measured outcomes, project evidence, and professional context. Success means visitors can evaluate fit confidently and the owner can inspect the content and activity that shape that evaluation.

## Positioning

The portfolio connects concise public claims to structured projects, case studies, source evidence, and an evidence-grounded assistant instead of relying on an unverified résumé narrative alone.

## Operating Context

Public content is maintained in version-controlled files and deployed with the application. The owner dashboard is an authenticated control room used to review inquiries, chat history, comments, subscribers, availability, and the compiled static question-and-answer catalog.

## Capabilities and Constraints

- The application is a server-rendered TanStack Start web application.
- The assistant includes 450 exact-match static questions and evidence-backed answers compiled into a versioned artifact.
- Static questions and answers are reviewed from the dashboard but remain read-only there; content changes continue to happen in source files and require catalog regeneration and deployment.
- The owner dashboard must remain authenticated, responsive, accessible, and consistent with its existing navigation and visual system.

## Evidence on Hand

- Structured portfolio catalogs under `src/data/`.
- Project case studies, technical articles, professional experience, credentials, recommendations, and contribution records.
- Exact-answer source and compiled artifact under `src/features/chat/knowledge/`.
- Existing authenticated dashboard routes under `src/routes/dashboard*`.

## Product Principles

- Prefer verifiable evidence over unsupported claims.
- Make hiring and project-fit information quick to evaluate.
- Keep public content maintainable through version-controlled sources.
- Make operational and assistant behavior inspectable by the owner.
- State uncertainty and capability limits honestly.

## Accessibility & Inclusion

The public portfolio and owner dashboard support keyboard navigation, responsive layouts, readable light and dark themes, and semantic controls with visible focus states.
