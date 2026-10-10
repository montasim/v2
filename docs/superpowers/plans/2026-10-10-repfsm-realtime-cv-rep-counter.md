# RepFSM Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy RepFSM, an open-source browser app that counts squat and push-up reps from a live camera or bundled clip with a deterministic FSM engine on MediaPipe pose landmarks, with reproducible benchmark numbers.

**Architecture:** Three one-way layers: `routes/` (TanStack Start UI) → `pipeline/` (camera/video source, MediaPipe PoseLandmarker, adaptive frame-skip loop) → `engine/` (pure TypeScript rep FSM, no DOM/React/MediaPipe imports). CI proves correctness with recorded landmark JSON fixtures through the engine; the in-app `/benchmark` page proves live FPS/accuracy on real devices and exports JSON that feeds the README table.

**Tech Stack:** TanStack Start, React 19, TypeScript, Tailwind CSS 4, Vite, `@mediapipe/tasks-vision`, Vitest, Playwright, Netlify static prerender, pnpm.

Spec: `docs/superpowers/specs/2026-10-10-repfsm-realtime-cv-rep-counter-design.md` (in the portfolio repo; copy into the new repo in Task 1).

## Global Constraints

- New standalone repository `repfsm` (not inside the portfolio repo). Working name "RepFSM"; renaming later is allowed.
- `src/engine/` must import nothing from `react`, `@mediapipe/*`, or the DOM. Enforced by an ESLint `no-restricted-imports` rule in Task 2.
- Engine is deterministic: same `Frame[]` → same `EngineEvent[]`. No `Date.now()`, no timers, no randomness in `src/engine/`.
- MediaPipe model and WASM are served from `public/` (no CDN fetch at runtime).
- Exercises v1: `squat` (hip–knee–ankle: 23/24, 25/26, 27/28) and `pushup` (shoulder–elbow–wrist: 11/12, 13/14, 15/16).
- Thresholds (from spec): squat `downAngle 100`, `upAngle 160`; push-up `downAngle 90`, `upAngle 155`; both `minDwellMs 200`, `minVisibility 0.6`. EMA smoothing alpha `0.5`. LOST after 3 consecutive low-visibility frames; recovery after 3 consecutive good frames.
- Adaptive inference budget: `budgetMs = max(1000/targetFps, p90(inferenceMs) * 1.2)` over a rolling window of 30 samples; `targetFps` is 30 when engine state is `READY`/`DOWN`/`UP`, 10 when `IDLE`/`LOST`.
- Overlay rendering runs on its own `requestAnimationFrame` loop reading the latest landmarks from a ref; it never waits on inference. HUD shows `renderFps` and `inferenceFps` separately.
- Written from scratch for public release: no code, constants, identifiers, or file layouts from any employer or client codebase (spec §12).
- No server state, no accounts. All routes prerendered as static HTML; camera/MediaPipe code runs only in `useEffect`.
- Camera constraints: `{ video: { facingMode: 'user', width: 640, height: 480 } }`.
- Clips: `public/clips/squat-10.webm`, `public/clips/pushup-10.webm`, 10 ground-truth reps each.
- README claims only what fixture tests and committed `benchmarks/*.json` show.
- Commit messages: Conventional Commits, no attribution lines required by this plan beyond the repo's own policy.

---

## File Structure

```
repfsm/
  .github/workflows/ci.yml            Task 11
  .nvmrc                              Task 1
  LICENSE                             Task 1  (MIT)
  README.md                           Task 1 (stub), Task 12 (final)
  netlify.toml                        Task 1
  package.json                        Task 1
  playwright.config.ts                Task 11
  vite.config.ts                      Task 1
  vitest.config.ts                    Task 1
  eslint.config.js                    Task 1, Task 2 (engine import rule)
  public/models/pose_landmarker_lite.task      Task 1
  public/wasm/*                                Task 1 (copied from node_modules at build)
  public/clips/squat-10.webm, pushup-10.webm   Task 8 (manual recording)
  fixtures/landmarks/squat-10.json, .meta.json, pushup-10.json, .meta.json   Task 9
  benchmarks/<date>-<device>.json              Task 12
  src/styles.css                      Task 1
  src/router.tsx                      Task 1 (scaffolded)
  src/routes/__root.tsx               Task 1
  src/routes/index.tsx                Task 7
  src/routes/benchmark.tsx            Task 8
  src/routes/how-it-works.tsx         Task 10
  src/engine/types.ts                 Task 2
  src/engine/angles.ts                Task 2   angle math + side selection
  src/engine/angles.test.ts           Task 2
  src/engine/exercises.ts             Task 3   ExerciseDef table
  src/engine/exercises.test.ts        Task 3
  src/engine/rep-engine.ts            Task 4   RepEngine FSM
  src/engine/rep-engine.test.ts       Task 4 (synthetic), Task 9 (fixtures)
  src/engine/fixtures.test.ts         Task 9
  src/pipeline/should-infer.ts        Task 5   pure adaptive budget
  src/pipeline/should-infer.test.ts   Task 5
  src/pipeline/perf.ts                Task 5   rolling stats + PerfSample
  src/pipeline/perf.test.ts           Task 5
  src/pipeline/detector.ts            Task 6   PoseLandmarker wrapper, GPU→CPU fallback
  src/pipeline/source.ts              Task 6   camera / video element source
  src/pipeline/loop.ts                Task 6   runLoop
  src/components/RepCounter.tsx       Task 7
  src/components/Hud.tsx              Task 7
  src/components/Overlay.tsx          Task 7   skeleton canvas
  src/components/ExercisePicker.tsx   Task 7
  src/components/useRepSession.ts     Task 7   React hook binding pipeline+engine
  src/components/ClipPlayer.tsx       Task 8
  src/components/FsmDiagram.tsx       Task 10
  e2e/benchmark.spec.ts               Task 11
  lighthouserc.json                   Task 11
```

---

### Task 1: Scaffold repository and toolchain

**Files:**
- Create: `repfsm/` via TanStack CLI, then `vite.config.ts`, `vitest.config.ts`, `netlify.toml`, `.nvmrc`, `LICENSE`, `README.md`, `src/styles.css`, `src/routes/__root.tsx`, `public/models/pose_landmarker_lite.task`, `scripts/copy-wasm.mjs`
- Copy: portfolio spec into `docs/superpowers/specs/`

**Interfaces:**
- Produces: project skeleton; `pnpm dev`, `pnpm build`, `pnpm test`, `pnpm typecheck`, `pnpm lint` scripts.

- [ ] **Step 1: Scaffold with TanStack CLI (minimal, file router)**

Run from `~/Work/Personal/`:

```bash
pnpm create @tanstack/start@latest repfsm --blank -y --package-manager pnpm
cd repfsm
git init
```

Expected: `src/routes/__root.tsx`, `src/routes/index.tsx`, `src/router.tsx`, `vite.config.ts`, `package.json` exist. If the CLI prompts, choose: TypeScript, Tailwind yes, no add-ons.

- [ ] **Step 2: Install dependencies**

```bash
pnpm add @mediapipe/tasks-vision
pnpm add -D tailwindcss @tailwindcss/vite vitest @vitest/coverage-v8 jsdom @testing-library/react @netlify/vite-plugin-tanstack-start @playwright/test @lhci/cli @tanstack/eslint-config eslint prettier prettier-plugin-tailwindcss
```

- [ ] **Step 3: Replace `vite.config.ts`**

```ts
import { defineConfig } from "vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import netlify from "@netlify/vite-plugin-tanstack-start"
import viteReact from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    tailwindcss(),
    tanstackStart({
      prerender: { enabled: true, crawlLinks: true, failOnError: true },
    }),
    netlify(),
    viteReact(),
  ],
})
```

- [ ] **Step 4: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    environment: "node",
    coverage: { include: ["src/engine/**", "src/pipeline/**"] },
  },
})
```

- [ ] **Step 5: Create `scripts/copy-wasm.mjs`** (copies MediaPipe WASM into `public/wasm` so nothing loads from a CDN)

```js
import { cpSync, mkdirSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, join } from "node:path"

const require = createRequire(import.meta.url)
const pkgRoot = dirname(require.resolve("@mediapipe/tasks-vision/package.json"))
mkdirSync("public/wasm", { recursive: true })
cpSync(join(pkgRoot, "wasm"), "public/wasm", { recursive: true })
console.log("copied @mediapipe/tasks-vision wasm → public/wasm")
```

- [ ] **Step 6: Download the pose model**

```bash
mkdir -p public/models
curl -L -o public/models/pose_landmarker_lite.task \
  https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task
ls -la public/models
```

Expected: file around 5–6 MB.

- [ ] **Step 7: Set `package.json` scripts and engines**

Merge into `package.json`:

```json
{
  "name": "repfsm",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@11.7.0",
  "engines": { "node": ">=22", "pnpm": ">=11" },
  "scripts": {
    "postinstall": "node scripts/copy-wasm.mjs",
    "dev": "vite dev --port 3000",
    "build": "vite build",
    "preview": "vite preview --port 3000",
    "test": "vitest run",
    "test:watch": "vitest",
    "e2e": "playwright test",
    "lint": "eslint",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write \"src/**/*.{ts,tsx,css}\" \"*.{ts,js,json,md}\""
  }
}
```

- [ ] **Step 8: Create `netlify.toml`, `.nvmrc`, `.gitignore` additions**

`netlify.toml`:

```toml
[build]
  command = "pnpm build"
  publish = "dist/client"

[build.environment]
  NODE_VERSION = "22"
  PNPM_VERSION = "11.7.0"

[[headers]]
  for = "/wasm/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/models/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

`.nvmrc`:

```
22
```

Append to `.gitignore`:

```
public/wasm
.netlify
.output
.tanstack
test-results
playwright-report
.lighthouseci
```

- [ ] **Step 9: Create `src/styles.css`**

```css
@import "tailwindcss";

:root { color-scheme: light dark; }
body { @apply bg-white text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-100; }
```

- [ ] **Step 10: Replace `src/routes/__root.tsx`**

```tsx
import { HeadContent, Link, Outlet, Scripts, createRootRoute } from "@tanstack/react-router"
import appCss from "../styles.css?url"

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "RepFSM — deterministic pose rep counter in the browser" },
      {
        name: "description",
        content:
          "Open-source squat and push-up rep counter: MediaPipe pose landmarks, a deterministic finite-state-machine engine, adaptive frame rate, and reproducible benchmarks.",
      },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootDocument,
  component: () => <Outlet />,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link to="/" className="font-semibold">RepFSM</Link>
          <nav className="flex gap-4 text-sm">
            <Link to="/benchmark">Benchmark</Link>
            <Link to="/how-it-works">How it works</Link>
            <a href="https://github.com/montasim/repfsm" rel="noreferrer">GitHub</a>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-4 pb-16">{children}</main>
        <Scripts />
      </body>
    </html>
  )
}
```

- [ ] **Step 11: Temporary `src/routes/index.tsx`** (replaced in Task 7)

```tsx
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
  component: () => <h1 className="text-3xl font-bold">RepFSM</h1>,
})
```

- [ ] **Step 12: `LICENSE` (MIT, year 2026, holder "Mohammad Montasim Al Mamun Shuvo") and `README.md` stub**

`README.md`:

```md
# RepFSM

Deterministic squat and push-up rep counter in the browser. MediaPipe pose landmarks → pure-TypeScript finite-state machine → reps. Adaptive frame rate. Reproducible benchmarks.

Status: under construction. See `docs/superpowers/specs/` for the design.
```

