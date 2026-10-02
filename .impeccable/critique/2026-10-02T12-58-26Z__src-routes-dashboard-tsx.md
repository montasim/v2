---
target: Dashboard density and UI/UX review
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
timestamp: 2026-10-02T12-58-26Z
slug: src-routes-dashboard-tsx
---
Method: dual-agent (A: /root/design_review · B: /root/detector_review).

The dashboard gives summaries more prominence than the work. Preserve the neutral Geist identity, but adopt a compact operational layout: page context, tools, records, with analytics available on demand.

Measured at 1280 × 720:
| Page | Summary height | First record starts |
|---|---:|---:|
| Inquiries | 438px | y873 |
| Chat history | 342px | y681 |
| Static answers | 342px | y754 |

The hiring summary alone takes 61% of the viewport. The first inquiry and first static answer are below the viewport. Each of the first inquiry cards is another 360px tall.

Priority issues:
1. P1 — Analytics precedes the task. Replace large default charts with a 56–72px context strip and an Insights disclosure. Comments and subscribers need no default domain chart. Static-answer search should precede category analysis. Label global versus filtered counts. Suggested command: impeccable distill.
2. P1 — Records are too tall to scan. Use compact sender/topic/date rows with a two-line preview and expand/open action. Show full untruncated content in the detail view. Preserve moderation actions, journal dirty guards and existing data behaviors. Suggested command: impeccable layout.
3. P2 — Duplicate context consumes space. Put one semantic H1 (18–20px) and an optional short subtitle (12–13px) in the existing 64px navbar; put a small breadcrumb in the body. Remove the separate body heading. The existing navbar is desktop-only, so mobile needs an explicit equivalent. Suggested command: impeccable layout.
4. P2 — Filters are separate padded sections. Combine search, type, topic and result count in one toolbar; use advanced filter disclosure on mobile, visible active filters and Clear. Keep labels and usable touch targets. Suggested command: impeccable distill.
5. P2 — Journal views look like actions. Use a connected underline tab rail, strong active label, visible focus and correct accessible selection/keyboard behavior. Preserve the unsaved-changes guard and parent selection for detail views. Suggested command: impeccable polish.

Recommended page treatment:
| Surface | Default content |
|---|---|
| Overview | 72–88px metric cards with useful links, then recent activity |
| Work Journal | Tabs followed immediately by the current task |
| Inquiries | Compact counts, search/type/topic toolbar, inquiry previews; Insights expandable |
| Chat history | Search/model filter and conversation previews; model distribution expandable |
| Static answers | Search/category filter, result count and question list; full answer on expansion |
| Blog comments | Comment previews, article context and moderation actions; domain analysis secondary |
| Subscribers | Compact subscriber table with total; domain analysis secondary |
| Availability | Preserve form structure; inherit shared shell improvements |

Suggested desktop structure:
Navbar: Inquiries + optional subtitle | Refresh | account controls
Body: Dashboard / Inquiries
Compact counts | Insights
Search | Type | Topic | results
Record previews
Pagination

Targets, not measured improvements: first record by y250–300 at 1280×720; several compact rows visible; body gutters 20–24px, section gaps 12–16px, desktop controls 36–40px with appropriately larger touch targets. Retain readable 14px record text; do not solve density by shrinking everything. Preserve Geist and existing neutral palette (#f6f6f3, #ffffff, #151614, #686a63, #d8d8d0), semantic states and dark theme. Use tabular numerals for counts. The defining design decision is giving records the first viewport.

Provisional heuristic scores (source + bounded desktop inspection; not full interaction/accessibility testing):
| Heuristic | Score /4 | Evidence |
|---|---:|---|
| System status | 3 | Loading and result announcements; count scopes need clarity |
| Real-world language | 3 | Clear labels; task priority mismatched |
| Control/freedom | 3 | Clear filters and unsaved-work guard |
| Consistency | 2 | Multiple header implementations and loose tabs |
| Error prevention | 3 | Safeguards present in source, not exercised |
| Recognition | 3 | Labeled controls; weak journal selected state |
| Efficiency | 1 | Work below fold, tall records |
| Minimalism | 1 | Oversized reports and duplicate context |
| Error recovery | 3 | Retry and clear actions in source, not exercised |
| Help | 2 | Useful but overprominent explanatory copy |
| Total | 24/40 | Significant efficiency improvements needed |

Strengths: coherent restrained visual identity, clear owner navigation, URL-backed collection filters and journal safeguards. Availability already leads with the task.
Cognitive load: main failure is competing hierarchy, not simply number of navigation items. Do not hide familiar sidebar destinations just to reduce a count.
Emotional journey: a calm professional first impression gives way to repeated scrolling before action; keep confirmation and completion feedback close to the work.
Personas: daily owner must scroll before triage; keyboard/zoom users need headings at every breakpoint and proper tab semantics; mobile owner needs charts collapsed and state preserved. Mobile behavior was inferred from source, not browser-tested.

Detector: 21 advisory design-system-font-size findings only. dashboard.tsx lines 222,375,431,659; conversation-insights.tsx 197,236,245; email-domain-insights.tsx 217,256,265; inquiry-stats.tsx 89,117,209; static-answer-catalog.tsx 332,396,430,439,478,482,491,499. Values 10px,11px,15px diverge from the recorded ramp. Some captions/headings may be intentional; these are not proof of contrast/accessibility failures. The measured layout is the main evidence.

Next decisions: (1) analytics collapsed behind Insights (recommended), or always-visible compact summary; (2) record details inline (recommended), or a desktop side panel with full-screen mobile detail. No application implementation was changed.
