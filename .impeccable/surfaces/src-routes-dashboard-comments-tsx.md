---
version: 1
slug: "src-routes-dashboard-comments-tsx"
primary_target: "src/routes/dashboard.comments.tsx"
related_targets: ["src/components/dashboard/email-domain-insights.tsx"]
---

# Blog comments

## Scope and mode

An Operate-mode extension of the authenticated owner dashboard. It covers the blog-comment route and its shared email-domain insight, search, filter, result-state, and pagination behavior.

## Audience, job, and action

The portfolio owner needs to understand who comments by email domain, then find a specific comment or article context without losing the route's compact scan rhythm or current place.

## Content and constraints

- Inherit the dashboard's restrained neutral surfaces and existing spacing, typography, `Card` composition, and chart-token palette.
- Lead with compact totals and closed-by-default email-domain insights, followed by the server-backed search and domain filters. The distribution remains global while results are filtered, and shows the five largest domains plus an aggregated Other slice.
- Build the donut with the shared shadcn `ChartContainer` and `ChartTooltip` primitives over Recharts, and reuse `src/components/dashboard/email-domain-insights.tsx` rather than creating route-specific chart or filter variants.
- Search author name, email address, comment message, article title, category, and slug. Keep query, domain, and page in validated URL state; filter changes reset to page 1, while pagination preserves the active query and domain.
- A filtered zero-result state must explain recovery and offer one action that clears both search and domain filters; the true no-data state remains distinct.
- Stack chart and legend, then search and domain controls, at narrow widths; widen into the established dashboard grids without horizontal overflow.
- Preserve explicit control labels, a semantic chart label and named legend, keyboard operation, and a polite live announcement of matching-result counts.

## Chosen direction and memorable moment

Follow the approved dashboard prototype in `prototypes/dashboard/` and the shared dashboard surface brief. Page title lives in the navbar; totals and insights share a compact disclosure; labeled filters are unboxed; production records lead the viewport. Preserve full analytics and all operational metadata in expanded content. Subscriber confirmation status remains visible in the responsive table.

## Unresolved decisions

None.