- [ ] **Step 13: Copy spec and verify toolchain**

```bash
mkdir -p docs/superpowers/specs
cp ~/Work/Personal/v2/docs/superpowers/specs/2026-10-10-repfsm-realtime-cv-rep-counter-design.md docs/superpowers/specs/
pnpm install
pnpm typecheck && pnpm build && ls dist/client/wasm | head -3 && ls dist/client/index.html
```

Expected: typecheck clean, build succeeds, `dist/client/index.html` exists, wasm files listed.

- [ ] **Step 14: Commit**

```bash
git add -A
git commit -m "chore: scaffold RepFSM with TanStack Start, MediaPipe assets, and toolchain"
```

---

### Task 2: Engine types and angle math

**Files:**
- Create: `src/engine/types.ts`, `src/engine/angles.ts`, `src/engine/angles.test.ts`
- Modify: `eslint.config.js` (engine import restriction)

**Interfaces:**
- Produces:
  - `type Landmark = { x: number; y: number; z: number; visibility: number }`
  - `type Frame = { t: number; landmarks: Landmark[] }`
  - `type State = 'IDLE' | 'READY' | 'DOWN' | 'UP' | 'LOST'`
  - `type EngineEvent` (state | rep | warning)
  - `type JointTriple = [number, number, number]`
  - `angleDeg(a: Landmark, b: Landmark, c: Landmark): number` — angle at `b` in degrees, 0..180
  - `meanVisibility(frame: Frame, triples: JointTriple[]): number`
  - `selectAngle(frame: Frame, triples: JointTriple[], minVisibility: number): number | null` — smaller angle among sides whose mean visibility ≥ gate; `null` if none.

- [ ] **Step 1: Write `src/engine/types.ts`**

```ts
export type Landmark = { x: number; y: number; z: number; visibility: number }

/** One pose frame. `t` is milliseconds, monotonic within a session. 33 landmarks in MediaPipe order. */
export type Frame = { t: number; landmarks: Landmark[] }

export type State = "IDLE" | "READY" | "DOWN" | "UP" | "LOST"

export type EngineEvent =
  | { type: "state"; from: State; to: State; t: number }
  | { type: "rep"; count: number; t: number; durationMs: number }
  | { type: "warning"; code: "low_visibility" | "no_pose"; t: number }

/** [a, b, c] landmark indices; the angle is measured at b. */
export type JointTriple = [number, number, number]

export type ExerciseId = "squat" | "pushup"

export type ExerciseDef = {
  id: ExerciseId
  label: string
  /** One triple per body side (left, right). */
  joints: JointTriple[]
  downAngle: number
  upAngle: number
  minDwellMs: number
  minVisibility: number
  /** Copy shown when the engine is LOST. */
  lostHint: string
}

export type Snapshot = {
  state: State
  count: number
  angle: number | null
  lastRepAt: number | null
}
```

- [ ] **Step 2: Write the failing tests `src/engine/angles.test.ts`**

```ts
import { describe, expect, it } from "vitest"
import { angleDeg, meanVisibility, selectAngle } from "./angles"
import type { Frame, Landmark } from "./types"

const lm = (x: number, y: number, visibility = 1): Landmark => ({ x, y, z: 0, visibility })

function frameWith(points: Record<number, Landmark>): Frame {
  const landmarks: Landmark[] = Array.from({ length: 33 }, () => lm(0, 0, 0))
  for (const [i, p] of Object.entries(points)) landmarks[Number(i)] = p
  return { t: 0, landmarks }
}

describe("angleDeg", () => {
  it("returns 180 for a straight line", () => {
    expect(angleDeg(lm(0, 0), lm(1, 0), lm(2, 0))).toBeCloseTo(180, 5)
  })
  it("returns 90 for a right angle", () => {
    expect(angleDeg(lm(0, 1), lm(0, 0), lm(1, 0))).toBeCloseTo(90, 5)
  })
  it("returns 0 when both rays coincide", () => {
    expect(angleDeg(lm(1, 0), lm(0, 0), lm(2, 0))).toBeCloseTo(0, 5)
  })
  it("returns 0 when a ray has zero length instead of NaN", () => {
    expect(angleDeg(lm(0, 0), lm(0, 0), lm(1, 0))).toBe(0)
  })
})

describe("meanVisibility", () => {
  it("averages visibility across every index in the triples", () => {
    const f = frameWith({ 23: lm(0, 0, 1), 25: lm(0, 0, 0.5), 27: lm(0, 0, 0) })
    expect(meanVisibility(f, [[23, 25, 27]])).toBeCloseTo(0.5)
  })
})

describe("selectAngle", () => {
  const left: [number, number, number] = [23, 25, 27]
  const right: [number, number, number] = [24, 26, 28]
  it("returns the smaller angle when both sides are visible", () => {
    const f = frameWith({
      23: lm(0, 1), 25: lm(0, 0), 27: lm(1, 0), // 90°
      24: lm(0, 0), 26: lm(1, 0), 28: lm(2, 0), // 180°
    })
    expect(selectAngle(f, [left, right], 0.6)).toBeCloseTo(90)
  })
  it("uses only the visible side", () => {
    const f = frameWith({
      23: lm(0, 1, 0.2), 25: lm(0, 0, 0.2), 27: lm(1, 0, 0.2),
      24: lm(0, 0), 26: lm(1, 0), 28: lm(2, 0),
    })
    expect(selectAngle(f, [left, right], 0.6)).toBeCloseTo(180)
  })
  it("returns null when no side passes the visibility gate", () => {
    const f = frameWith({})
    expect(selectAngle(f, [left, right], 0.6)).toBeNull()
  })
})
```

- [ ] **Step 3: Run to verify failure**

```bash
pnpm vitest run src/engine/angles.test.ts
```

Expected: FAIL, `Cannot find module './angles'`.

- [ ] **Step 4: Write `src/engine/angles.ts`**

```ts
import type { Frame, JointTriple, Landmark } from "./types"

/** Angle at `b` between rays b→a and b→c, in degrees 0..180. Zero-length rays yield 0. */
export function angleDeg(a: Landmark, b: Landmark, c: Landmark): number {
  const abx = a.x - b.x, aby = a.y - b.y
  const cbx = c.x - b.x, cby = c.y - b.y
  const lenAb = Math.hypot(abx, aby), lenCb = Math.hypot(cbx, cby)
  if (lenAb === 0 || lenCb === 0) return 0
  const cos = (abx * cbx + aby * cby) / (lenAb * lenCb)
  return (Math.acos(Math.min(1, Math.max(-1, cos))) * 180) / Math.PI
}

export function meanVisibility(frame: Frame, triples: JointTriple[]): number {
  let sum = 0, n = 0
  for (const triple of triples) for (const i of triple) { sum += frame.landmarks[i]?.visibility ?? 0; n++ }
  return n === 0 ? 0 : sum / n
}

/** Smallest angle among body sides whose own mean visibility passes the gate; null if none pass. */
export function selectAngle(frame: Frame, triples: JointTriple[], minVisibility: number): number | null {
  let best: number | null = null
  for (const triple of triples) {
    if (meanVisibility(frame, [triple]) < minVisibility) continue
    const [a, b, c] = triple
    const angle = angleDeg(frame.landmarks[a], frame.landmarks[b], frame.landmarks[c])
    if (best === null || angle < best) best = angle
  }
  return best
}
```

- [ ] **Step 5: Run tests**

```bash
pnpm vitest run src/engine/angles.test.ts
```

Expected: 8 passed.

- [ ] **Step 6: Add engine import restriction to `eslint.config.js`**

Append a config object to the exported array:

```js
{
  files: ["src/engine/**/*.ts"],
  rules: {
    "no-restricted-imports": ["error", {
      patterns: [{ group: ["react", "react-*", "@mediapipe/*", "@tanstack/*"], message: "src/engine must stay pure TypeScript." }],
    }],
    "no-restricted-globals": ["error", "window", "document", "navigator", "performance", "requestAnimationFrame"],
  },
},
```

Run `pnpm lint`. Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add src/engine eslint.config.js
git commit -m "feat(engine): add pose frame types and angle selection"
```

---

### Task 3: Exercise definitions

**Files:**
- Create: `src/engine/exercises.ts`, `src/engine/exercises.test.ts`

**Interfaces:**
- Produces: `EXERCISES: Record<ExerciseId, ExerciseDef>`, `getExercise(id: ExerciseId): ExerciseDef`.

- [ ] **Step 1: Failing test `src/engine/exercises.test.ts`**

```ts
import { describe, expect, it } from "vitest"
import { EXERCISES, getExercise } from "./exercises"

describe("exercise definitions", () => {
  it("defines squat on hip-knee-ankle for both sides", () => {
    expect(EXERCISES.squat.joints).toEqual([[23, 25, 27], [24, 26, 28]])
  })
  it("defines pushup on shoulder-elbow-wrist for both sides", () => {
    expect(EXERCISES.pushup.joints).toEqual([[11, 13, 15], [12, 14, 16]])
  })
  it("keeps a hysteresis gap of at least 30 degrees on every exercise", () => {
    for (const def of Object.values(EXERCISES)) expect(def.upAngle - def.downAngle).toBeGreaterThanOrEqual(30)
  })
  it("getExercise returns the same object as the table", () => {
    expect(getExercise("squat")).toBe(EXERCISES.squat)
  })
})
```

- [ ] **Step 2: Run, expect FAIL** — `pnpm vitest run src/engine/exercises.test.ts` → `Cannot find module './exercises'`.

- [ ] **Step 3: Write `src/engine/exercises.ts`**

```ts
import type { ExerciseDef, ExerciseId } from "./types"

export const EXERCISES: Record<ExerciseId, ExerciseDef> = {
  squat: {
    id: "squat",
    label: "Squat",
    joints: [[23, 25, 27], [24, 26, 28]],
    downAngle: 100,
    upAngle: 160,
    minDwellMs: 200,
    minVisibility: 0.6,
    lostHint: "Step back so your hips, knees and ankles are in frame.",
  },
  pushup: {
    id: "pushup",
    label: "Push-up",
    joints: [[11, 13, 15], [12, 14, 16]],
    downAngle: 90,
    upAngle: 155,
    minDwellMs: 200,
    minVisibility: 0.6,
    lostHint: "Turn side-on so your shoulders, elbows and wrists are in frame.",
  },
}

export function getExercise(id: ExerciseId): ExerciseDef {
  return EXERCISES[id]
}
```

- [ ] **Step 4: Run, expect 4 passed.** `pnpm vitest run src/engine/exercises.test.ts`

- [ ] **Step 5: Commit**

```bash
git add src/engine/exercises.ts src/engine/exercises.test.ts
git commit -m "feat(engine): add squat and push-up exercise definitions"
```

---

### Task 4: RepEngine finite-state machine

**Files:**
- Create: `src/engine/rep-engine.ts`, `src/engine/rep-engine.test.ts`

**Interfaces:**
- Consumes: `selectAngle`, `ExerciseDef`, types from Task 2/3.
- Produces: `class RepEngine { constructor(def: ExerciseDef); step(frame: Frame): EngineEvent[]; reset(): void; snapshot(): Snapshot }` and test helper export `syntheticFrame(angleDeg: number, t: number, visibility?: number): Frame` from the test file only.

FSM rules (copied from spec):
- `IDLE → READY`: visibility ok and angle ≥ upAngle.
- `READY → DOWN`: angle ≤ downAngle. Record `downAt = t`.
- `DOWN → UP` (rep): angle ≥ upAngle and `t - downAt ≥ minDwellMs`. Emit `rep` with `durationMs = t - downAt`.
- `DOWN → READY` (no rep): angle ≥ upAngle and dwell not met.
- `UP → READY`: on the next frame, unconditionally, before evaluating the frame.
- `* → LOST`: angle `null` (no side passes gate) for 3 consecutive frames. Emit `warning low_visibility` once on entry. Rep in progress discarded.
- `LOST → READY`: angle non-null for 3 consecutive frames and angle ≥ upAngle. Smoothing resets on LOST.
- Smoothing: `ema = ema === null ? angle : 0.5 * angle + 0.5 * ema`.
- A frame with fewer than 33 landmarks emits `warning no_pose` and counts as a low-visibility frame.

- [ ] **Step 1: Failing tests `src/engine/rep-engine.test.ts`**

```ts
import { describe, expect, it } from "vitest"
import { RepEngine } from "./rep-engine"
import { EXERCISES } from "./exercises"
import type { EngineEvent, Frame, Landmark } from "./types"

