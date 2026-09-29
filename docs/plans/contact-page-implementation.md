# Central contact page implementation plan

Status: implemented locally. Production migration, deployment, and live delivery verification remain release steps; see [the release checklist](contact-page-release.md).

## Outcome

Publish `/contact` as the permanent public destination for contacting Montasim about apps, projects, writing, professional experience, suggestions, hiring, collaboration, and general questions. Visitors can send a message directly without signing in or speaking to the assistant. Replies continue by email through the existing inquiry system.

The page must work independently when opened from an app store. An app-specific link preselects context, but the plain `/contact` URL remains fully useful.

Explicit user requirement: no button or other action on `/contact` may trigger the existing chat functionality. This includes shared navigation controls, command menus, keyboard shortcuts, submission, confirmation, and error recovery. Reusing server-side inquiry storage and email delivery does not permit opening the assistant or invoking chat generation.

## Existing foundation

- TanStack Start file routes, shared page shell, existing controls, and light/dark themes.
- `src/features/chat/domain/inquiry.ts`: `hire`, `project`, and `general` submissions. The current project flow describes commissioned work, not support for an existing app.
- `src/features/chat/application/submit-inquiry.ts` and `portfolio-inquiry.server.ts`: validated submissions, database acceptance, abuse controls, and recoverable secondary delivery.
- `src/features/chat/infrastructure/inquiry/`: database, owner email, acknowledgement email, and Google Sheets adapters.
- `src/routes/dashboard.inquiries.tsx`: authenticated inquiry search, filters, and statistics.
- `src/lib/content/projects.ts` and other content catalogs: authoritative titles, identifiers, and routes.
- `docs/research/contact-page-store-requirements.md`: sourced store guidance and distinctions between support, privacy policies, and account deletion.

## Product decisions for the first release

| Area             | Planned behavior                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------------ |
| Topics           | App/project support; suggestion/feedback; question about my work; hiring/collaboration; general conversation |
| Required fields  | Reply email, message, topic (defaults to general)                                                            |
| Optional fields  | Name; related project/content; platform and app version for support                                          |
| Support context  | Require a known project or an “Other / not listed” choice with a short app/project name                      |
| Message length   | 10–5,000 characters for the new contact form; retain existing assistant limits                               |
| Submission       | One form, no account, no AI dependency; reply by email                                                       |
| Alternative      | Visible, selectable email address and email link sourced from the profile catalog                            |
| Assistant        | Absent from `/contact`; no contact-page action opens, invokes, or dispatches events to existing chat         |
| Response wording | Explain that Montasim reviews messages and replies by email; do not invent a response-time guarantee         |
| Scope            | No attachments, live chat, ticket portal, scheduling system, or automatic newsletter signup                  |

The contact page is not a replacement for app-specific privacy policies or deletion processes. Include applicable resource links only when accurate destinations exist; do not publish placeholder policies or imply the contact form satisfies all store requirements.

## 1. Define contact context and URL behavior

Add a small `src/features/contact/domain/` module for topic values, contact validation, and context resolution. Use existing content catalogs rather than maintaining a second project list.

- Support `/contact?app=<project-slug>&topic=support` for app/project support.
- Support `/contact?topic=question&from=/blog/<slug>` for portfolio context. `from` also accepts recognized project, case-study, experience, and other public portfolio paths.
- Resolve app slugs to stable project IDs. Resolve `from` to known internal pages; reject external URLs and strip query strings/fragments.
- Show the selected app or related page visibly and allow users to change or clear it. App selection describes what the message concerns; `from` describes the related page, and neither proves visitor provenance.
- Invalid topic values fall back to general. Unknown app slugs show a recoverable selection prompt instead of a broken page or an invented app title.
- Use one URL-building helper for portfolio contact links. Never put names, emails, or messages into URLs.
- Validate the context again on the server. Store IDs plus server-derived title/path snapshots so historical messages remain readable after a project title changes.
- Future projects become selectable from the existing catalog. Document that published support slugs must remain stable, with aliases if renamed.

Deliverable: a tested URL/context contract used by the page, server submission, and portfolio links.

## 2. Extend the shared inquiry contract and persistence

Add a `contact` variant to the shared submission union, containing topic, optional name, reply email, message (using the existing `context` field), optional related project/page, and optional support details. Keep the existing three variants and their required fields intact.

