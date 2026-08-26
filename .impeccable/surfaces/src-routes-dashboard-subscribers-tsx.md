---
version: 1
slug: "src-routes-dashboard-subscribers-tsx"
primary_target: "src/routes/dashboard.subscribers.tsx"
related_targets: ["src/components/dashboard/email-domain-insights.tsx", "src/components/dashboard/subscribers.tsx"]
---

# Newsletter subscribers

## Scope and mode

An Operate-mode extension of the authenticated owner dashboard. It covers the newsletter-subscriber route, subscriber rows, and the shared email-domain insight, search, filter, result-state, and pagination behavior.

## Audience, job, and action

The portfolio owner needs to understand the subscriber base by email domain, then locate a subscriber or diagnose a confirmation-delivery state without losing the route's compact scan rhythm or current place.

## Content and constraints

- Inherit the dashboard's restrained neutral surfaces and existing spacing, typography, `Card` composition, badges, and chart-token palette.
- Lead with the global email-domain distribution before the server-backed search and domain filters. The distribution remains global while results are filtered, and shows the five largest domains plus an aggregated Other slice.
- Build the donut with the shared shadcn `ChartContainer` and `ChartTooltip` primitives over Recharts, and reuse `src/components/dashboard/email-domain-insights.tsx` rather than creating route-specific chart or filter variants.
- Search subscriber email, the displayed delivery-state labels (`Email sent`, `Email failed`, `Sending`, and `Pending`), and stored confirmation-error text. Keep query, domain, and page in validated URL state; filter changes reset to page 1, while pagination preserves the active query and domain.
- A filtered zero-result state must explain recovery and offer one action that clears both search and domain filters; the true no-data state remains distinct.
- Stack chart and legend, then search and domain controls, at narrow widths; subscriber rows also collapse cleanly before widening into the established dashboard grids, without horizontal overflow.
- Preserve explicit control labels, a semantic chart label and named legend, keyboard operation, and a polite live announcement of matching-result counts.

## Chosen direction and memorable moment

After the page header, a compact domain donut and count-and-percentage legend make the whole subscriber base legible at a glance. Search and domain controls then narrow the server-backed subscriber rows while their delivery badges preserve operational status context.

## Unresolved decisions

None.