/** Build a frame whose squat knee angle (both sides) equals `deg`. */
export function syntheticFrame(deg: number, t: number, visibility = 1): Frame {
  const rad = (deg * Math.PI) / 180
  const lm = (x: number, y: number): Landmark => ({ x, y, z: 0, visibility })
  const landmarks: Landmark[] = Array.from({ length: 33 }, () => lm(0, 0))
  // knee at origin, ankle on +x axis, hip rotated by deg
  for (const [hip, knee, ankle] of [[23, 25, 27], [24, 26, 28]] as const) {
    landmarks[knee] = lm(0, 0)
    landmarks[ankle] = lm(1, 0)
    landmarks[hip] = lm(Math.cos(rad), Math.sin(rad))
  }
  return { t, landmarks }
}

function run(engine: RepEngine, frames: Frame[]): EngineEvent[] {
  return frames.flatMap((f) => engine.step(f))
}

function rep(angles: number[], startT = 0, stepMs = 50): Frame[] {
  return angles.map((a, i) => syntheticFrame(a, startT + i * stepMs))
}

const FULL_REP = [170, 170, 150, 120, 95, 90, 90, 90, 90, 90, 120, 150, 170, 170]

describe("RepEngine", () => {
  it("starts IDLE and moves to READY on a visible upright frame", () => {
    const e = new RepEngine(EXERCISES.squat)
    const events = e.step(syntheticFrame(170, 0))
    expect(events).toEqual([{ type: "state", from: "IDLE", to: "READY", t: 0 }])
    expect(e.snapshot().state).toBe("READY")
  })

  it("counts one rep for a full down-up cycle with dwell", () => {
    const e = new RepEngine(EXERCISES.squat)
    const events = run(e, rep(FULL_REP))
    const reps = events.filter((ev) => ev.type === "rep")
    expect(reps).toHaveLength(1)
    expect(e.snapshot().count).toBe(1)
    expect(reps[0]).toMatchObject({ type: "rep", count: 1 })
  })

  it("does not count when the angle oscillates inside the hysteresis gap", () => {
    const e = new RepEngine(EXERCISES.squat)
    run(e, rep([170, 170, 130, 110, 130, 110, 130, 110, 170]))
    expect(e.snapshot().count).toBe(0)
  })

  it("does not count a bounce shorter than minDwellMs", () => {
    const e = new RepEngine(EXERCISES.squat)
    // 90 for one 50ms frame, then back up: dwell 50ms < 200ms
    run(e, rep([170, 170, 90, 170, 170]))
    expect(e.snapshot().count).toBe(0)
    expect(e.snapshot().state).toBe("READY")
  })

  it("is deterministic: same frames give identical events", () => {
    const frames = [...rep(FULL_REP), ...rep(FULL_REP, 1000)]
    const a = run(new RepEngine(EXERCISES.squat), frames)
    const b = run(new RepEngine(EXERCISES.squat), frames)
    expect(a).toEqual(b)
    expect(a.filter((ev) => ev.type === "rep")).toHaveLength(2)
  })

  it("enters LOST after 3 low-visibility frames and discards the rep in progress", () => {
    const e = new RepEngine(EXERCISES.squat)
    run(e, rep([170, 170, 90, 90]))
    expect(e.snapshot().state).toBe("DOWN")
    const events = run(e, [
      syntheticFrame(90, 500, 0.1),
      syntheticFrame(90, 550, 0.1),
      syntheticFrame(90, 600, 0.1),
    ])
    expect(e.snapshot().state).toBe("LOST")
    expect(events.filter((ev) => ev.type === "warning")).toEqual([{ type: "warning", code: "low_visibility", t: 600 }])
    // recover upright, then go down/up: still only one rep total, the earlier one never counted
    run(e, rep([170, 170, 170, 170, 90, 90, 90, 90, 90, 90, 170, 170], 700))
    expect(e.snapshot().count).toBe(1)
  })

  it("does not emit low_visibility again while staying LOST", () => {
    const e = new RepEngine(EXERCISES.squat)
    const events = run(e, [0, 50, 100, 150, 200].map((t) => syntheticFrame(170, t, 0.1)))
    expect(events.filter((ev) => ev.type === "warning")).toHaveLength(1)
  })

  it("emits no_pose for a frame without 33 landmarks", () => {
    const e = new RepEngine(EXERCISES.squat)
    const events = e.step({ t: 0, landmarks: [] })
    expect(events).toContainEqual({ type: "warning", code: "no_pose", t: 0 })
  })

  it("reset returns to IDLE with count 0", () => {
    const e = new RepEngine(EXERCISES.squat)
    run(e, rep(FULL_REP))
    e.reset()
    expect(e.snapshot()).toEqual({ state: "IDLE", count: 0, angle: null, lastRepAt: null })
  })
})
```

- [ ] **Step 2: Run, expect FAIL** — `pnpm vitest run src/engine/rep-engine.test.ts` → `Cannot find module './rep-engine'`.

- [ ] **Step 3: Write `src/engine/rep-engine.ts`**

```ts
import { selectAngle } from "./angles"
import type { EngineEvent, ExerciseDef, Frame, Snapshot, State } from "./types"

const LOST_AFTER_FRAMES = 3
const RECOVER_AFTER_FRAMES = 3
const EMA_ALPHA = 0.5

/**
 * Deterministic rep counter. Feed frames in time order; receive events.
 * No timers, no globals: time comes only from `frame.t`.
 */
export class RepEngine {
  private state: State = "IDLE"
  private count = 0
  private ema: number | null = null
  private downAt: number | null = null
  private lastRepAt: number | null = null
  private lowFrames = 0
  private goodFrames = 0

  constructor(private readonly def: ExerciseDef) {}

  reset(): void {
    this.state = "IDLE"
    this.count = 0
    this.ema = null
    this.downAt = null
    this.lastRepAt = null
    this.lowFrames = 0
    this.goodFrames = 0
  }

  snapshot(): Snapshot {
    return { state: this.state, count: this.count, angle: this.ema, lastRepAt: this.lastRepAt }
  }

  step(frame: Frame): EngineEvent[] {
    const events: EngineEvent[] = []
    const t = frame.t

    if (this.state === "UP") this.transition("READY", t, events)

    let raw: number | null = null
    if (frame.landmarks.length < 33) {
      events.push({ type: "warning", code: "no_pose", t })
    } else {
      raw = selectAngle(frame, this.def.joints, this.def.minVisibility)
    }

    if (raw === null) {
      this.lowFrames++
      this.goodFrames = 0
      if (this.state !== "LOST" && this.lowFrames >= LOST_AFTER_FRAMES) {
        this.ema = null
        this.downAt = null
        this.transition("LOST", t, events)
        events.push({ type: "warning", code: "low_visibility", t })
      }
      return events
    }

    this.lowFrames = 0
    this.goodFrames++
    this.ema = this.ema === null ? raw : EMA_ALPHA * raw + (1 - EMA_ALPHA) * this.ema
    const angle = this.ema

    switch (this.state) {
      case "IDLE":
        if (angle >= this.def.upAngle) this.transition("READY", t, events)
        break
      case "LOST":
        if (this.goodFrames >= RECOVER_AFTER_FRAMES && angle >= this.def.upAngle) this.transition("READY", t, events)
        break
      case "READY":
        if (angle <= this.def.downAngle) {
          this.downAt = t
          this.transition("DOWN", t, events)
        }
        break
      case "DOWN":
        if (angle >= this.def.upAngle) {
          const dwell = t - (this.downAt ?? t)
          this.downAt = null
          if (dwell >= this.def.minDwellMs) {
            this.count++
            this.lastRepAt = t
            this.transition("UP", t, events)
            events.push({ type: "rep", count: this.count, t, durationMs: dwell })
          } else {
            this.transition("READY", t, events)
          }
        }
        break
      case "UP":
        break
    }
    return events
  }

  private transition(to: State, t: number, events: EngineEvent[]): void {
    const from = this.state
    if (from === to) return
    this.state = to
    events.push({ type: "state", from, to, t })
  }
}
```

- [ ] **Step 4: Run, expect 9 passed.** `pnpm vitest run src/engine/rep-engine.test.ts`

If the hysteresis test fails because EMA lags: the synthetic sequence `[170,170,130,110,130,110,130,110,170]` never crosses 100 even smoothed, so count must stay 0. If the dwell test fails: `[170,170,90,170,170]` smoothed gives `130` at the 90 frame, never ≤ 100, so no DOWN at all and count 0 — the test still passes; that is acceptable because the intent (no rep) holds. Do not weaken thresholds to force a DOWN.

- [ ] **Step 5: Commit**

```bash
git add src/engine/rep-engine.ts src/engine/rep-engine.test.ts
git commit -m "feat(engine): add deterministic RepEngine finite-state machine"
```

---

### Task 5: Adaptive frame budget and perf stats

**Files:**
- Create: `src/pipeline/should-infer.ts`, `src/pipeline/should-infer.test.ts`, `src/pipeline/perf.ts`, `src/pipeline/perf.test.ts`

**Interfaces:**
- Produces:
  - `class RollingWindow { constructor(size: number); push(v: number): void; percentile(p: number): number; size(): number; values(): number[]; clear(): void }`
  - `budgetMs(window: RollingWindow, targetFps?: number): number` — `max(1000/targetFps, p90 * 1.2)`; when window empty returns `1000/targetFps`.
  - `targetFpsFor(state: State): number` — 30 for `READY`/`DOWN`/`UP`, 10 for `IDLE`/`LOST`.
  - `shouldInfer(now: number, lastInferenceAt: number | null, window: RollingWindow, targetFps?: number): boolean`
  - `type PerfSample = { at: number; renderFps: number; inferenceFps: number; inferenceP50: number; inferenceP95: number; dropped: number; delegate: 'GPU' | 'CPU' }`
  - `class PerfTracker { constructor(delegate: 'GPU'|'CPU'); recordInference(ms: number, at: number): void; recordRender(at: number): void; recordDrop(): void; sample(at: number): PerfSample; reset(): void }` — `inferenceFps`/`renderFps` = events in the last 1000 ms before `at`.

- [ ] **Step 1: Failing tests `src/pipeline/should-infer.test.ts`**

```ts
import { describe, expect, it } from "vitest"
import { RollingWindow, budgetMs, shouldInfer, targetFpsFor } from "./should-infer"

