---
version: 1
slug: "src-routes-resume-tsx"
primary_target: "src/routes/resume.tsx"
related_targets: ["src/features/resume/resume-preview.tsx", "src/features/resume/download.server.ts"]
---

# Resume

## Scope and mode

Read-mode public `/resume` surface for reviewing Montasim’s existing Google Drive resume and downloading the original PDF. Inherit `DetailPage`, portfolio typography, spacing, navigation, and theme tokens; no global design changes.

## Direction contract

- Keep the introduction and prominent “Download resume (PDF)” action above the preview. Match the project-detail introduction: breadcrumb, 32px separation before the title, larger heading and description, and a compact 36px-high action aligned to the description’s bottom-right on desktop; stack it below on smaller screens. Include exactly: “If the preview doesn’t load, use the download button to read the PDF.”
- Render PDF pages as transparent, full-width canvases within a left-aligned, constrained column. Remove viewer chrome and surrounding background; invert and hue-rotate canvases in dark mode to blend with the page theme.
- Reserve an A4-shaped preview area while loading, with a gently pulsing resume skeleton, reduced-motion support, and a live status message explaining that download remains available. Announce preview errors. Error copy directs readers to download or refresh.
- Serve the original Drive PDF through the local download endpoint using the filename supplied by Google Drive, with attachment disposition and no browser redirect. Reject upstream failures or non-PDF responses with a plain-text 502 retry message.

## Review disposition and limits

Ship. Fit-width rendering leaves small text on mobile. Canvas text is not selectable and PDF links are not interactive; extracted screen-reader-only text and the original download remain available.
