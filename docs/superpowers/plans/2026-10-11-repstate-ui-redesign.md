# Repstate UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the three Repstate pages as a stage-centred workspace per the 2026-10-11 design spec.

**Architecture:** UI-layer only plus one session method. New `ui/` components in `features/rep-counter` (stage, scoreboard, control panel, performance panel, state copy) and `features/benchmark` (results table, sequential runner page). Routes unchanged except `__root` container width. Existing domain/application tests untouched; new pure helpers get unit tests.

**Tech Stack:** unchanged (TanStack Start, React 19, shadcn/ui, Hugeicons, Tailwind 4).

## Global Constraints

- No new dependencies. Only existing shadcn components (`button, badge, card, alert, toggle-group, table, separator, sonner`).
- Keep `data-testid`s: `run-<clip>`, `status-<clip>`, `clip-<clip>`, `rep-count`, `hud`, `state`; add `run-all`.
- Layer rules unchanged; `ui/` may import `domain` and `application` types only.
- Copy: sentence case, active verbs, no engine jargon in user-facing text (state names appear only in the How-it-works diagram and the benchmark status column).

## Tasks

### Task 1: Session reset + state copy helper
- Add `resetCount()` to `RepSession` (+ test) and expose through `createSession`/`useRepSession` as `resetCount`.
- Add `ui/state-copy.ts`: `stateInstruction(state, exercise)` and `formatElapsed(ms)` with tests.

### Task 2: Stage with scoreboard overlay
- `ui/stage.tsx` replaces `camera-stage.tsx`: video + `SkeletonOverlay` + chips + `Scoreboard` + LOST/loading/error layers + `emptyState` slot.
- `ui/scoreboard.tsx`: count (`data-testid="rep-count"`), label, state dot (`data-testid="state"` carries the state name as `data-state` and visually shows the instruction).

### Task 3: Control panel and performance panel
- `ui/performance-panel.tsx` replaces `perf-hud.tsx` (`data-testid="hud"`), rows with captions, dimmed until a sample exists.
- `ui/control-panel.tsx`: exercise picker, action row, session block, performance block.
- `ui/live-demo.tsx`: new layout; `__root` main container → `max-w-7xl`.

### Task 4: Benchmark page
- `benchmark/ui/results-table.tsx`, `benchmark/ui/benchmark-toolbar.tsx`, rewrite `benchmark-page.tsx` as a sequential runner with one `Stage`; delete `clip-runner.tsx`.
- Update `e2e/benchmark.spec.ts` and `scripts/record-fixtures.mjs` for the new structure (row testids, `run-all`).

### Task 5: How it works
- Three Cards; prose width; diagram inside a card.

### Task 6: Verify
- `pnpm test`, `lint`, `typecheck`, `build`; browser screenshots at 1440×900 and 375×812 for all three pages; `HEADED=1 node scripts/record-fixtures.mjs` still produces 9/9 and 4/4; `pnpm e2e` passes. Commit per task.