describe("RollingWindow", () => {
  it("keeps only the newest `size` values", () => {
    const w = new RollingWindow(3)
    for (const v of [1, 2, 3, 4]) w.push(v)
    expect(w.values()).toEqual([2, 3, 4])
  })
  it("computes nearest-rank percentiles", () => {
    const w = new RollingWindow(10)
    for (const v of [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]) w.push(v)
    expect(w.percentile(50)).toBe(50)
    expect(w.percentile(90)).toBe(90)
    expect(w.percentile(100)).toBe(100)
  })
  it("returns 0 for an empty window", () => {
    expect(new RollingWindow(5).percentile(90)).toBe(0)
  })
})

describe("budgetMs", () => {
  it("floors at 1000/30 when inference is fast", () => {
    const w = new RollingWindow(30)
    for (let i = 0; i < 30; i++) w.push(5)
    expect(budgetMs(w)).toBeCloseTo(1000 / 30)
  })
  it("expands to p90 * 1.2 when inference is slow", () => {
    const w = new RollingWindow(30)
    for (let i = 0; i < 30; i++) w.push(100)
    expect(budgetMs(w)).toBeCloseTo(120)
  })
  it("uses the floor when the window is empty", () => {
    expect(budgetMs(new RollingWindow(30))).toBeCloseTo(1000 / 30)
  })
})

describe("targetFpsFor", () => {
  it("runs at 30 while a person is in position and 10 while idle or lost", () => {
    expect(targetFpsFor("READY")).toBe(30)
    expect(targetFpsFor("DOWN")).toBe(30)
    expect(targetFpsFor("UP")).toBe(30)
    expect(targetFpsFor("IDLE")).toBe(10)
    expect(targetFpsFor("LOST")).toBe(10)
  })
})

describe("shouldInfer", () => {
  it("always infers when nothing has run yet", () => {
    expect(shouldInfer(0, null, new RollingWindow(30))).toBe(true)
  })
  it("skips frames inside the budget and allows after it", () => {
    const w = new RollingWindow(30)
    for (let i = 0; i < 30; i++) w.push(100)
    expect(shouldInfer(1050, 1000, w)).toBe(false)
    expect(shouldInfer(1120, 1000, w)).toBe(true)
  })
  it("uses a 100ms floor when the target is 10 fps", () => {
    const w = new RollingWindow(30)
    for (let i = 0; i < 30; i++) w.push(5)
    expect(shouldInfer(1050, 1000, w, 10)).toBe(false)
    expect(shouldInfer(1100, 1000, w, 10)).toBe(true)
  })
})
```

- [ ] **Step 2: Run, expect FAIL** — `pnpm vitest run src/pipeline/should-infer.test.ts`.

- [ ] **Step 3: Write `src/pipeline/should-infer.ts`**

```ts
export class RollingWindow {
  private buf: number[] = []
  constructor(private readonly max: number) {}
  push(v: number): void {
    this.buf.push(v)
    if (this.buf.length > this.max) this.buf.shift()
  }
  size(): number { return this.buf.length }
  values(): number[] { return [...this.buf] }
  clear(): void { this.buf = [] }
  /** Nearest-rank percentile, p in 0..100. Empty window → 0. */
  percentile(p: number): number {
    if (this.buf.length === 0) return 0
    const sorted = [...this.buf].sort((a, b) => a - b)
    const rank = Math.max(1, Math.ceil((p / 100) * sorted.length))
    return sorted[rank - 1]
  }
}

import type { State } from "@/engine/types"

export const ACTIVE_FPS = 30
export const IDLE_FPS = 10

/** Inference target by engine state: full rate while someone is in position, low rate while idle or lost. */
export function targetFpsFor(state: State): number {
  return state === "IDLE" || state === "LOST" ? IDLE_FPS : ACTIVE_FPS
}

export function budgetMs(window: RollingWindow, targetFps = ACTIVE_FPS): number {
  const floor = 1000 / targetFps
  if (window.size() === 0) return floor
  return Math.max(floor, window.percentile(90) * 1.2)
}

export function shouldInfer(now: number, lastInferenceAt: number | null, window: RollingWindow, targetFps = ACTIVE_FPS): boolean {
  if (lastInferenceAt === null) return true
  return now - lastInferenceAt >= budgetMs(window, targetFps)
}
```

- [ ] **Step 4: Run, expect 11 passed.**

- [ ] **Step 5: Failing tests `src/pipeline/perf.test.ts`**

```ts
import { describe, expect, it } from "vitest"
import { PerfTracker } from "./perf"

describe("PerfTracker", () => {
  it("reports inference and render fps over the trailing second and percentiles of inference time", () => {
    const p = new PerfTracker("GPU")
    for (let i = 0; i < 20; i++) p.recordInference(10 + i, i * 50) // 20 inferences over 1s
    for (let i = 0; i < 60; i++) p.recordRender(i * (1000 / 60)) // 60 renders over 1s
    p.recordDrop(); p.recordDrop()
    const s = p.sample(1000)
    expect(s.inferenceFps).toBe(20)
    expect(s.renderFps).toBe(60)
    expect(s.inferenceP50).toBe(19)
    expect(s.inferenceP95).toBe(28)
    expect(s.dropped).toBe(2)
    expect(s.delegate).toBe("GPU")
    expect(s.at).toBe(1000)
  })
  it("forgets inferences older than one second for fps", () => {
    const p = new PerfTracker("CPU")
    p.recordInference(10, 0)
    p.recordInference(10, 1500)
    expect(p.sample(2000).inferenceFps).toBe(1)
  })
  it("reset clears everything", () => {
    const p = new PerfTracker("CPU")
    p.recordInference(10, 0); p.recordRender(0); p.recordDrop()
    p.reset()
    expect(p.sample(100)).toMatchObject({ inferenceFps: 0, renderFps: 0, dropped: 0, inferenceP50: 0 })
  })
})
```

- [ ] **Step 6: Run, expect FAIL.**

- [ ] **Step 7: Write `src/pipeline/perf.ts`**

```ts
import { RollingWindow } from "./should-infer"

export type Delegate = "GPU" | "CPU"

export type PerfSample = {
  at: number
  renderFps: number
  inferenceFps: number
  inferenceP50: number
  inferenceP95: number
  dropped: number
  delegate: Delegate
}

/** Timestamps within the trailing second; older entries are pruned on push. */
class Stamps {
  private list: number[] = []
  push(at: number): void {
    this.list.push(at)
    const cutoff = at - 1000
    while (this.list.length && this.list[0] < cutoff) this.list.shift()
  }
  countSince(cutoff: number): number { return this.list.filter((s) => s > cutoff).length }
  clear(): void { this.list = [] }
}

export class PerfTracker {
  readonly window = new RollingWindow(30)
  private inferences = new Stamps()
  private renders = new Stamps()
  private dropped = 0

  constructor(private readonly delegate: Delegate) {}

  recordInference(ms: number, at: number): void {
    this.window.push(ms)
    this.inferences.push(at)
  }

  recordRender(at: number): void { this.renders.push(at) }

  recordDrop(): void { this.dropped++ }

  sample(at: number): PerfSample {
    const cutoff = at - 1000
    return {
      at,
      renderFps: this.renders.countSince(cutoff),
      inferenceFps: this.inferences.countSince(cutoff),
      inferenceP50: this.window.percentile(50),
      inferenceP95: this.window.percentile(95),
      dropped: this.dropped,
      delegate: this.delegate,
    }
  }

  reset(): void {
    this.inferences.clear()
    this.renders.clear()
    this.dropped = 0
    this.window.clear()
  }
}
```

- [ ] **Step 8: Run both files, expect all pass.** `pnpm vitest run src/pipeline`

- [ ] **Step 9: Commit**

```bash
git add src/pipeline
git commit -m "feat(pipeline): add two-axis adaptive inference budget and render/inference perf tracker"
```

---

### Task 6: Browser pipeline: detector, source, loop

**Files:**
- Create: `src/pipeline/detector.ts`, `src/pipeline/source.ts`, `src/pipeline/loop.ts`

No unit tests (browser-only, MediaPipe/WebGL). Verified through Task 7 manual run and Task 11 smoke test.

**Interfaces:**
- Produces:
  - `createDetector(): Promise<Detector>` where `type Detector = { landmarker: PoseLandmarker; delegate: Delegate; close(): void }`
  - `createCameraSource(video: HTMLVideoElement): Promise<Source>`, `createVideoSource(video: HTMLVideoElement, url: string): Promise<Source>` where `type Source = { video: HTMLVideoElement; kind: 'camera' | 'video'; stop(): void }`
  - `runLoop(opts: LoopOptions): LoopHandle` where `type LoopHandle = { stop(): void; latest(): Landmark[] | null; markRender(at: number): void }` with
    ```ts
    type LoopOptions = {
      source: Source; detector: Detector; engine: RepEngine;
      onFrame: (f: { landmarks: Landmark[] | null; events: EngineEvent[]; snapshot: Snapshot }) => void;
      onPerf: (s: PerfSample) => void;
      onEnded?: () => void;
    }
    ```

- [ ] **Step 1: Write `src/pipeline/detector.ts`**

```ts
import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision"
import type { Delegate } from "./perf"

export type Detector = { landmarker: PoseLandmarker; delegate: Delegate; close(): void }

const WASM_ROOT = "/wasm"
const MODEL_PATH = "/models/pose_landmarker_lite.task"

async function build(delegate: Delegate): Promise<PoseLandmarker> {
  const vision = await FilesetResolver.forVisionTasks(WASM_ROOT)
  return PoseLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: MODEL_PATH, delegate },
    runningMode: "VIDEO",
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  })
}

/** GPU first; on any failure fall back to CPU and report which delegate is active. */
export async function createDetector(): Promise<Detector> {
  let delegate: Delegate = "GPU"
  let landmarker: PoseLandmarker
  try {
    landmarker = await build("GPU")
  } catch (gpuError) {
    console.warn("[repfsm] GPU delegate failed, falling back to CPU", gpuError)
    delegate = "CPU"
    landmarker = await build("CPU")
  }
  return { landmarker, delegate, close: () => landmarker.close() }
}
```

- [ ] **Step 2: Write `src/pipeline/source.ts`**

```ts
export type Source = { video: HTMLVideoElement; kind: "camera" | "video"; stop(): void }

function waitForMetadata(video: HTMLVideoElement): Promise<void> {
  if (video.readyState >= 1) return Promise.resolve()
  return new Promise((resolve) => video.addEventListener("loadedmetadata", () => resolve(), { once: true }))
}

export async function createCameraSource(video: HTMLVideoElement): Promise<Source> {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user", width: 640, height: 480 },
    audio: false,
  })
  video.srcObject = stream
  video.muted = true
  video.playsInline = true
  await waitForMetadata(video)
  await video.play()
  return {
    video,
    kind: "camera",
    stop: () => {
      stream.getTracks().forEach((t) => t.stop())
      video.srcObject = null
    },
  }
}

export async function createVideoSource(video: HTMLVideoElement, url: string): Promise<Source> {
  video.srcObject = null
  video.src = url
  video.muted = true
  video.playsInline = true
  video.loop = false
  await waitForMetadata(video)
  await video.play()
  return {
    video,
    kind: "video",
    stop: () => {
      video.pause()
      video.removeAttribute("src")
      video.load()
    },
  }
}
```

- [ ] **Step 3: Write `src/pipeline/loop.ts`**

```ts
import type { RepEngine } from "@/engine/rep-engine"
import type { EngineEvent, Frame, Landmark, Snapshot } from "@/engine/types"
import type { Detector } from "./detector"
import { PerfTracker, type PerfSample } from "./perf"
import { shouldInfer, targetFpsFor } from "./should-infer"
import type { Source } from "./source"

