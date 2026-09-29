---
version: 1
slug: "src-routes-contact-tsx"
primary_target: "src/routes/contact.tsx"
related_targets: ["src/features/contact/ui/contact-page.tsx"]
---

# Contact

## Scope and mode

Operate-mode public contact page at `/contact`, built from the approved implementation plan. Inherit the existing portfolio visual identity. The page structure and fields were settled in the plan; no new visual identity or concept selection is required.

## Audience, job, and action

App users, portfolio readers, prospective collaborators, and anyone with feedback need to send a message directly to Montasim and receive an email reply. No account or assistant interaction is part of the task.

## Direction contract

- FORM: use the existing page shell and Geist typography, a compact heading and introduction, then a direct form with a narrow supporting biography or selected-product column on desktop. Stack the form and supporting information on mobile.
- COLOR: inherit the warm neutral light and dark token palettes. Strong foreground marks hierarchy and the send action. Error text uses the existing destructive token.
- TYPE: use the portfolio heading scale, visible field labels, readable message text, and subdued helper text. No new font or branding.
- CONTENT: context-aware personal/product headings and sidebars, five topics, optional name, reply email, message, project context, and support-only details; no-script email fallback and honest saved-message confirmation. No invented response-time promise.
- INTERACTION: keyboard-usable shared themed selects with equal trigger side padding, validation with focus, disabled pending controls, retained input on errors, idempotent unchanged retry, the existing floating assistant for general/hiring, hidden for product support. Form actions never trigger chat; no global chat menu entry or chat shortcut on this route.

## Quality bar

The page should feel like a natural portfolio page that is easy to use for a first-time app user. The form must begin in the first viewport, with clear hierarchy and no decorative hero. Mobile fields must fit without horizontal scrolling. Preserve ordinary navigation and themes.

## Verification

Inspect desktop and mobile in light/dark themes, contextual app links, validation, and command-menu isolation. Automated tests cover the shared contact backend separately from chat UI.
