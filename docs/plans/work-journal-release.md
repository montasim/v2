# Private Work Journal

The owner dashboard now includes `/dashboard/work-journal`. It supports daily
capture, contribution history, companies and projects, editable daily summaries,
period review snapshots, selective report exports, and a private JSON backup.

## Daily workflow

1. Choose a prefilled company from the portfolio experience catalog. The current
   company is selected by default. The project picker includes every existing
   portfolio project; choosing one adds it to that company’s private journal.
   Use **Companies & projects** to add more companies or projects.
2. Work Journal opens on **History**. Choose **New journal** to open
   `/dashboard/work-journal/new`, record rough notes, and add tasks. The work date
   defaults to today in your configured timezone and remains editable.
   **Add note lines as tasks** copies bullet lines while preserving the original notes.
3. Save before generating a daily draft. Review the generated text, choose
   **Use draft in editor**, and save to accept it. Saving keeps the editor open;
   subsequent saves update the same entry. Manual summaries work without AI.
   **Back to Work Journal** returns to History. Unsaved edits are guarded when
   leaving the page or closing/reloading the browser. A fresh visit to **New journal**
   starts a new form; reopen saved work from History.
4. Reopen entries from **History** to add evidence, update status, or attach later
   outcomes. Use a consistent related work ID to connect work across days.
5. In **Reviews**, choose a period, company, audience, and individual contributions.
   Private reflections and evidence URLs are excluded by default.
6. Write from the source snapshot or generate a draft. Larger reviews process
   bounded source groups and consolidate their drafts through **Continue generation**.
   Each successful step is persisted and can be resumed after closing the page.
7. Save and preview the report before copying, downloading Markdown, or using
   the browser's Print / Save as PDF. The evidence appendix is optional and off
   by default. Redact confidential text in the report editor before sharing.

Archiving companies or projects preserves historical entries and review snapshots.
Portfolio companies are initialized with stable IDs and never overwrite journal
edits or archive decisions. All portfolio projects are offered as choices, but
company ownership is assigned only when the owner selects a project. Repeated
selections reuse the existing company project. Journal edits do not change the
public portfolio catalogs.

Work dates are calendar dates in the configured timezone (Asia/Dhaka by default).
The week boundary is configurable. Reviews retain the date range, selected source
records, and their original hashes; later edits flag the snapshot as outdated.
A later outcome may be included in a new review of earlier work, with its own date.

## Storage and authorization

Migration `0013_work_journal.sql` adds six private tables: companies, projects,
entries, reviews, preferences, and generation usage. Contribution arrays, evidence,
and dated outcome updates are stored as bounded JSON inside each entry. They are
edited atomically with the entry's optimistic revision rather than through a
second set of task CRUD endpoints. This is intentionally a single-owner feature.

Every server function independently calls `requirePortfolioOwner`. Journal data
is not added to public portfolio catalogs, chatbot retrieval, or static artifacts.
The dashboard loads this feature separately; an unavailable journal does not
prevent using the other dashboard sections.

Client-generated UUIDs make entry creation retryable without duplicate inserts.
Revision checks reject competing edits, including writes made while AI generation
is running. Original notes, accepted text, and generated drafts remain separate.
Snapshots do not automatically absorb edited or newly added entries. Create a new
review to include them. Raw original notes are used for daily summaries; period
reviews use the explicitly selected structured contributions and outcomes.

## AI configuration

Configure these server-only variables in each deployment environment:

- `JOURNAL_AI_PROVIDER`: `google` or `groq`.
- `JOURNAL_AI_MODEL`: an available model for that provider/account.
- `JOURNAL_AI_API_KEY`: the chosen account's key.

For this implementation, the owner selected Google. Local configuration uses the
existing Google account with `gemini-3.5-flash`; no key is committed. Deployment
secrets must be configured separately before AI is available there.

The journal does not reuse the public chatbot's provider routing or silently fall
back to another provider. Generating sends saved source text to the selected
provider. Daily generation excludes private reflections; report generation uses
only the selected, saved snapshot. Evidence links are never fetched automatically.
Provider failures are sanitized, and prompts/response bodies are not logged.

Each provider call has a 25-second timeout and no automatic retries. An atomic
PostgreSQL quota permits one request per five seconds and 100 requests per UTC
day across server instances. Failed calls consume a request. Usage stores model,
state, token counts when available, and target ID, without prompt/response bodies.
Reports batch input and consolidate bounded groups over separate calls. There is
no scheduler or long-running background worker.

All generated points must cite selected contribution IDs; unknown references are
rejected. These checks establish source membership, not factual entailment. The
owner must review claims before accepting or sharing them. No performance score,
automatic business-impact metric, or guarantee of factual perfection is provided.
Oversized contributions remain usable for manual reports even if AI cannot process
them. Reviews allow up to 1,000 entries and a 2 MB source snapshot; narrow the range
or project if a selection exceeds those limits.

## Rollout and verification

1. Apply `pnpm db:migrate` against the intended database before deploying readers.
2. Configure the three journal AI variables in the deployment, if desired.
3. Run type checking, lint, focused tests, exact-answer verification, and production
   build. Focused tests: `pnpm exec vitest run src/features/work-journal`.
4. Sign in as the owner, add a company and project, save an entry, generate and
   accept a summary, then create, edit, and export a review.

The migration was applied to the database configured locally. Setup, history,
review-list and private-export queries passed against that database without
inserting synthetic company/work records. Google structured output and source
references were verified with synthetic notes. No deployment has been performed.

The journal's 27 tests cover calendar boundaries, evidence URLs, source references,
request bounds, authorization and error sanitization, real PostgreSQL semantics
through disposable PGlite databases, duplicate saves, conflicting edits, project
ownership, snapshots, privacy defaults, AI failure recovery, note preservation, and tab navigation with unsaved edits.
The PGlite dependency is development-only; the application continues using Neon.

The full repository run produced 575 passing tests and nine failures in seven
unrelated files. The same nine failures were reproduced from unchanged HEAD:
contact assistant visibility/keyboard behavior and outdated project, skill-order,
and exact-answer catalog expectations. They were not changed for this feature.

Browser interaction checks used an isolated synthetic-data preview of the actual
journal components. The live dashboard correctly redirected the signed-out browser
to `/root`; authenticated browser end-to-end verification remains an owner check.

The New journal navigation update passed 38 focused journal/navigation tests,
type checking, lint, formatting, and the production build. Tests cover fresh
entry creation, repeat saves, failed-save recovery, returning to refreshed
History, tab navigation, route blocking, and browser unload protection. The
authenticated local dashboard was checked at desktop and 390px mobile widths
in light and dark themes, including direct entry-page loading and browser Back
cancel/discard behavior. Save flows used mocked server functions in tests;
browser checks did not create journal records or invoke AI generation.

Future work: reminders, issue-tracker imports, attachments, and approved public
portfolio excerpts. These are not included in the first release.