Separate the assistant's three flow types from the broader submission union: adding `contact` must not require an assistant step sequence or inadvertently expose an unsupported assistant action.

Extend `portfolio_inquiries` with nullable contact fields for topic, project ID/title, related path/title, platform, app version, and an unlisted project name. Relax the name column to nullable for new contact messages; legacy submission validation still requires a name. Render unnamed senders intentionally in the dashboard and email templates.

Update all persistence paths together:

- Insert and reconstruct the new variant, including pending-delivery recovery.
- Include all new fields in duplicate-submission equality checks.
- Preserve legacy rows and pending legacy deliveries without rewriting their meaning.
- Keep existing delivery state and idempotency keys.
- Generate a Drizzle migration and verify it against a disposable/local database. Do not run a production migration during implementation.

Keep the existing inquiry service as the shared owner. A wholesale relocation of chat/inquiry modules is unnecessary for this release.

Deliverable: both old and new submissions persist and recover correctly through one inquiry pipeline.

## 3. Extend submission and delivery

Use the existing server function/service with the new validated variant. Resolve contact context before authoritative acceptance and preserve existing request-origin checks, honeypot handling, rate limits, email policy, moderation, deadlines, and sanitized errors.

The existing request limit is 4,096 bytes, which cannot hold a 5,000-character message. Raise the contact request allowance to 32 KiB, with bounded individual fields; retain the legacy request allowance for legacy variants. Test multibyte input. Ensure optional support fields are cleared when a visitor changes to an unrelated topic.

- Adapt moderation to optional names and new free-text fields, and cover ordinary technical support text in regression tests.
- Include topic, app/page context, support details, and message in the owner email. Preserve the sender's reply-to address.
- Use a neutral greeting when no name is provided. Acknowledgements describe the actual submitted topic and do not promise live support.
- Extend Google Sheets rows without moving the existing inquiry-ID column used for duplicate detection. Update configured range/header guidance and retain formula-injection protection for every new text cell.
- Report success after durable acceptance, even when secondary delivery must retry. Do not claim an acknowledgement email has arrived merely because the message was saved.
- Retain form values on errors. Reuse the submission ID when retrying an unchanged payload; create a new ID if the visitor edits the payload after an ambiguous failure. Prevent repeated clicks while submitting.

Deliverable: contact requests reach the existing inbox and delivery adapters with their context intact, including retry cases.

## 4. Build the public page

Add `src/routes/contact.tsx` with validated search parameters and standard page metadata, plus focused UI components under `src/features/contact/ui/`.

Page order:

1. “Contact” heading and brief explanation covering questions, app support, ideas, and collaboration.
2. Visible app/page context when provided by a link.
3. Topic selector and short form, with conditional project/platform/version fields for support.
4. Clear send action, pending state, field errors, and success confirmation explaining email follow-up.
5. Visible email alternative, a short data-use explanation, and applicable resource links.
6. Small optional navigation links to learn about Montasim; no assistant link or chat action.

The shared `ApplicationFrame` in `src/routes/__root.tsx` currently mounts `PortfolioAssistant` on public pages. Exclude it on `/contact`, including prefilled query variants and normalized trailing-slash URLs. Unmount an already-open assistant when navigating into this page. Hide assistant entries in shared command/context menus and suppress assistant keyboard/command handlers for this route, while preserving ordinary navigation and theme controls. Do not merely hide the launcher with CSS. Contact components must not call `requestPortfolioInquiry`, dispatch `portfolio:assistant-inquiry`, or call the chat endpoint. The existing server-side inquiry submission service remains the only shared contact delivery path.

Reuse the existing page shell, spacing, typography, form controls, and theme tokens. Use one clear form column on mobile; a modest secondary information column is acceptable on wider screens. Avoid a large hero that pushes the form below the fold.

Accessibility and resilience requirements:

- Visible labels, explicit optional fields, semantic controls, visible focus, and associated error messages.
- Focus the first invalid field; announce submission errors and success without relying on color.
- Keyboard-operable project selection, usable touch targets, and no horizontal scrolling at narrow widths.
- Server-render the introduction and email alternative so a script failure does not remove every contact route.
- Keep message drafts in component memory for the current visit; do not persist personal content to browser storage by default.