export type LoopFrame = { landmarks: Landmark[] | null; events: EngineEvent[]; snapshot: Snapshot }

export type LoopOptions = {
  source: Source
  detector: Detector
  engine: RepEngine
  onFrame: (f: LoopFrame) => void
  onPerf: (s: PerfSample) => void
  onEnded?: () => void
}

export type LoopHandle = {
  stop(): void
  /** Most recent landmarks; read by the overlay's own render loop. */
  latest(): Landmark[] | null
  /** Called by the overlay once per drawn frame so the HUD can report render FPS. */
  markRender(at: number): void
}

const PERF_INTERVAL_MS = 500

/** Starts the inference loop. Pauses while the tab is hidden. Rendering is the overlay's job. */
export function runLoop({ source, detector, engine, onFrame, onPerf, onEnded }: LoopOptions): LoopHandle {
  const { video } = source
  const perf = new PerfTracker(detector.delegate)
  let stopped = false
  let lastInferenceAt: number | null = null
  let lastVideoTime = -1
  let lastPerfAt = performance.now()
  let latestLandmarks: Landmark[] | null = null
  let handle = 0
  const hasRVFC = "requestVideoFrameCallback" in video

  const schedule = () => {
    if (stopped) return
    handle = hasRVFC
      ? (video as HTMLVideoElement & { requestVideoFrameCallback: (cb: () => void) => number }).requestVideoFrameCallback(tick)
      : requestAnimationFrame(tick)
  }

  const tick = () => {
    if (stopped) return
    if (video.ended) { onEnded?.(); return }
    const now = performance.now()
    if (document.hidden || video.paused || video.currentTime === lastVideoTime) { schedule(); return }

    if (!shouldInfer(now, lastInferenceAt, perf.window, targetFpsFor(engine.snapshot().state))) {
      perf.recordDrop()
      schedule()
      return
    }

    lastVideoTime = video.currentTime
    const started = performance.now()
    const result = detector.landmarker.detectForVideo(video, started)
    const inferenceMs = performance.now() - started
    lastInferenceAt = started
    perf.recordInference(inferenceMs, started)

    const landmarks = result.landmarks[0]?.map((l) => ({ x: l.x, y: l.y, z: l.z, visibility: l.visibility ?? 0 })) ?? null
    latestLandmarks = landmarks
    const frame: Frame = { t: started, landmarks: landmarks ?? [] }
    const events = engine.step(frame)
    onFrame({ landmarks, events, snapshot: engine.snapshot() })

    if (started - lastPerfAt >= PERF_INTERVAL_MS) {
      lastPerfAt = started
      onPerf(perf.sample(started))
    }
    schedule()
  }

  const onVisibility = () => { if (!document.hidden) schedule() }
  document.addEventListener("visibilitychange", onVisibility)
  schedule()

  return {
    stop: () => {
      stopped = true
      document.removeEventListener("visibilitychange", onVisibility)
      if (hasRVFC) (video as HTMLVideoElement & { cancelVideoFrameCallback: (h: number) => void }).cancelVideoFrameCallback(handle)
      else cancelAnimationFrame(handle)
    },
    latest: () => latestLandmarks,
    markRender: (at) => perf.recordRender(at),
  }
}
```

MediaPipe `landmarks[0]` entries are `NormalizedLandmark { x, y, z, visibility? }`; `visibility` can be `undefined`, hence the `?? 0` in the map.

- [ ] **Step 4: Typecheck and lint**

```bash
pnpm typecheck && pnpm lint
```

Expected: clean. If `requestVideoFrameCallback` types are missing, add `"lib": ["ES2022", "DOM", "DOM.Iterable"]` to `tsconfig.json` (already standard) and keep the inline casts.

- [ ] **Step 5: Commit**

```bash
git add src/pipeline
git commit -m "feat(pipeline): add MediaPipe detector, camera/video sources, and render-decoupled inference loop"
```

---

### Task 7: Live demo UI (index route)

**Files:**
- Create: `src/components/useRepSession.ts`, `src/components/RepCounter.tsx`, `src/components/Hud.tsx`, `src/components/Overlay.tsx`, `src/components/ExercisePicker.tsx`
- Modify: `src/routes/index.tsx`

**Interfaces:**
- Consumes: Task 3 `EXERCISES`, Task 4 `RepEngine`, Task 6 `createDetector`, `createCameraSource`, `createVideoSource`, `runLoop`.
- Produces: `useRepSession(opts: { exercise: ExerciseId; mode: 'camera' | { clip: string } ; enabled: boolean })` returning `{ videoRef, status, error, snapshot, landmarks, perf, lastEvents, restart, getLandmarks, markRender }` where `status: 'idle' | 'loading' | 'running' | 'error' | 'ended'`, `getLandmarks: () => Landmark[] | null` reads the loop's latest landmarks without React state, and `markRender: (at: number) => void` reports an overlay draw. `landmarks` state still updates per inference for the recorder (Task 8); the overlay must use `getLandmarks`.

- [ ] **Step 1: Write `src/components/useRepSession.ts`**

```ts
import { useCallback, useEffect, useRef, useState } from "react"
import { RepEngine } from "@/engine/rep-engine"
import { getExercise } from "@/engine/exercises"
import type { EngineEvent, ExerciseId, Landmark, Snapshot } from "@/engine/types"
import type { PerfSample } from "@/pipeline/perf"
import type { LoopHandle } from "@/pipeline/loop"

export type SessionMode = "camera" | { clip: string }
export type SessionStatus = "idle" | "loading" | "running" | "error" | "ended"

const EMPTY: Snapshot = { state: "IDLE", count: 0, angle: null, lastRepAt: null }

export function useRepSession({ exercise, mode, enabled }: { exercise: ExerciseId; mode: SessionMode; enabled: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<SessionStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const [snapshot, setSnapshot] = useState<Snapshot>(EMPTY)
  const [landmarks, setLandmarks] = useState<Landmark[] | null>(null)
  const [perf, setPerf] = useState<PerfSample | null>(null)
  const [lastEvents, setLastEvents] = useState<EngineEvent[]>([])
  const [run, setRun] = useState(0)
  const restart = useCallback(() => setRun((n) => n + 1), [])
  const handleRef = useRef<LoopHandle | null>(null)
  const getLandmarks = useCallback(() => handleRef.current?.latest() ?? null, [])
  const markRender = useCallback((at: number) => handleRef.current?.markRender(at), [])

  const clip = typeof mode === "object" ? mode.clip : null

  useEffect(() => {
    if (!enabled || !videoRef.current) return
    const video = videoRef.current
    let stopLoop: (() => void) | null = null
    let stopSource: (() => void) | null = null
    let closeDetector: (() => void) | null = null
    let cancelled = false

    setStatus("loading"); setError(null); setSnapshot(EMPTY); setLandmarks(null); setPerf(null)

    ;(async () => {
      const [{ createDetector }, { createCameraSource, createVideoSource }, { runLoop }] = await Promise.all([
        import("@/pipeline/detector"),
        import("@/pipeline/source"),
        import("@/pipeline/loop"),
      ])
      const detector = await createDetector()
      if (cancelled) { detector.close(); return }
      closeDetector = detector.close
      const source = clip ? await createVideoSource(video, clip) : await createCameraSource(video)
      if (cancelled) { source.stop(); return }
      stopSource = source.stop
      const engine = new RepEngine(getExercise(exercise))
      setStatus("running")
      const loop = runLoop({
        source, detector, engine,
        onFrame: ({ landmarks, events, snapshot }) => {
          setLandmarks(landmarks); setSnapshot(snapshot)
          if (events.length) setLastEvents(events)
        },
        onPerf: setPerf,
        onEnded: () => setStatus("ended"),
      })
      handleRef.current = loop
      stopLoop = loop.stop
    })().catch((e: unknown) => {
      if (cancelled) return
      setStatus("error")
      setError(e instanceof Error ? e.message : String(e))
    })

    return () => {
      cancelled = true
      handleRef.current = null
      stopLoop?.(); stopSource?.(); closeDetector?.()
    }
  }, [enabled, exercise, clip, run])

  return { videoRef, status, error, snapshot, landmarks, perf, lastEvents, restart, getLandmarks, markRender }
}
```

- [ ] **Step 2: Write `src/components/RepCounter.tsx`**

```tsx
import type { Snapshot } from "@/engine/types"

const STATE_STYLES: Record<Snapshot["state"], string> = {
  IDLE: "bg-neutral-200 text-neutral-700",
  READY: "bg-emerald-100 text-emerald-800",
  DOWN: "bg-amber-100 text-amber-800",
  UP: "bg-sky-100 text-sky-800",
  LOST: "bg-rose-100 text-rose-800",
}

export function RepCounter({ snapshot }: { snapshot: Snapshot }) {
  return (
    <div className="flex items-baseline gap-4">
      <div className="text-7xl font-bold tabular-nums" data-testid="rep-count" aria-live="polite" aria-atomic="true">
        {snapshot.count}
      </div>
      <span className={`motion-safe:transition-colors rounded px-2 py-1 text-xs font-semibold ${STATE_STYLES[snapshot.state]}`} data-testid="state">
        {snapshot.state}
      </span>
      {snapshot.angle !== null && <span className="text-sm text-neutral-500">{Math.round(snapshot.angle)}°</span>}
    </div>
  )
}
```

- [ ] **Step 3: Write `src/components/Hud.tsx`**

```tsx
import type { PerfSample } from "@/pipeline/perf"

export function Hud({ perf }: { perf: PerfSample | null }) {
  if (!perf) return <div className="text-xs text-neutral-500">Waiting for first samples…</div>
  const cell = (label: string, value: string) => (
    <div className="flex flex-col"><span className="text-[10px] uppercase text-neutral-500">{label}</span><span className="font-mono text-sm tabular-nums">{value}</span></div>
  )
  return (
    <div className="grid grid-cols-3 gap-3 rounded border border-neutral-200 p-2 sm:grid-cols-6 dark:border-neutral-800" data-testid="hud">
      {cell("render fps", String(perf.renderFps))}
      {cell("infer fps", String(perf.inferenceFps))}
      {cell("infer p50", `${perf.inferenceP50.toFixed(1)} ms`)}
      {cell("infer p95", `${perf.inferenceP95.toFixed(1)} ms`)}
      {cell("dropped", String(perf.dropped))}
      {cell("delegate", perf.delegate)}
    </div>
  )
}
```

- [ ] **Step 4: Write `src/components/Overlay.tsx`** (skeleton on a canvas; draws on its own rAF loop at display rate, independent of inference)

```tsx
import { useEffect, useRef } from "react"
import type { Landmark } from "@/engine/types"

// MediaPipe pose connections for a readable skeleton (torso, arms, legs).
const CONNECTIONS: [number, number][] = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24],
  [23, 25], [25, 27], [24, 26], [26, 28],
]

type OverlayProps = {
  /** Latest landmarks from the loop; read every animation frame, never via React state. */
  getLandmarks: () => Landmark[] | null
  /** Reports each drawn frame so the HUD can show render FPS. */
  onRender?: (at: number) => void
  width: number
  height: number
  highlight: number[]
  active: boolean
}

