# Repstate UI redesign — Design

Date: 2026-10-11. Status: approved (approach A, stage-centred workspace). Applies to `~/Work/Personal/Repstate`.

## Problems found (1440×900 review)

- Live demo: content pinned to a 1024px column, stage capped at 672px, 40% of the screen empty. Reading order heading → paragraph → controls → stage → count → HUD puts the count below the fold while the user watches the video. No empty state. HUD is six abbreviated metrics with no meaning.
- Benchmark: one oversized card per clip, results never visible together, actions at the bottom, no "Run all".
- How it works: sections run together; diagram and table unframed.

## Direction

A measurement instrument. The stage (video + skeleton) is the hero and the count lives on it. Everything else is quiet: one control panel, readable labels, captions that say what a number means. Palette stays shadcn neutral; state colour is the only colour: emerald (ready/up), amber (down), rose (lost), same hues as the skeleton overlay. Numbers in tabular monospace.

Signature element: the scoreboard overlay, bottom-left of the stage: large count, "reps" label, state dot, and a one-line instruction in plain language ("Ready. Go down.", "Come back up", "Rep 3", "Step back into frame").

## Live demo (`/`)

- Container `max-w-7xl`. One-line title ("Live demo") with a one-sentence subline. Below it, at ≥lg, a two-column grid `2fr / minmax(320px,1fr)`; on mobile the stage stacks above the panel.
- Stage: fills its column, 4:3, rounded, dark. Overlays: exercise + backend chips top-left; scoreboard bottom-left; LOST alert bottom; loading and error alerts centred. Empty state (camera off) centred inside the stage: title, three setup lines, primary "Start camera" button.
- Control panel (Card): Exercise segmented control (full width, 3 equal items) → primary action row ("Start camera" before start; "Stop camera" + "Reset count" after) → Session block (reps, elapsed time) → Performance block: Render, Inference, Latency, Skipped frames, Backend, each with a value and a caption; dimmed with "—" until running.
- Copy: active verbs, sentence case; the state instruction is written for the person, not the engine.

## Benchmark (`/benchmark`)

- Toolbar: "Run all clips", "Export JSON", "Copy README rows", record-mode badge when `?record=1`, delegate badge when `?delegate=cpu`.
- Results table (shadcn Table): Clip, Exercise, Expected, Detected (pass/fail tint), Render / inference fps, Latency p50 / p95, Skipped, Backend, Status. One row per bundled clip; rows fill in as clips finish.
- One stage below the table showing the clip currently running (or the last run), with the same scoreboard overlay. Clips run sequentially; a clip can also be run alone from its row.
- `data-testid`s preserved for Playwright and the recorder script: `run-<clip>`, `status-<clip>`, `clip-<clip>` (row), `rep-count` inside the stage, `hud`; plus `run-all`.

## How it works (`/how-it-works`)

Three Cards with one heading style: Pipeline, State machine (diagram framed, thresholds table in a nested section), Proof. Short lead sentence per card. Prose width `max-w-3xl`.

## Engine/session additions

- `RepSession.resetCount()` → `engine.reset()` without restarting camera or detector.
- Elapsed time derived in the hook from session start.

## Out of scope

New dependencies, theme toggle, animations beyond the existing state colour transitions, mobile camera switching.