Deliverable: usable page in mobile/desktop and light/dark themes, including pending, error, and success states.

## 5. Connect portfolio navigation and the owner inbox

Add a persistent Contact link to desktop/mobile navigation and the footer. Keep the homepage contact section as an introduction linking to `/contact`.

Review contact entry points in `src/routes/index.tsx`, `src/components/shared/detail-page.tsx`, project detail/case-study components, the availability card, and blog detail components. Route direct-contact actions to the page with the appropriate topic and source context. Distinguish “Get help with this app” from “Discuss a new project”. Explicitly assistant-labelled actions remain available on other portfolio pages only.

In the dashboard:

- Display contact topic, related app/page, message, and optional support details.
- Add the new contact type and a contact-topic filter; preserve existing hire/project/general filters and historical counts.
- Include app titles, unlisted project names, and related page titles in inquiry search.
- Keep recruitment statistics scoped to their existing hire records rather than inferring hiring intent from all collaboration messages.
- Keep existing authenticated access and email reply workflow.

Add `/contact` to `public/sitemap.xml`. Use `/contact` as the canonical URL for every prefilled variant and generic contact metadata so URL parameters do not create duplicate indexed pages.

Deliverable: visitors can reach the page from relevant portfolio content, and the owner can distinguish and retrieve the resulting messages.

## 6. Verification and release preparation

Automated coverage should establish behavior, not mirror component structure:

- Query normalization, unknown/deleted project handling, internal-page validation, and editable preselection.
- New contact schema, optional name, conditional support fields, length limits, and multibyte request sizes.
- Legacy assistant submission compatibility and legacy stored-row decoding.
- Database round-trip, same-ID retries, conflicting payload rejection, and contact recovery after secondary delivery failure.
- Email context, reply-to, unnamed greetings, and stable Sheets ID-column/formula handling.
- Form success, retained input on failure, duplicate-click prevention, and independent operation without the assistant.
- Contact-route integration: assistant is not mounted; form actions, shared controls, menus, and keyboard shortcuts never dispatch assistant events or request chat generation. Cover direct entry, prefilled URLs, and navigation from another page with chat already open. Verify chat still works after leaving for another supported page.
- Dashboard search/filter behavior and metadata/sitemap entries.

Run focused tests while implementing, then the repository checks: `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm check`, and `pnpm build`. The build's existing exact-answer verification remains required. Format-check the new Markdown plan separately because the current check glob does not include nested docs.

Manually inspect the page in a browser at mobile and desktop sizes, in both themes, and with keyboard navigation. Verify the rendered email fallback with JavaScript disabled. Use local/mocked delivery adapters for automated checks; do not send test messages to real recipients or append test rows to live Sheets as part of routine testing.

Prepare a release checklist covering the database migration, application and recovery-worker compatibility, existing delivery configuration, privacy/resource destinations, and per-app support URLs. Deploy the schema before code that uses it, and ensure all workers/readers understand `contact` before enabling submissions. After new records exist, rollback should disable new intake while retaining compatible readers/workers rather than reverting to code that cannot decode them.

Publishing, production migrations, and store-listing updates are separate release actions. Google Play's support email remains a separate listing field; changing a website URL does not replace it. Follow the linked research when preparing each actual store submission.

## Acceptance criteria

- A visitor can open plain `/contact`, send any supported topic, and receive a clear saved-message confirmation without signing in or using AI.
- No action on `/contact` triggers the existing chat. There is no assistant launcher or assistant menu entry on that page, and sending/retrying a message uses only the inquiry delivery flow.
- An app-store link visibly identifies the app and sends that context through storage, dashboard, email, and Sheets.
- Blog/case-study/other portfolio links retain the relevant internal page context.
- Existing assistant inquiry flows and historical records continue to work.
- Failed delivery is recoverable without losing accepted messages or duplicating unchanged retries.
- Invalid links remain usable, email remains visible, and mobile/keyboard users can complete the form.
- Required checks pass and release steps are documented; no deployment is implied by implementation completion.

## Suggested implementation sequence

1. Context contract, submission schema, migration, and persistence compatibility.
2. Delivery/recovery adapters and their regression tests.
3. Contact page and interaction tests.
4. Portfolio links, dashboard topic handling, and discoverability metadata.
5. Full verification, visual review, and release checklist.
