# Contact page release checklist

The implementation is local. No production migration, live test inquiry, email, Sheets append, deployment, or store-listing change has been performed.

## Database and rollout

1. Back up and apply the checked-in Drizzle migrations through `pnpm db:migrate` against the intended deployment database. The new migration is `drizzle/0012_contact_inquiries.sql`; it adds contact context and permits unnamed contact senders without changing existing records.
2. Deploy the application and inquiry recovery workers together. All readers must understand the new `contact` variant before accepting contact submissions.
3. Verify a controlled inquiry in the deployed environment with an explicitly authorized test recipient. Confirm durable acceptance, owner notification, acknowledgement, dashboard context, and Sheets delivery/recovery.
4. If rollback is needed after contact records exist, disable public contact intake while retaining compatible readers and recovery workers. Do not revert to a release that cannot decode those rows.

The migration's journal index is 12, matching its filename and snapshot. Earlier history has a numbering gap; do not renumber historical entries. This prevents future generation from overwriting a prior snapshot.

## Delivery configuration

Reuse the existing DATABASE_URL, Resend owner/from settings, Google service account, and inquiry recovery configuration. Never expose those values in client code.

Contact messages use the general inquiry Sheets range, falling back to the project range under the existing configuration. Configure that destination to include columns A:R. Preserve existing columns A:J, especially inquiry ID in B:

| Column | Value                     |
| ------ | ------------------------- |
| A      | Timestamp                 |
| B      | Inquiry ID                |
| C      | Type                      |
| D      | Name (may be empty)       |
| E      | Reply email               |
| F      | Role                      |
| G      | Arrangement               |
| H      | Project type              |
| I      | Timeline                  |
| J      | Message/context           |
| K      | Contact topic             |
| L      | Project ID                |
| M      | Project title             |
| N      | Related page path         |
| O      | Related page title        |
| P      | Unlisted app/project name |
| Q      | Platform                  |
| R      | App version               |

Contact delivery uses the existing retry and duplicate-detection protocol. Google Sheets and email failures do not erase accepted database records. A saved-message confirmation does not assert that an acknowledgement email has arrived.

## Public links

- General: `https://montasim.dev/contact`
- App support: `https://montasim.dev/contact?app=bugreceipt&topic=support`
- Content question: `https://montasim.dev/contact?topic=question&from=%2Fexperience`

Project slugs are the existing project IDs without the `project-` prefix. Add future projects to the existing catalog. Treat publicly shared slugs as permanent; if renaming becomes necessary, add an alias before changing store links. Unknown app links remain usable through manual selection and “Other / not listed.”

The form is server-rendered with a visible email fallback; JavaScript is required for form submission. General and hiring contact views offer the existing floating assistant. Product-support views hide it. The direct form remains independent; its actions and the global assistant keyboard/menu commands do not trigger chat on this route.

## Store preparation

Before updating a listing, review the linked [official-source research](../research/contact-page-store-requirements.md). Set the applicable support URL and support email fields. Confirm privacy-policy and account-deletion destinations independently for each app; this page does not substitute for those flows. No response-time guarantee is published.

## Local verification

The contact migration was applied to a disposable PostgreSQL 18.4 database using the existing inquiry table migrations, then synthetic named legacy and unnamed contact rows were inserted and checked. Replaying the entire historical migration chain on stock PostgreSQL was not possible because an old, subsequently removed migration uses the `vector` extension; the contact migration itself does not require it.

Unit/integration tests use mocked delivery and storage boundaries. They do not establish that production credentials or third-party services are configured correctly.

Verified locally: 516 repository tests pass; the final email/context changes also pass a focused 24-test run. Type checking, ESLint, Prettier, production build, exact-answer verification, and `drizzle-kit check` pass. Browser checks confirmed app preselection, validation focus, canonical metadata, mobile layout, both themes, and no assistant command on `/contact`. Raw server-rendered HTML includes the email fallback on general, app-specific, and invalid-app URLs with the floating assistant available separately.

## Context-aware contact presentation

- Share `/contact` for general contact, or `/contact?topic=collaboration` for hiring.
- Share `/contact?app=mulalens&topic=support` for MulaLens support. App-only links default to support.
- Product identity, description, and destination come from the existing project catalog. No separate app registry is needed.
- General and hiring show the personal biography, experience, and project links. Support shows product details and a Change app control; unknown apps retain manual selection.
- Feedback and questions can optionally include a project. General/hiring submissions discard project/platform/version fields.
- Purpose changes preserve message, name, and email. App/topic selections update the URL and sharing metadata using replacement navigation without scrolling or resetting message/contact fields. General/hiring and removing project context clear the app parameter; removing the related-page context clears from. Other / not listed uses app=other without exposing the typed product name in the URL.
- The project catalog contains product screenshots rather than a dedicated icon field, so product identity is rendered as text instead of treating screenshots as icons.