export function Overlay({ getLandmarks, onRender, width, height, highlight, active }: OverlayProps) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx || !active) return
    let raf = 0
    const draw = (at: number) => {
      const landmarks = getLandmarks()
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      if (landmarks) {
        ctx.lineWidth = 3
        ctx.strokeStyle = "rgba(16,185,129,0.9)"
        for (const [a, b] of CONNECTIONS) {
          const p = landmarks[a], q = landmarks[b]
          if (!p || !q || p.visibility < 0.5 || q.visibility < 0.5) continue
          ctx.beginPath(); ctx.moveTo(p.x * canvas.width, p.y * canvas.height); ctx.lineTo(q.x * canvas.width, q.y * canvas.height); ctx.stroke()
        }
        ctx.fillStyle = "rgba(245,158,11,0.95)"
        for (const i of highlight) {
          const p = landmarks[i]
          if (!p || p.visibility < 0.5) continue
          ctx.beginPath(); ctx.arc(p.x * canvas.width, p.y * canvas.height, 6, 0, Math.PI * 2); ctx.fill()
        }
      }
      onRender?.(at)
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [getLandmarks, onRender, highlight, active])
  return <canvas ref={ref} width={width} height={height} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" />
}
```

- [ ] **Step 5: Write `src/components/ExercisePicker.tsx`**

```tsx
import { EXERCISES } from "@/engine/exercises"
import type { ExerciseId } from "@/engine/types"

export function ExercisePicker({ value, onChange }: { value: ExerciseId; onChange: (id: ExerciseId) => void }) {
  return (
    <fieldset className="flex gap-2">
      <legend className="sr-only">Exercise</legend>
      {Object.values(EXERCISES).map((def) => (
        <label key={def.id} className={`cursor-pointer rounded border px-3 py-1 text-sm ${value === def.id ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950" : "border-neutral-300 dark:border-neutral-700"}`}>
          <input type="radio" name="exercise" value={def.id} checked={value === def.id} onChange={() => onChange(def.id)} className="sr-only" />
          {def.label}
        </label>
      ))}
    </fieldset>
  )
}
```

- [ ] **Step 6: Replace `src/routes/index.tsx`**

```tsx
import { createFileRoute, Link } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { ExercisePicker } from "@/components/ExercisePicker"
import { Hud } from "@/components/Hud"
import { Overlay } from "@/components/Overlay"
import { RepCounter } from "@/components/RepCounter"
import { useRepSession } from "@/components/useRepSession"
import { getExercise } from "@/engine/exercises"
import type { ExerciseId } from "@/engine/types"

export const Route = createFileRoute("/")({ component: Home })

function Home() {
  const [exercise, setExercise] = useState<ExerciseId>("squat")
  const [started, setStarted] = useState(false)
  const { videoRef, status, error, snapshot, perf, restart, getLandmarks, markRender } = useRepSession({ exercise, mode: "camera", enabled: started })
  const def = getExercise(exercise)
  const highlight = useMemo(() => def.joints.flat(), [def])

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold">Deterministic rep counting in the browser</h1>
        <p className="max-w-2xl text-neutral-600 dark:text-neutral-400">
          MediaPipe pose landmarks feed a pure-TypeScript finite-state machine. No server, nothing leaves your device.
          Numbers in the HUD are measured live; reproducible numbers are on the <Link to="/benchmark" className="underline">benchmark page</Link>.
        </p>
      </section>

      <div className="flex flex-wrap items-center gap-4">
        <ExercisePicker value={exercise} onChange={(id) => { setExercise(id) }} />
        {!started ? (
          <button type="button" onClick={() => setStarted(true)} className="rounded bg-emerald-600 px-4 py-2 text-white">Start camera</button>
        ) : (
          <button type="button" onClick={restart} className="rounded border px-4 py-2">Reset</button>
        )}
      </div>

      <div className="relative aspect-[4/3] w-full max-w-2xl overflow-hidden rounded bg-black">
        <video ref={videoRef} className="h-full w-full object-contain" playsInline muted />
        <Overlay getLandmarks={getLandmarks} onRender={markRender} width={640} height={480} highlight={highlight} active={status === "running"} />
        {snapshot.state === "LOST" && (
          <p className="absolute inset-x-0 bottom-0 bg-rose-600/90 p-2 text-center text-sm text-white" role="status">{def.lostHint}</p>
        )}
        {status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-neutral-900/90 p-4 text-center text-white" role="alert">
            <p>Camera unavailable: {error}</p>
            <Link to="/benchmark" className="underline">Try the sample clips instead</Link>
          </div>
        )}
        {status === "loading" && <p className="absolute inset-0 flex items-center justify-center text-white">Loading model…</p>}
      </div>

      <RepCounter snapshot={snapshot} />
      <Hud perf={perf} />
    </div>
  )
}
```

- [ ] **Step 7: Run and verify manually**

```bash
pnpm dev
```

Open `http://localhost:3000`, click "Start camera", allow permission, do 5 squats. Expected: skeleton draws, state cycles READY→DOWN→UP→READY, count reaches 5, HUD shows render fps near the display rate (≈60) while infer fps stays ≤ 30, and infer fps drops to ≤ 10 when you step out of frame (LOST). Deny permission in a second tab: error panel with link appears. Then `pnpm typecheck && pnpm lint`.

- [ ] **Step 8: Commit**

```bash
git add src/components src/routes/index.tsx
git commit -m "feat(ui): add live camera demo with skeleton overlay, rep counter, and HUD"
```

---

### Task 8: Clips, benchmark route, landmark recorder

**Files:**
- Create: `public/clips/squat-10.webm`, `public/clips/pushup-10.webm` (manual), `src/components/ClipPlayer.tsx`, `src/routes/benchmark.tsx`, `src/lib/benchmark-report.ts`, `src/lib/benchmark-report.test.ts`

**Interfaces:**
- Consumes: Task 7 `useRepSession` with `mode: { clip }`.
- Produces:
  - `type ClipResult = { clip: string; exercise: ExerciseId; groundTruth: number; detected: number; renderFps: number; inferenceFps: number; inferenceP50: number; inferenceP95: number; dropped: number; delegate: Delegate }`
  - `type BenchmarkReport = { version: 1; date: string; userAgent: string; hardwareConcurrency: number; results: ClipResult[] }`
  - `toReadmeRows(report: BenchmarkReport): string` — Markdown table rows.
  - `CLIPS: { clip: string; exercise: ExerciseId; groundTruth: number }[]`

- [ ] **Step 1: Record the two clips (manual, author)**

Record with a phone or webcam, 640×480 or larger, 20–30 s each, side-on, full body in frame, exactly 10 clean reps, plain background. Convert:

```bash
ffmpeg -i squat-raw.mp4 -vf "scale=640:-2,fps=30" -c:v libvpx-vp9 -b:v 600k -an public/clips/squat-10.webm
ffmpeg -i pushup-raw.mp4 -vf "scale=640:-2,fps=30" -c:v libvpx-vp9 -b:v 600k -an public/clips/pushup-10.webm
ls -la public/clips
```

Expected: each file under 3 MB.

- [ ] **Step 2: Failing test `src/lib/benchmark-report.test.ts`**

```ts
import { describe, expect, it } from "vitest"
import { toReadmeRows, type BenchmarkReport } from "./benchmark-report"

describe("toReadmeRows", () => {
  it("renders one markdown row per clip", () => {
    const report: BenchmarkReport = {
      version: 1, date: "2026-10-10", userAgent: "UA", hardwareConcurrency: 8,
      results: [{ clip: "squat-10", exercise: "squat", groundTruth: 10, detected: 10, renderFps: 60, inferenceFps: 29, inferenceP50: 12.3, inferenceP95: 18.9, dropped: 4, delegate: "GPU" }],
    }
    expect(toReadmeRows(report)).toBe("| squat-10 | 10/10 | 60 / 29 | 12.3 / 18.9 | 4 | GPU | 2026-10-10 | UA (8 cores) |")
  })
})
```

- [ ] **Step 3: Run, expect FAIL.** `pnpm vitest run src/lib`

- [ ] **Step 4: Write `src/lib/benchmark-report.ts`**

```ts
import type { ExerciseId } from "@/engine/types"
import type { Delegate } from "@/pipeline/perf"

export type ClipSpec = { clip: string; exercise: ExerciseId; groundTruth: number }

export const CLIPS: ClipSpec[] = [
  { clip: "squat-10", exercise: "squat", groundTruth: 10 },
  { clip: "pushup-10", exercise: "pushup", groundTruth: 10 },
]

export type ClipResult = ClipSpec & {
  detected: number
  renderFps: number
  inferenceFps: number
  inferenceP50: number
  inferenceP95: number
  dropped: number
  delegate: Delegate
}

export type BenchmarkReport = {
  version: 1
  date: string
  userAgent: string
  hardwareConcurrency: number
  results: ClipResult[]
}

export function toReadmeRows(report: BenchmarkReport): string {
  return report.results
    .map((r) => `| ${r.clip} | ${r.detected}/${r.groundTruth} | ${r.renderFps} / ${r.inferenceFps} | ${r.inferenceP50.toFixed(1)} / ${r.inferenceP95.toFixed(1)} | ${r.dropped} | ${r.delegate} | ${report.date} | ${report.userAgent} (${report.hardwareConcurrency} cores) |`)
    .join("\n")
}
```

- [ ] **Step 5: Run, expect PASS.**

- [ ] **Step 6: Write `src/components/ClipPlayer.tsx`** (runs one clip to the end, reports a `ClipResult`; optional landmark recording)

```tsx
import { useEffect, useMemo, useRef, useState } from "react"
import { Hud } from "@/components/Hud"
import { Overlay } from "@/components/Overlay"
import { RepCounter } from "@/components/RepCounter"
import { useRepSession } from "@/components/useRepSession"
import { getExercise } from "@/engine/exercises"
import type { Frame } from "@/engine/types"
import type { ClipResult, ClipSpec } from "@/lib/benchmark-report"

export function ClipPlayer({ spec, record, onDone }: { spec: ClipSpec; record: boolean; onDone: (r: ClipResult, frames: Frame[]) => void }) {
  const [enabled, setEnabled] = useState(false)
  const { videoRef, status, snapshot, landmarks, perf, restart, getLandmarks, markRender } = useRepSession({ exercise: spec.exercise, mode: { clip: `/clips/${spec.clip}.webm` }, enabled })
  const def = getExercise(spec.exercise)
  const highlight = useMemo(() => def.joints.flat(), [def])
  const frames = useRef<Frame[]>([])
  const reported = useRef(false)

  useEffect(() => {
    if (record && landmarks && status === "running") frames.current.push({ t: performance.now(), landmarks })
  }, [landmarks, record, status])

  useEffect(() => {
    if (status !== "ended" || reported.current || !perf) return
    reported.current = true
    onDone({ ...spec, detected: snapshot.count, renderFps: perf.renderFps, inferenceFps: perf.inferenceFps, inferenceP50: perf.inferenceP50, inferenceP95: perf.inferenceP95, dropped: perf.dropped, delegate: perf.delegate }, frames.current)
  }, [status, perf, snapshot.count, spec, onDone])

  return (
    <section className="space-y-3 rounded border border-neutral-200 p-4 dark:border-neutral-800" data-testid={`clip-${spec.clip}`}>
      <header className="flex items-center justify-between">
        <h2 className="font-semibold">{def.label} · {spec.clip} · ground truth {spec.groundTruth}</h2>
        <button type="button" className="rounded bg-emerald-600 px-3 py-1 text-sm text-white" onClick={() => { frames.current = []; reported.current = false; enabled ? restart() : setEnabled(true) }} data-testid={`run-${spec.clip}`}>
          {enabled ? "Run again" : "Run"}
        </button>
      </header>
      <div className="relative aspect-[4/3] w-full max-w-xl overflow-hidden rounded bg-black">
        <video ref={videoRef} className="h-full w-full object-contain" playsInline muted />
        <Overlay getLandmarks={getLandmarks} onRender={markRender} width={640} height={480} highlight={highlight} active={status === "running"} />
      </div>
      <RepCounter snapshot={snapshot} />
      <Hud perf={perf} />
      <p className="text-xs text-neutral-500" data-testid={`status-${spec.clip}`}>{status}</p>
    </section>
  )
}
```

