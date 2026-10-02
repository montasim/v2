---
version: 1
slug: "src-routes-dashboard-conversations-tsx"
primary_target: "src/routes/dashboard.conversations.tsx"
related_targets: ["src/components/dashboard/conversation-insights.tsx"]
---

# Conversation history

## Scope and mode

An Operate-mode extension of the authenticated owner dashboard. It covers the saved-conversation route and the model-usage and filtering components that support it.

## Audience, job, and action

The portfolio owner needs to verify which response model actually served each saved exchange, then search or filter the full conversation collection without losing the route's compact scan rhythm.

## Content and constraints

- Expose served-model distribution inside closed-by-default model insights, falling back to the requested model when served provenance is unavailable.
- Keep non-model responses explicit rather than blending them into model totals.
- Use server-backed facets and results; retain accessible labels, keyboard controls, responsive behavior at 1280px and 390px, and no horizontal overflow.
- Inherit the dashboard's restrained neutral surfaces, `Card` composition, chart token palette, and existing shadcn/Recharts chart primitives.

## Chosen direction and memorable moment

Follow the approved dashboard prototype in `prototypes/dashboard/` and the shared dashboard surface brief. Page title lives in the navbar; totals and insights share a compact disclosure; labeled filters are unboxed; production records lead the viewport. Preserve full analytics and all operational metadata in expanded content. Subscriber confirmation status remains visible in the responsive table.

## Unresolved decisions

None.
