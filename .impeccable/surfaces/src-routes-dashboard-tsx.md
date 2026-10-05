---
version: 1
slug: "src-routes-dashboard-tsx"
primary_target: "src/routes/dashboard.tsx"
related_targets:
  [
    "src/components/dashboard/dashboard-navigation.ts",
    "src/components/dashboard/dashboard-overview.tsx",
    "src/components/dashboard/dashboard-records.tsx",
    "src/components/dashboard/dashboard-page-state.tsx",
    "src/components/dashboard/dashboard-insights.tsx",
    "src/features/work-journal/ui/journal-page.tsx",
    "src/features/work-journal/ui/new-entry-page.tsx",
    "src/routes/dashboard.work-journal.tsx",
    "src/routes/dashboard.work-journal_.new.tsx",
  ]
---

# Dashboard

## Scope and mode

Operate. The portfolio owner reviews activity, maintains public availability, and records private work. The user-approved visual authority is `prototypes/dashboard/`; use its composition and the existing production behavior together.

## Layout

- Desktop: 224px sidebar, 64px shared page header, title/subtitle and route actions in the header, breadcrumb in the body, 24px content gutters (16px mobile).
- Mobile: collapsible navigation with all routes, portfolio access, and sign-out. Page identity and theme control remain visible.
- Compact totals and a closed-by-default Insights disclosure share one bordered row. Keep global analytics available inside the disclosure; results and their tools receive the initial viewport.
- Collection previews use grouped bordered rows, with full content and metadata available on expansion. Fields and disclosures use accessible names, native controls, and visible focus.
- Work Journal opens on History, with underlined manual-activation tabs for History, Reviews, and Companies & projects. A separate New journal action sits to the right and wraps below the tabs on narrow screens. It opens `/dashboard/work-journal/new` inside the dashboard shell, with the full editor and a Back to Work Journal link. Save keeps the editor open; existing entries are reopened through History. Preserve all entry/review/management state and dirty-edit guards. Daily summary stays beside the editor on desktop and stacks on mobile.
- Availability keeps all fields and the real save flow; description uses a multiline input.

## Constraints

Preserve authentication, route paths, server queries and validation, filter/pagination behavior, moderation confirmation, provenance, subscriber delivery states, journal AI/source-snapshot protections, export, and all error recovery. Prototype data and preview controls must not enter production. Dashboard color refinements are scoped; the public portfolio identity is unchanged.

## Verification

At 1280×720 the implemented first inquiry starts at y268, matching the approved prototype. Desktop and 390px mobile layouts, light/dark theme, disclosure rendering, and live search/recovery were inspected. Typecheck, lint and production build passed. Focused dashboard/journal/domain/contact rerun: 86 tests passed. Full suite retains nine baseline failures; an additional contact focus failure passed on rerun.