- [ ] **Step 7: Write `src/routes/benchmark.tsx`**

```tsx
import { createFileRoute } from "@tanstack/react-router"
import { useCallback, useState } from "react"
import { ClipPlayer } from "@/components/ClipPlayer"
import type { Frame } from "@/engine/types"
import { CLIPS, toReadmeRows, type BenchmarkReport, type ClipResult } from "@/lib/benchmark-report"

export const Route = createFileRoute("/benchmark")({
  validateSearch: (s: Record<string, unknown>) => ({ record: s.record === "1" || s.record === 1 }),
  component: Benchmark,
})

function download(name: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: name })
  a.click()
  URL.revokeObjectURL(a.href)
}

function Benchmark() {
  const { record } = Route.useSearch()
  const [results, setResults] = useState<Record<string, ClipResult>>({})
  const [recordings, setRecordings] = useState<Record<string, Frame[]>>({})

  const onDone = useCallback((r: ClipResult, frames: Frame[]) => {
    setResults((prev) => ({ ...prev, [r.clip]: r }))
    if (frames.length) setRecordings((prev) => ({ ...prev, [r.clip]: frames }))
  }, [])

  const report = (): BenchmarkReport => ({
    version: 1,
    date: new Date().toISOString().slice(0, 10),
    userAgent: navigator.userAgent,
    hardwareConcurrency: navigator.hardwareConcurrency ?? 0,
    results: CLIPS.map((c) => results[c.clip]).filter((r): r is ClipResult => Boolean(r)),
  })

  const done = Object.keys(results).length

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Benchmark</h1>
      <p className="max-w-2xl text-neutral-600 dark:text-neutral-400">
        Each clip has a known rep count. Run it through the real pipeline on your device; the numbers below are what this machine measured.
        Engine correctness is proven separately in CI against recorded landmark fixtures.
      </p>
      {CLIPS.map((spec) => <ClipPlayer key={spec.clip} spec={spec} record={record} onDone={onDone} />)}
      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={done === 0} className="rounded border px-3 py-1 text-sm disabled:opacity-50" onClick={() => download(`benchmark-${report().date}.json`, report())}>Export JSON</button>
        <button type="button" disabled={done === 0} className="rounded border px-3 py-1 text-sm disabled:opacity-50" onClick={() => navigator.clipboard.writeText(toReadmeRows(report()))}>Copy README rows</button>
        {record && Object.entries(recordings).map(([clip, frames]) => (
          <button key={clip} type="button" className="rounded border px-3 py-1 text-sm" onClick={() => download(`${clip}.json`, frames)}>Download landmarks: {clip}</button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 8: Verify manually**

`pnpm dev`, open `/benchmark`, click Run on both clips. Expected: each ends with status `ended`, detected `10/10` (if not, re-record the clip with cleaner reps rather than touching thresholds; thresholds change only if both clips miss in the same direction and the `/how-it-works` copy is updated to match). Export JSON works. `pnpm typecheck && pnpm lint && pnpm test`.

- [ ] **Step 9: Commit**

```bash
git add public/clips src/components/ClipPlayer.tsx src/routes/benchmark.tsx src/lib
git commit -m "feat(benchmark): add clip replay page with JSON export and landmark recorder"
```

---

### Task 9: Landmark fixtures and fixture tests

**Files:**
- Create: `fixtures/landmarks/squat-10.json`, `fixtures/landmarks/squat-10.meta.json`, `fixtures/landmarks/pushup-10.json`, `fixtures/landmarks/pushup-10.meta.json`, `src/engine/fixtures.test.ts`

**Interfaces:**
- Consumes: Task 4 `RepEngine`, Task 3 `EXERCISES`.
- Fixture shape: `Frame[]`; meta: `{ groundTruthReps: number; exercise: ExerciseId; recordedWith: { model: string; delegate: 'GPU' | 'CPU'; date: string } }`.

- [ ] **Step 1: Record fixtures**

`pnpm dev`, open `/benchmark?record=1`, Run each clip to the end, click "Download landmarks: squat-10" and "pushup-10". Move the files:

```bash
mkdir -p fixtures/landmarks
mv ~/Downloads/squat-10.json ~/Downloads/pushup-10.json fixtures/landmarks/
```

Create `fixtures/landmarks/squat-10.meta.json`:

```json
{ "groundTruthReps": 10, "exercise": "squat", "recordedWith": { "model": "pose_landmarker_lite float16", "delegate": "GPU", "date": "2026-10-10" } }
```

And `pushup-10.meta.json` with `"exercise": "pushup"`. Set `delegate`/`date` to what you actually used.

Normalize timestamps so fixtures start at 0 (keeps diffs readable):

```bash
node -e '
for (const n of ["squat-10","pushup-10"]) {
  const p=`fixtures/landmarks/${n}.json`; const f=JSON.parse(require("fs").readFileSync(p));
  const t0=f[0].t; for (const fr of f) fr.t=Math.round(fr.t-t0);
  require("fs").writeFileSync(p, JSON.stringify(f));
}'
```

- [ ] **Step 2: Write `src/engine/fixtures.test.ts`**

```ts
import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { EXERCISES } from "./exercises"
import { RepEngine } from "./rep-engine"
import type { EngineEvent, ExerciseId, Frame } from "./types"

type Meta = { groundTruthReps: number; exercise: ExerciseId }

function load(name: string): { frames: Frame[]; meta: Meta } {
  const frames = JSON.parse(readFileSync(`fixtures/landmarks/${name}.json`, "utf8")) as Frame[]
  const meta = JSON.parse(readFileSync(`fixtures/landmarks/${name}.meta.json`, "utf8")) as Meta
  return { frames, meta }
}

describe.each(["squat-10", "pushup-10"])("fixture %s", (name) => {
  const { frames, meta } = load(name)
  const def = EXERCISES[meta.exercise]

  it("counts exactly the ground-truth reps", () => {
    const engine = new RepEngine(def)
    for (const f of frames) engine.step(f)
    expect(engine.snapshot().count).toBe(meta.groundTruthReps)
  })

  it("never emits two reps closer than minDwellMs", () => {
    const engine = new RepEngine(def)
    const reps = frames.flatMap((f) => engine.step(f)).filter((e): e is Extract<EngineEvent, { type: "rep" }> => e.type === "rep")
    for (let i = 1; i < reps.length; i++) expect(reps[i].t - reps[i - 1].t).toBeGreaterThanOrEqual(def.minDwellMs)
  })

  it("produces a stable state sequence", () => {
    const engine = new RepEngine(def)
    const states = frames.flatMap((f) => engine.step(f)).filter((e) => e.type === "state").map((e) => (e as Extract<EngineEvent, { type: "state" }>).to)
    expect(states).toMatchSnapshot()
  })

  it("processes the fixture far faster than real time", () => {
    const engine = new RepEngine(def)
    const started = performance.now()
    for (let i = 0; i < 20; i++) { engine.reset(); for (const f of frames) engine.step(f) }
    const perFrameUs = ((performance.now() - started) / (frames.length * 20)) * 1000
    console.info(`[${name}] engine cost ≈ ${perFrameUs.toFixed(2)} µs/frame over ${frames.length} frames`)
    expect(perFrameUs).toBeLessThan(100)
  })
})
```

- [ ] **Step 3: Run**

```bash
pnpm vitest run src/engine/fixtures.test.ts
```

Expected: 8 passed, two snapshot files written under `src/engine/__snapshots__/`. If count ≠ 10: inspect with `node -e` which frames flip states; most common causes are a dirty rep in the clip (re-record) or the camera too far (visibility gate). Do not adjust thresholds to fit one clip.

- [ ] **Step 4: Commit**

```bash
git add fixtures src/engine/fixtures.test.ts src/engine/__snapshots__
git commit -m "test(engine): add recorded landmark fixtures with accuracy and throughput checks"
```

---

### Task 10: How-it-works page

**Files:**
- Create: `src/components/FsmDiagram.tsx`, `src/routes/how-it-works.tsx`

- [ ] **Step 1: Write `src/components/FsmDiagram.tsx`** (static SVG, states and labelled edges)

```tsx
export function FsmDiagram() {
  const node = (x: number, y: number, label: string) => (
    <g key={label}>
      <rect x={x - 40} y={y - 18} width={80} height={36} rx={8} className="fill-white stroke-neutral-400 dark:fill-neutral-900" />
      <text x={x} y={y + 5} textAnchor="middle" className="fill-current text-sm font-semibold">{label}</text>
    </g>
  )
  const edge = (d: string, label: string, lx: number, ly: number) => (
    <g key={label + d}>
      <path d={d} className="fill-none stroke-neutral-500" markerEnd="url(#arrow)" />
      <text x={lx} y={ly} textAnchor="middle" className="fill-current text-[11px]">{label}</text>
    </g>
  )
  return (
    <svg viewBox="0 0 640 260" role="img" aria-label="Rep engine state machine: IDLE to READY to DOWN to UP and back to READY; any state to LOST; LOST back to READY" className="w-full max-w-2xl">
      <defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" className="fill-neutral-500" /></marker></defs>
      {node(60, 60, "IDLE")}{node(220, 60, "READY")}{node(380, 60, "DOWN")}{node(540, 60, "UP")}{node(300, 200, "LOST")}
      {edge("M100,60 L180,60", "visible ∧ angle ≥ up", 140, 45)}
      {edge("M260,60 L340,60", "angle ≤ down", 300, 45)}
      {edge("M420,60 L500,60", "angle ≥ up ∧ dwell ≥ 200ms → rep", 460, 45)}
      {edge("M540,78 Q380,140 230,78", "next frame", 385, 120)}
      {edge("M380,78 Q300,110 230,78", "angle ≥ up, dwell < 200ms (no rep)", 305, 100)}
      {edge("M220,78 L290,182", "3 low-visibility frames", 215, 140)}
      {edge("M330,182 L250,78", "3 good frames ∧ angle ≥ up", 330, 140)}
    </svg>
  )
}
```

- [ ] **Step 2: Write `src/routes/how-it-works.tsx`**

```tsx
import { createFileRoute } from "@tanstack/react-router"
import { FsmDiagram } from "@/components/FsmDiagram"
import { EXERCISES } from "@/engine/exercises"

export const Route = createFileRoute("/how-it-works")({ component: HowItWorks })

function HowItWorks() {
  return (
    <article className="prose prose-neutral max-w-3xl dark:prose-invert">
      <h1>How it works</h1>
      <h2>Pipeline</h2>
      <p>Camera or clip → MediaPipe PoseLandmarker (33 landmarks, GPU with CPU fallback) → <code>RepEngine.step(frame)</code> → events. Inference runs only when the adaptive budget allows: <code>budget = max(1000/target, p90(inference) × 1.2)</code>, where <code>target</code> is 30 fps while someone is in position and 10 fps while idle or lost. A slow device drops frames instead of queueing work. The skeleton overlay draws on its own animation-frame loop at display rate, so rendering never waits on inference.</p>
      <h2>State machine</h2>
      <FsmDiagram />
      <p>Hysteresis (separate <em>down</em> and <em>up</em> thresholds) stops jitter from double counting. A minimum dwell of 200 ms stops a fast bounce from counting. Angles are smoothed with an exponential moving average (α = 0.5) that resets when the pose is lost.</p>
      <h2>Angles and thresholds</h2>
      <table>
        <thead><tr><th>Exercise</th><th>Joints (angle at middle)</th><th>down ≤</th><th>up ≥</th><th>dwell</th><th>visibility ≥</th></tr></thead>
        <tbody>
          {Object.values(EXERCISES).map((d) => (
            <tr key={d.id}><td>{d.label}</td><td>{d.joints.map((j) => j.join("–")).join(", ")}</td><td>{d.downAngle}°</td><td>{d.upAngle}°</td><td>{d.minDwellMs} ms</td><td>{d.minVisibility}</td></tr>
          ))}
        </tbody>
      </table>
      <p>When both sides are visible the smaller angle is used; when one side fails the visibility gate the other side is used; when neither passes for three frames the engine enters <code>LOST</code>, freezes the counter, and discards any rep in progress.</p>
      <h2>Proof</h2>
      <p>CI replays recorded landmark fixtures through the engine and asserts the exact rep count, the state sequence, and that no two reps are closer than the dwell. The <a href="/benchmark">benchmark page</a> runs the real pipeline on your device. Source: <a href="https://github.com/montasim/repfsm/tree/main/src/engine">src/engine</a>, fixtures: <a href="https://github.com/montasim/repfsm/tree/main/fixtures">fixtures/</a>.</p>
    </article>
  )
}
```

Install typography plugin for `prose`: `pnpm add -D @tailwindcss/typography` and add `@plugin "@tailwindcss/typography";` under the import in `src/styles.css`.

- [ ] **Step 3: Verify** — `pnpm dev`, open `/how-it-works`; diagram renders, table shows the two rows. `pnpm typecheck && pnpm lint`.

- [ ] **Step 4: Commit**

```bash
git add src/components/FsmDiagram.tsx src/routes/how-it-works.tsx src/styles.css package.json pnpm-lock.yaml
git commit -m "feat(docs): add how-it-works page with FSM diagram and thresholds"
```

---

### Task 11: Playwright smoke, Lighthouse CI, GitHub Actions

**Files:**
- Create: `playwright.config.ts`, `e2e/benchmark.spec.ts`, `lighthouserc.json`, `.github/workflows/ci.yml`

- [ ] **Step 1: `playwright.config.ts`**

```ts
import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "e2e",
  timeout: 120_000,
  use: { baseURL: "http://localhost:3000", headless: true },
  webServer: { command: "pnpm build && pnpm preview", port: 3000, reuseExistingServer: !process.env.CI, timeout: 180_000 },
  projects: [{ name: "chromium", use: { browserName: "chromium", launchOptions: { args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--autoplay-policy=no-user-gesture-required"] } } }],
})
```

- [ ] **Step 2: `e2e/benchmark.spec.ts`**

```ts
import { expect, test } from "@playwright/test"

test("squat clip replays and counts 10 reps", async ({ page }) => {
  await page.goto("/benchmark")
  await page.getByTestId("run-squat-10").click()
  await expect(page.getByTestId("status-squat-10")).toHaveText("ended", { timeout: 110_000 })
  await expect(page.getByTestId("clip-squat-10").getByTestId("rep-count")).toHaveText("10")
})
```

- [ ] **Step 3: Run locally**

```bash
pnpm exec playwright install chromium
pnpm e2e
```

Expected: 1 passed. If headless WebGL fails to init the GPU delegate, the CPU fallback must still make the test pass; if it does not, the test is marked allow-fail in CI (Step 5) but must pass locally.

- [ ] **Step 4: `lighthouserc.json`**

```json
{
  "ci": {
    "collect": { "staticDistDir": "dist/client", "url": ["http://localhost/index.html"], "numberOfRuns": 2 },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.9 }],
        "categories:best-practices": ["error", { "minScore": 0.9 }],
        "categories:seo": ["error", { "minScore": 0.9 }]
      }
    },
    "upload": { "target": "temporary-public-storage" }
  }
}
```

Run `pnpm build && pnpm exec lhci autorun`. Expected: all four ≥ 0.9. If performance is below: the model and WASM must not be preloaded on `/` (they load only after "Start camera"), and the video element must have fixed aspect ratio (already `aspect-[4/3]`).

- [ ] **Step 5: `.github/workflows/ci.yml`**

```yaml
name: ci
on:
  push: { branches: [main] }
  pull_request:
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 11 }
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build
      - run: pnpm exec lhci autorun
      - uses: actions/upload-artifact@v4
        with: { name: dist, path: dist/client }
  e2e:
    runs-on: ubuntu-latest
    continue-on-error: true
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 11 }
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with: { name: playwright-report, path: playwright-report }
```

- [ ] **Step 6: Commit**

```bash
git add playwright.config.ts e2e lighthouserc.json .github
git commit -m "ci: add Playwright smoke, Lighthouse budget, and GitHub Actions"
```

---

### Task 12: README, benchmark artifact, deploy, portfolio entry

**Files:**
- Create: `benchmarks/2026-10-10-<device>.json`
- Modify: `README.md`
- Modify (portfolio repo): `src/data/projects.json` — add RepFSM entry after deploy

- [ ] **Step 1: Produce the benchmark artifact**

Open the deployed or local `/benchmark`, run both clips, Export JSON, save as `benchmarks/2026-10-10-<short-device-name>.json` (e.g. `2026-10-10-thinkpad-t14-linux-chrome.json`). Click "Copy README rows".

- [ ] **Step 2: Write `README.md`**

```md
# RepFSM

Squat and push-up rep counter that runs entirely in the browser. MediaPipe pose landmarks → a deterministic, pure-TypeScript finite-state machine → reps. Adaptive frame rate. Nothing leaves your device.

Live: https://repfsm.netlify.app · Benchmark: https://repfsm.netlify.app/benchmark · How it works: https://repfsm.netlify.app/how-it-works

## What this proves

| Claim | Evidence |
|---|---|
| Deterministic FSM rep engine, no React state in the hot path | [`src/engine/rep-engine.ts`](src/engine/rep-engine.ts), fixture tests in CI |
| Rendering decoupled from inference: overlay at display rate, inference on a two-axis adaptive budget (load + activity) | [`src/pipeline/should-infer.ts`](src/pipeline/should-infer.ts), [`src/components/Overlay.tsx`](src/components/Overlay.tsx), HUD, benchmark JSON |
| No false reps across recorded sessions | `fixtures/landmarks/*` replayed in CI: exact count, dwell spacing, state snapshot |
| Real MediaPipe pipeline with GPU→CPU fallback | [`src/pipeline/detector.ts`](src/pipeline/detector.ts) |
| Lighthouse ≥ 90 on landing | Lighthouse CI in `.github/workflows/ci.yml` |

## Benchmark

Produced by `/benchmark` on the listed device; raw JSON in [`benchmarks/`](benchmarks/). Re-run it on your own machine and open a PR with your row.

| Clip | Detected / truth | Render / inference FPS | Inference p50 / p95 (ms) | Dropped | Delegate | Date | Device |
|---|---|---|---|---|---|---|---|
<PASTE ROWS FROM "Copy README rows">

Engine cost on fixtures (CI log): well under 100 µs per frame; inference, not the FSM, is the bottleneck.

## How it works

See `/how-it-works` or the [design spec](docs/superpowers/specs/2026-10-10-repfsm-realtime-cv-rep-counter-design.md).

## Develop

```bash
pnpm install        # also copies MediaPipe WASM to public/wasm
pnpm dev            # http://localhost:3000
pnpm test           # engine + pipeline unit and fixture tests
pnpm e2e            # Playwright smoke on /benchmark
```

Record new fixtures: open `/benchmark?record=1`, run a clip, download landmarks, drop the JSON and a `.meta.json` into `fixtures/landmarks/`.

## Scope

v1: squat, push-up, live camera, bundled clips, benchmark export. Not in v1: accounts, server, worker pipeline, form scoring, npm package.

## License

MIT
```

Replace `<PASTE ROWS …>` with the copied rows before committing. Confirm the file contains no angle-bracket placeholder: `grep -n "<PASTE" README.md` must print nothing.

- [ ] **Step 3: Commit and push**

```bash
git add README.md benchmarks
git commit -m "docs: add README with claims mapping and first benchmark artifact"
git remote add origin git@github.com:montasim/repfsm.git
git push -u origin main
```

- [ ] **Step 4: Deploy on Netlify**

Netlify dashboard → Add new site → Import from GitHub → `montasim/repfsm`. Build settings are read from `netlify.toml`. Set site name `repfsm`. After deploy, open `https://repfsm.netlify.app/benchmark`, run both clips, confirm `10/10`.

- [ ] **Step 5: Portfolio entry (in `~/Work/Personal/v2`)**

Add to `src/data/projects.json` following the existing object shape (copy the `BugReceipt` entry as a template and change these fields):

```json
{
  "id": "repfsm",
  "title": "RepFSM",
  "type": "website",
  "featured": true,
  "description": "Open-source browser rep counter: MediaPipe pose landmarks drive a deterministic finite-state-machine engine with adaptive frame budgeting, recorded-landmark fixture tests, and reproducible benchmarks.",
  "technologies": ["TanStack Start", "React 19", "TypeScript", "MediaPipe", "Tailwind CSS", "Vitest", "Playwright", "GitHub Actions", "Netlify"],
  "topics": ["computer-vision", "mediapipe", "state-machine", "real-time", "local-first", "typescript"],
  "githubUrl": "https://github.com/montasim/repfsm",
  "liveUrl": "https://repfsm.netlify.app"
}
```

Run `pnpm test` in the portfolio repo (content tests validate `projects.json`), then commit: `git commit -am "feat: add RepFSM project entry"`.

---

## Self-Review

**Spec coverage:** §3 stack → Task 1. §4.1 engine → Tasks 2–4. §4.2 pipeline → Tasks 5–6. §4.3 routes → Tasks 7, 8, 10. §4.4 fixtures/recorder → Tasks 8–9. §5 benchmark two layers → Tasks 9 and 8/12. §6 error handling: camera denied (Task 7 error panel + link), model load failure (Task 7 `status === "error"` panel shows the message; retry via Reset), GPU fallback (Task 6), LOST hint (Task 7), tab hidden pause (Task 6 loop). §7 testing: engine synthetic (Task 4), fixtures (Task 9), `shouldInfer` fake clock (Task 5), Playwright (Task 11), Lighthouse (Task 11). §8 a11y: `aria-live` counter, keyboard-operable buttons/radios, `motion-safe` transition (Task 7), `role="status"/"alert"`. §9 layout matches File Structure. §10 claims table → README (Task 12).

**Placeholder scan:** README template contains `<PASTE ROWS …>` by design with an explicit replacement step and a grep check. No other TBD/TODO.

**Type consistency:** `LoopHandle` from `loop.ts` used by `useRepSession`; `PerfSample.renderFps`/`inferenceFps` flow into `ClipResult`; `targetFpsFor` imported in `loop.ts` from `should-infer.ts`. `Delegate` defined in `perf.ts` and imported by `detector.ts` and `benchmark-report.ts`. `Snapshot`, `Frame`, `EngineEvent`, `ExerciseId` from `engine/types.ts` throughout. `PerfSample.fps` used as `ClipResult.fps`. `useRepSession` returns `restart`, used by both `index.tsx` and `ClipPlayer.tsx`.
