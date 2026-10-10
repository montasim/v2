# Repstate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy Repstate, an open-source browser app that counts squat and push-up reps from a live camera or bundled clip with a deterministic FSM engine on MediaPipe pose landmarks, with reproducible benchmark numbers.

**Architecture:** Feature-first, layered by dependency direction (`ui → application → domain`, `infrastructure` implements `application` ports). `domain` is pure TypeScript with no browser, React, or MediaPipe imports. `application` holds use-cases (the inference session, the adaptive budget, perf tracking) against small port interfaces so they are unit-testable with fakes. `infrastructure` adapts MediaPipe, camera/video elements, and the browser frame scheduler to those ports. `ui` is React with shadcn/ui components and Hugeicons. CI proves engine correctness with recorded landmark fixtures; the in-app `/benchmark` page proves live render/inference FPS and accuracy on real devices.

**Tech Stack:** TanStack Start (file routes, static prerender), React 19, TypeScript (strict), Tailwind CSS 4, shadcn/ui (`radix-nova` style), Hugeicons (`@hugeicons/react` + `@hugeicons/core-free-icons`), `@mediapipe/tasks-vision`, Vitest, Playwright, Lighthouse CI, Netlify, pnpm.

Spec: `docs/superpowers/specs/2026-10-10-repstate-realtime-cv-rep-counter-design.md` (copied into the new repo in Task 1).

## Global Constraints

- New standalone repository `repstate` at `~/Work/Personal/repstate`. Name: Repstate.
- Layer rule, enforced by ESLint `no-restricted-imports` (Task 2): `domain/**` imports nothing outside `domain/`; `application/**` imports only `domain/` and its own `ports.ts`; `infrastructure/**` may import `@mediapipe/*` and DOM; `ui/**` and `routes/**` may import anything. Nothing below `ui` imports React.
- Engine is deterministic: same `Frame[]` → same `EngineEvent[]`. No `Date.now()`, timers, or randomness in `domain/`.
- Every public function/class in `domain/` and `application/` has a one-line JSDoc. No `any`. Discriminated unions for events and statuses. No magic numbers: every threshold lives in a named constant or an `ExerciseDef`.
- If shadcn/ui has a component for an element (button, badge, card, alert, toggle group, table, separator, toast), use it. Raw `<button>`, `<table>`, `<fieldset>` are not allowed in `ui/` or `routes/`. Icons only via `@/components/ui/icons` (Hugeicons wrapper); no inline SVG icons.
- MediaPipe model and WASM served from `public/` (no CDN fetch at runtime).
- Exercises v1: `squat` (hip–knee–ankle: 23/24, 25/26, 27/28), `pushup` (shoulder–elbow–wrist: 11/12, 13/14, 15/16). Thresholds: squat `downAngle 100`, `upAngle 160`; push-up `downAngle 90`, `upAngle 155`; both `minDwellMs 200`, `minVisibility 0.6`. EMA alpha `0.5`. LOST after 3 consecutive low-visibility frames; recovery after 3 consecutive good frames.
- Adaptive inference budget: `budgetMs = max(1000/targetFps, p90(inferenceMs) * 1.2)` over a rolling window of 30 samples; `targetFps` is 30 for `READY`/`DOWN`/`UP`, 10 for `IDLE`/`LOST`.
- Overlay rendering runs on its own `requestAnimationFrame` loop reading latest landmarks from the session; it never waits on inference. HUD shows `renderFps` and `inferenceFps` separately.
- TanStack Start practice: every route exports `Route = createFileRoute(...)` with `head()` meta; root uses `shellComponent`, `errorComponent`, `notFoundComponent`; search params validated in `validateSearch`; heavy browser-only modules are dynamically imported inside effects so prerendering never touches them; all routes prerendered.
- Written from scratch for public release: no code, constants, identifiers, or file layouts from any employer or client codebase (spec §12).
- Commit messages: Conventional Commits.

---

## File Structure

```
repstate/
  .github/workflows/ci.yml                         Task 12
  .nvmrc, LICENSE (MIT), README.md, netlify.toml  Task 1 (README final in Task 13)
  components.json, vite.config.ts, vitest.config.ts, playwright.config.ts, lighthouserc.json, eslint.config.js
  scripts/copy-wasm.mjs                            Task 1
  public/models/pose_landmarker_lite.task          Task 1
  public/wasm/*  (gitignored, copied on install)   Task 1
  public/clips/squat-10.webm, pushup-10.webm       Task 9 (manual)
  fixtures/landmarks/*.json, *.meta.json           Task 10
  benchmarks/*.json                                Task 13
  src/styles.css                                   Task 1
  src/lib/utils.ts (cn), src/lib/site.ts           Task 1
  src/components/ui/*  (shadcn)                    Task 1
  src/components/ui/icons.tsx                      Task 1  Hugeicons wrapper
  src/components/layout/site-header.tsx            Task 1
  src/routes/__root.tsx                            Task 1
  src/routes/index.tsx                             Task 8
  src/routes/benchmark.tsx                         Task 9
  src/routes/how-it-works.tsx                      Task 11

  src/features/rep-counter/
    domain/types.ts                                Task 2
    domain/angles.ts (+ .test.ts)                  Task 2
    domain/exercises.ts (+ .test.ts)               Task 3
    domain/rep-engine.ts (+ .test.ts)              Task 4
    domain/fixtures.test.ts                        Task 10
    application/ports.ts                           Task 5  PoseDetector, FrameSource, FrameScheduler
    application/rolling-window.ts (+ .test.ts)     Task 5
    application/inference-budget.ts (+ .test.ts)   Task 5
    application/perf-tracker.ts (+ .test.ts)       Task 5
    application/rep-session.ts (+ .test.ts)        Task 6  use-case: drives detector → engine
    infrastructure/mediapipe-pose-detector.ts      Task 7
    infrastructure/camera-source.ts                Task 7
    infrastructure/video-source.ts                 Task 7
    infrastructure/browser-frame-scheduler.ts      Task 7
    infrastructure/create-session.ts               Task 7  composition root (wires infra into RepSession)
    ui/use-rep-session.ts                          Task 8
    ui/rep-counter.tsx                             Task 8
    ui/perf-hud.tsx                                Task 8
    ui/skeleton-overlay.tsx                        Task 8
    ui/exercise-picker.tsx                         Task 8
    ui/camera-stage.tsx                            Task 8
    ui/live-demo.tsx                               Task 8

  src/features/benchmark/
    domain/clips.ts                                Task 9
    domain/benchmark-report.ts (+ .test.ts)        Task 9
    infrastructure/download-json.ts                Task 9
    ui/clip-runner.tsx                             Task 9
    ui/benchmark-actions.tsx                       Task 9
    ui/benchmark-page.tsx                          Task 9

  src/features/docs/ui/fsm-diagram.tsx             Task 11
  src/features/docs/ui/thresholds-table.tsx        Task 11
  e2e/benchmark.spec.ts                            Task 12
```

---

### Task 1: Scaffold, shadcn/ui, Hugeicons, layout shell

**Files:**
- Create: project via TanStack CLI; `vite.config.ts`, `vitest.config.ts`, `components.json`, `netlify.toml`, `.nvmrc`, `LICENSE`, `README.md`, `scripts/copy-wasm.mjs`, `src/styles.css`, `src/lib/utils.ts`, `src/lib/site.ts`, `src/components/ui/icons.tsx`, `src/components/layout/site-header.tsx`, `src/routes/__root.tsx`, `src/routes/index.tsx` (placeholder), `public/models/pose_landmarker_lite.task`
- Copy: spec into `docs/superpowers/specs/`

**Interfaces:**
- Produces: `cn()` from `@/lib/utils`; `site` constants from `@/lib/site`; icon components `CameraIcon, RefreshIcon, DownloadIcon, CopyIcon, PlayIcon, AlertIcon, GithubIcon, ArrowRightIcon` from `@/components/ui/icons`; shadcn components `button, badge, card, alert, toggle-group, table, separator, sonner` under `@/components/ui/*`.

- [ ] **Step 1: Scaffold**

```bash
cd ~/Work/Personal
pnpm create @tanstack/start@latest repstate --blank -y --package-manager pnpm
cd repstate && git init
```

- [ ] **Step 2: Install dependencies**

```bash
pnpm add @mediapipe/tasks-vision @hugeicons/react @hugeicons/core-free-icons clsx tailwind-merge
pnpm add -D tailwindcss @tailwindcss/vite @tailwindcss/typography vitest jsdom @netlify/vite-plugin-tanstack-start @playwright/test @lhci/cli @tanstack/eslint-config eslint prettier prettier-plugin-tailwindcss
```

- [ ] **Step 3: `vite.config.ts`**

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
    tanstackStart({ prerender: { enabled: true, crawlLinks: true, failOnError: true } }),
    netlify(),
    viteReact(),
  ],
})
```

- [ ] **Step 4: `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    environment: "node",
    coverage: { include: ["src/features/**/domain/**", "src/features/**/application/**"] },
  },
})
```

- [ ] **Step 5: `components.json`** (same conventions as the portfolio)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "radix-nova",
  "rsc": false,
  "tsx": true,
  "tailwind": { "config": "", "css": "src/styles.css", "baseColor": "neutral", "cssVariables": true, "prefix": "" },
  "iconLibrary": "hugeicons",
  "rtl": false,
  "aliases": { "components": "@/components", "utils": "@/lib/utils", "ui": "@/components/ui", "lib": "@/lib", "hooks": "@/hooks" }
}
```

- [ ] **Step 6: `src/styles.css`, `src/lib/utils.ts`, then add shadcn components**

`src/styles.css`:

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";

:root { color-scheme: light dark; }
```

`src/lib/utils.ts`:

```ts
import { clsx } from "clsx"
import type { ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

```bash
pnpm dlx shadcn@latest add button badge card alert toggle-group table separator sonner
```

Expected: files under `src/components/ui/` and theme variables appended to `src/styles.css`. If the CLI asks to initialise, accept defaults (it reads `components.json`).

- [ ] **Step 7: `src/components/ui/icons.tsx`** (Hugeicons wrapper; one place for every icon)

```tsx
import { forwardRef } from "react"
import type { ForwardRefExoticComponent, RefAttributes } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import type { HugeiconsIconProps, IconSvgElement } from "@hugeicons/react"
import HugeAlertIcon from "@hugeicons/core-free-icons/AlertCircleIcon"
import HugeArrowRightIcon from "@hugeicons/core-free-icons/ArrowRight02Icon"
import HugeCameraIcon from "@hugeicons/core-free-icons/CameraVideoIcon"
import HugeCopyIcon from "@hugeicons/core-free-icons/Copy01Icon"
import HugeDownloadIcon from "@hugeicons/core-free-icons/Download04Icon"
import HugeGithubIcon from "@hugeicons/core-free-icons/GithubIcon"
import HugePlayIcon from "@hugeicons/core-free-icons/PlayIcon"
import HugeRefreshIcon from "@hugeicons/core-free-icons/RefreshIcon"

export type IconProps = Omit<HugeiconsIconProps, "altIcon" | "icon">
export type Icon = ForwardRefExoticComponent<IconProps & RefAttributes<SVGSVGElement>>

function createIcon(icon: IconSvgElement, displayName: string): Icon {
  const Component = forwardRef<SVGSVGElement, IconProps>(function AppIcon({ strokeWidth = 1.5, ...props }, ref) {
    return <HugeiconsIcon ref={ref} icon={icon} strokeWidth={strokeWidth} focusable="false" aria-hidden={props["aria-label"] ? undefined : true} {...props} />
  })
  Component.displayName = displayName
  return Component
}

export const AlertIcon = createIcon(HugeAlertIcon, "AlertIcon")
export const ArrowRightIcon = createIcon(HugeArrowRightIcon, "ArrowRightIcon")
export const CameraIcon = createIcon(HugeCameraIcon, "CameraIcon")
export const CopyIcon = createIcon(HugeCopyIcon, "CopyIcon")
export const DownloadIcon = createIcon(HugeDownloadIcon, "DownloadIcon")
export const GithubIcon = createIcon(HugeGithubIcon, "GithubIcon")
export const PlayIcon = createIcon(HugePlayIcon, "PlayIcon")
export const RefreshIcon = createIcon(HugeRefreshIcon, "RefreshIcon")
```

If an icon name does not exist in `@hugeicons/core-free-icons`, pick the nearest from `ls node_modules/@hugeicons/core-free-icons | grep -i <word>` and keep the exported name.

- [ ] **Step 8: `src/lib/site.ts`**

```ts
export const site = {
  name: "Repstate",
  description:
    "Open-source squat and push-up rep counter: MediaPipe pose landmarks, a deterministic finite-state-machine engine, adaptive frame rate, and reproducible benchmarks.",
  repoUrl: "https://github.com/montasim/repstate",
} as const

/** Shared meta tags for a route; title is suffixed with the site name. */
export function createMeta(title: string, description = site.description) {
  return [
    { title: `${title} · ${site.name}` },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
  ]
}
```

- [ ] **Step 9: `src/components/layout/site-header.tsx`**

```tsx
import { Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { GithubIcon } from "@/components/ui/icons"
import { site } from "@/lib/site"

export function SiteHeader() {
  return (
    <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
      <Link to="/" className="font-semibold">{site.name}</Link>
      <nav aria-label="Primary" className="flex items-center gap-1">
        <Button asChild variant="ghost" size="sm"><Link to="/benchmark">Benchmark</Link></Button>
        <Button asChild variant="ghost" size="sm"><Link to="/how-it-works">How it works</Link></Button>
        <Button asChild variant="outline" size="sm">
          <a href={site.repoUrl} rel="noreferrer"><GithubIcon /> GitHub</a>
        </Button>
      </nav>
    </header>
  )
}
```

- [ ] **Step 10: `src/routes/__root.tsx`**

```tsx
import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router"
import type { ErrorComponentProps } from "@tanstack/react-router"
import appCss from "../styles.css?url"
import { SiteHeader } from "@/components/layout/site-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertIcon } from "@/components/ui/icons"
import { Toaster } from "@/components/ui/sonner"
import { createMeta, site } from "@/lib/site"

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      ...createMeta(site.name),
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootDocument,
  component: () => <Outlet />,
  errorComponent: RootError,
  notFoundComponent: () => <RouteMessage title="Page not found" description="That route does not exist." />,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><HeadContent /></head>
      <body className="bg-background text-foreground antialiased">
        <SiteHeader />
        <main className="mx-auto max-w-5xl px-4 pb-16">{children}</main>
        <Toaster />
        <Scripts />
      </body>
    </html>
  )
}

function RootError({ error, reset }: ErrorComponentProps) {
  return (
    <RouteMessage title="Something went wrong" description={error.message}>
      <Button onClick={reset}>Try again</Button>
    </RouteMessage>
  )
}

function RouteMessage({ title, description, children }: { title: string; description: string; children?: React.ReactNode }) {
  return (
    <Alert variant="destructive" className="my-8">
      <AlertIcon />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
      {children}
    </Alert>
  )
}
```

- [ ] **Step 11: Placeholder `src/routes/index.tsx`** (replaced in Task 8)

```tsx
import { createFileRoute } from "@tanstack/react-router"
import { createMeta } from "@/lib/site"

export const Route = createFileRoute("/")({
  head: () => ({ meta: createMeta("Live demo") }),
  component: () => <h1 className="text-3xl font-bold">Repstate</h1>,
})
```

- [ ] **Step 12: Assets and scripts**

`scripts/copy-wasm.mjs`:

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

```bash
mkdir -p public/models
curl -L -o public/models/pose_landmarker_lite.task \
  https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task
```

`package.json` scripts/engines (merge):

```json
{
  "name": "repstate",
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

`.nvmrc` → `22`. Append to `.gitignore`: `public/wasm`, `.netlify`, `.output`, `.tanstack`, `test-results`, `playwright-report`, `.lighthouseci`.

`LICENSE`: MIT, 2026, "Mohammad Montasim Al Mamun Shuvo". `README.md` stub:

```md
# Repstate

Deterministic squat and push-up rep counter in the browser. Under construction; see `docs/superpowers/specs/`.
```

- [ ] **Step 13: Copy spec, verify**

```bash
mkdir -p docs/superpowers/specs
cp ~/Work/Personal/v2/docs/superpowers/specs/2026-10-10-repstate-realtime-cv-rep-counter-design.md docs/superpowers/specs/
pnpm install && pnpm typecheck && pnpm lint && pnpm build && ls dist/client/index.html dist/client/wasm | head -3
```

Expected: all clean; `index.html` and wasm files present.

- [ ] **Step 14: Commit**

```bash
git add -A
git commit -m "chore: scaffold Repstate with TanStack Start, shadcn/ui, Hugeicons, and MediaPipe assets"
```

---

### Task 2: Domain types and angle math

**Files:**
- Create: `src/features/rep-counter/domain/types.ts`, `domain/angles.ts`, `domain/angles.test.ts`
- Modify: `eslint.config.js` (layer rules)

**Interfaces:**
- Produces: `Landmark`, `Frame`, `State`, `EngineEvent`, `JointTriple`, `ExerciseId`, `ExerciseDef`, `Snapshot`; `angleDeg(a,b,c)`, `meanVisibility(frame, triples)`, `selectAngle(frame, triples, minVisibility)`.

- [ ] **Step 1: `domain/types.ts`**

```ts
export type Landmark = { x: number; y: number; z: number; visibility: number }

/** One pose frame. `t` is milliseconds, monotonic within a session. 33 landmarks in MediaPipe order. */
export type Frame = { t: number; landmarks: Landmark[] }

export const POSE_LANDMARK_COUNT = 33

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

export type Snapshot = { state: State; count: number; angle: number | null; lastRepAt: number | null }
```

- [ ] **Step 2: Failing tests `domain/angles.test.ts`**

```ts
import { describe, expect, it } from "vitest"
import { angleDeg, meanVisibility, selectAngle } from "./angles"
import { POSE_LANDMARK_COUNT } from "./types"
import type { Frame, Landmark } from "./types"

const lm = (x: number, y: number, visibility = 1): Landmark => ({ x, y, z: 0, visibility })

function frameWith(points: Record<number, Landmark>): Frame {
  const landmarks: Landmark[] = Array.from({ length: POSE_LANDMARK_COUNT }, () => lm(0, 0, 0))
  for (const [i, p] of Object.entries(points)) landmarks[Number(i)] = p
  return { t: 0, landmarks }
}

describe("angleDeg", () => {
  it("returns 180 for a straight line", () => expect(angleDeg(lm(0, 0), lm(1, 0), lm(2, 0))).toBeCloseTo(180, 5))
  it("returns 90 for a right angle", () => expect(angleDeg(lm(0, 1), lm(0, 0), lm(1, 0))).toBeCloseTo(90, 5))
  it("returns 0 when both rays coincide", () => expect(angleDeg(lm(1, 0), lm(0, 0), lm(2, 0))).toBeCloseTo(0, 5))
  it("returns 0 for a zero-length ray instead of NaN", () => expect(angleDeg(lm(0, 0), lm(0, 0), lm(1, 0))).toBe(0))
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
    const f = frameWith({ 23: lm(0, 1), 25: lm(0, 0), 27: lm(1, 0), 24: lm(0, 0), 26: lm(1, 0), 28: lm(2, 0) })
    expect(selectAngle(f, [left, right], 0.6)).toBeCloseTo(90)
  })
  it("uses only the visible side", () => {
    const f = frameWith({ 23: lm(0, 1, 0.2), 25: lm(0, 0, 0.2), 27: lm(1, 0, 0.2), 24: lm(0, 0), 26: lm(1, 0), 28: lm(2, 0) })
    expect(selectAngle(f, [left, right], 0.6)).toBeCloseTo(180)
  })
  it("returns null when no side passes the visibility gate", () => {
    expect(selectAngle(frameWith({}), [left, right], 0.6)).toBeNull()
  })
})
```

- [ ] **Step 3: Run, expect FAIL** — `pnpm vitest run src/features/rep-counter/domain/angles.test.ts` → `Cannot find module './angles'`.

- [ ] **Step 4: `domain/angles.ts`**

```ts
import type { Frame, JointTriple, Landmark } from "./types"

const RAD_TO_DEG = 180 / Math.PI

/** Angle at `b` between rays b→a and b→c, in degrees 0..180. Zero-length rays yield 0. */
export function angleDeg(a: Landmark, b: Landmark, c: Landmark): number {
  const abx = a.x - b.x, aby = a.y - b.y
  const cbx = c.x - b.x, cby = c.y - b.y
  const lenAb = Math.hypot(abx, aby), lenCb = Math.hypot(cbx, cby)
  if (lenAb === 0 || lenCb === 0) return 0
  const cos = (abx * cbx + aby * cby) / (lenAb * lenCb)
  return Math.acos(Math.min(1, Math.max(-1, cos))) * RAD_TO_DEG
}

/** Mean visibility of every landmark index referenced by `triples`. */
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

- [ ] **Step 5: Run, expect 8 passed.**

- [ ] **Step 6: Layer rules in `eslint.config.js`** (append to the exported array)

```js
{
  files: ["src/features/**/domain/**/*.ts"],
  ignores: ["**/*.test.ts"],
  rules: {
    "no-restricted-imports": ["error", { patterns: [{ group: ["react", "react-*", "@mediapipe/*", "@tanstack/*", "@/components/*", "@/features/*/application/*", "@/features/*/infrastructure/*", "@/features/*/ui/*", "../application/*", "../infrastructure/*", "../ui/*"], message: "domain must stay pure." }] }],
    "no-restricted-globals": ["error", "window", "document", "navigator", "performance", "requestAnimationFrame"],
  },
},
{
  files: ["src/features/**/application/**/*.ts"],
  ignores: ["**/*.test.ts"],
  rules: {
    "no-restricted-imports": ["error", { patterns: [{ group: ["react", "react-*", "@mediapipe/*", "@tanstack/*", "@/components/*", "@/features/*/infrastructure/*", "@/features/*/ui/*", "../infrastructure/*", "../ui/*"], message: "application depends on domain and ports only." }] }],
    "no-restricted-globals": ["error", "window", "document", "navigator", "performance", "requestAnimationFrame"],
  },
},
```

Run `pnpm lint`. Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add src/features/rep-counter/domain eslint.config.js
git commit -m "feat(domain): add pose frame types, angle selection, and layer lint rules"
```

---

### Task 3: Exercise definitions

**Files:**
- Create: `domain/exercises.ts`, `domain/exercises.test.ts`

**Interfaces:**
- Produces: `EXERCISES: Record<ExerciseId, ExerciseDef>`, `EXERCISE_IDS: ExerciseId[]`, `getExercise(id)`.

- [ ] **Step 1: Failing test `domain/exercises.test.ts`**

```ts
import { describe, expect, it } from "vitest"
import { EXERCISES, EXERCISE_IDS, getExercise } from "./exercises"

describe("exercise definitions", () => {
  it("defines squat on hip-knee-ankle for both sides", () => expect(EXERCISES.squat.joints).toEqual([[23, 25, 27], [24, 26, 28]]))
  it("defines pushup on shoulder-elbow-wrist for both sides", () => expect(EXERCISES.pushup.joints).toEqual([[11, 13, 15], [12, 14, 16]]))
  it("keeps a hysteresis gap of at least 30 degrees on every exercise", () => {
    for (const def of Object.values(EXERCISES)) expect(def.upAngle - def.downAngle).toBeGreaterThanOrEqual(30)
  })
  it("lists ids in display order", () => expect(EXERCISE_IDS).toEqual(["squat", "pushup"]))
  it("getExercise returns the table entry", () => expect(getExercise("squat")).toBe(EXERCISES.squat))
})
```

- [ ] **Step 2: Run, expect FAIL.**

- [ ] **Step 3: `domain/exercises.ts`**

```ts
import type { ExerciseDef, ExerciseId } from "./types"

const DEFAULT_DWELL_MS = 200
const DEFAULT_MIN_VISIBILITY = 0.6

export const EXERCISES: Record<ExerciseId, ExerciseDef> = {
  squat: {
    id: "squat",
    label: "Squat",
    joints: [[23, 25, 27], [24, 26, 28]],
    downAngle: 100,
    upAngle: 160,
    minDwellMs: DEFAULT_DWELL_MS,
    minVisibility: DEFAULT_MIN_VISIBILITY,
    lostHint: "Step back so your hips, knees and ankles are in frame.",
  },
  pushup: {
    id: "pushup",
    label: "Push-up",
    joints: [[11, 13, 15], [12, 14, 16]],
    downAngle: 90,
    upAngle: 155,
    minDwellMs: DEFAULT_DWELL_MS,
    minVisibility: DEFAULT_MIN_VISIBILITY,
    lostHint: "Turn side-on so your shoulders, elbows and wrists are in frame.",
  },
}

export const EXERCISE_IDS: ExerciseId[] = ["squat", "pushup"]

/** Lookup by id; ids are a closed union so this never fails at runtime. */
export function getExercise(id: ExerciseId): ExerciseDef {
  return EXERCISES[id]
}
```

- [ ] **Step 4: Run, expect 5 passed. Commit**

```bash
git add src/features/rep-counter/domain/exercises.ts src/features/rep-counter/domain/exercises.test.ts
git commit -m "feat(domain): add squat and push-up exercise definitions"
```

---

### Task 4: RepEngine finite-state machine

**Files:**
- Create: `domain/rep-engine.ts`, `domain/rep-engine.test.ts`

**Interfaces:**
- Produces: `class RepEngine { constructor(def: ExerciseDef); step(frame: Frame): EngineEvent[]; reset(): void; snapshot(): Snapshot }`. Test file exports `syntheticFrame(deg, t, visibility?)` for reuse in Task 6 tests.

FSM rules (spec §4.1): `IDLE→READY` visible and angle ≥ up; `READY→DOWN` angle ≤ down, record `downAt`; `DOWN→UP` angle ≥ up and dwell ≥ `minDwellMs` → `rep`; `DOWN→READY` angle ≥ up, dwell not met, no rep; `UP→READY` next frame unconditionally; `*→LOST` after 3 null-angle frames, `warning low_visibility` once, discard rep in progress, reset EMA; `LOST→READY` after 3 good frames with angle ≥ up; frame with < 33 landmarks → `warning no_pose` and counts as a low-visibility frame; EMA alpha 0.5.

- [ ] **Step 1: Failing tests `domain/rep-engine.test.ts`**

```ts
import { describe, expect, it } from "vitest"
import { EXERCISES } from "./exercises"
import { RepEngine } from "./rep-engine"
import { POSE_LANDMARK_COUNT } from "./types"
import type { EngineEvent, Frame, Landmark } from "./types"

/** Frame whose squat knee angle (both sides) equals `deg`. */
export function syntheticFrame(deg: number, t: number, visibility = 1): Frame {
  const rad = (deg * Math.PI) / 180
  const lm = (x: number, y: number): Landmark => ({ x, y, z: 0, visibility })
  const landmarks: Landmark[] = Array.from({ length: POSE_LANDMARK_COUNT }, () => lm(0, 0))
  for (const [hip, knee, ankle] of [[23, 25, 27], [24, 26, 28]] as const) {
    landmarks[knee] = lm(0, 0)
    landmarks[ankle] = lm(1, 0)
    landmarks[hip] = lm(Math.cos(rad), Math.sin(rad))
  }
  return { t, landmarks }
}

const run = (engine: RepEngine, frames: Frame[]): EngineEvent[] => frames.flatMap((f) => engine.step(f))
const seq = (angles: number[], startT = 0, stepMs = 50): Frame[] => angles.map((a, i) => syntheticFrame(a, startT + i * stepMs))
const FULL_REP = [170, 170, 150, 120, 95, 90, 90, 90, 90, 90, 120, 150, 170, 170]

describe("RepEngine", () => {
  it("starts IDLE and moves to READY on a visible upright frame", () => {
    const e = new RepEngine(EXERCISES.squat)
    expect(e.step(syntheticFrame(170, 0))).toEqual([{ type: "state", from: "IDLE", to: "READY", t: 0 }])
    expect(e.snapshot().state).toBe("READY")
  })

  it("counts one rep for a full down-up cycle with dwell", () => {
    const e = new RepEngine(EXERCISES.squat)
    const reps = run(e, seq(FULL_REP)).filter((ev) => ev.type === "rep")
    expect(reps).toHaveLength(1)
    expect(reps[0]).toMatchObject({ type: "rep", count: 1 })
    expect(e.snapshot().count).toBe(1)
  })

  it("does not count when the angle oscillates inside the hysteresis gap", () => {
    const e = new RepEngine(EXERCISES.squat)
    run(e, seq([170, 170, 130, 110, 130, 110, 130, 110, 170]))
    expect(e.snapshot().count).toBe(0)
  })

  it("does not count a bounce shorter than minDwellMs", () => {
    const e = new RepEngine(EXERCISES.squat)
    run(e, seq([170, 170, 90, 170, 170]))
    expect(e.snapshot().count).toBe(0)
    expect(e.snapshot().state).toBe("READY")
  })

  it("is deterministic: same frames give identical events", () => {
    const frames = [...seq(FULL_REP), ...seq(FULL_REP, 1000)]
    const a = run(new RepEngine(EXERCISES.squat), frames)
    const b = run(new RepEngine(EXERCISES.squat), frames)
    expect(a).toEqual(b)
    expect(a.filter((ev) => ev.type === "rep")).toHaveLength(2)
  })

  it("enters LOST after 3 low-visibility frames and discards the rep in progress", () => {
    const e = new RepEngine(EXERCISES.squat)
    run(e, seq([170, 170, 90, 90]))
    expect(e.snapshot().state).toBe("DOWN")
    const events = run(e, [syntheticFrame(90, 500, 0.1), syntheticFrame(90, 550, 0.1), syntheticFrame(90, 600, 0.1)])
    expect(e.snapshot().state).toBe("LOST")
    expect(events.filter((ev) => ev.type === "warning")).toEqual([{ type: "warning", code: "low_visibility", t: 600 }])
    run(e, seq([170, 170, 170, 170, 90, 90, 90, 90, 90, 90, 170, 170], 700))
    expect(e.snapshot().count).toBe(1)
  })

  it("emits low_visibility once while staying LOST", () => {
    const e = new RepEngine(EXERCISES.squat)
    const events = run(e, [0, 50, 100, 150, 200].map((t) => syntheticFrame(170, t, 0.1)))
    expect(events.filter((ev) => ev.type === "warning")).toHaveLength(1)
  })

  it("emits no_pose for a frame without 33 landmarks", () => {
    const e = new RepEngine(EXERCISES.squat)
    expect(e.step({ t: 0, landmarks: [] })).toContainEqual({ type: "warning", code: "no_pose", t: 0 })
  })

  it("reset returns to IDLE with count 0", () => {
    const e = new RepEngine(EXERCISES.squat)
    run(e, seq(FULL_REP))
    e.reset()
    expect(e.snapshot()).toEqual({ state: "IDLE", count: 0, angle: null, lastRepAt: null })
  })
})
```

- [ ] **Step 2: Run, expect FAIL.**

- [ ] **Step 3: `domain/rep-engine.ts`**

```ts
import { selectAngle } from "./angles"
import { POSE_LANDMARK_COUNT } from "./types"
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

  /** Return to IDLE with count 0 and no smoothing history. */
  reset(): void {
    this.state = "IDLE"
    this.count = 0
    this.ema = null
    this.downAt = null
    this.lastRepAt = null
    this.lowFrames = 0
    this.goodFrames = 0
  }

  /** Read-only view of current state for UI. */
  snapshot(): Snapshot {
    return { state: this.state, count: this.count, angle: this.ema, lastRepAt: this.lastRepAt }
  }

  /** Advance the machine by one frame; returns the events it produced, in order. */
  step(frame: Frame): EngineEvent[] {
    const events: EngineEvent[] = []
    const t = frame.t
    if (this.state === "UP") this.transition("READY", t, events)

    const raw = this.measure(frame, events)
    if (raw === null) {
      this.onLowVisibility(t, events)
      return events
    }

    this.lowFrames = 0
    this.goodFrames++
    this.ema = this.ema === null ? raw : EMA_ALPHA * raw + (1 - EMA_ALPHA) * this.ema
    this.advance(this.ema, t, events)
    return events
  }

  private measure(frame: Frame, events: EngineEvent[]): number | null {
    if (frame.landmarks.length < POSE_LANDMARK_COUNT) {
      events.push({ type: "warning", code: "no_pose", t: frame.t })
      return null
    }
    return selectAngle(frame, this.def.joints, this.def.minVisibility)
  }

  private onLowVisibility(t: number, events: EngineEvent[]): void {
    this.lowFrames++
    this.goodFrames = 0
    if (this.state === "LOST" || this.lowFrames < LOST_AFTER_FRAMES) return
    this.ema = null
    this.downAt = null
    this.transition("LOST", t, events)
    events.push({ type: "warning", code: "low_visibility", t })
  }

  private advance(angle: number, t: number, events: EngineEvent[]): void {
    const { upAngle, downAngle, minDwellMs } = this.def
    switch (this.state) {
      case "IDLE":
        if (angle >= upAngle) this.transition("READY", t, events)
        return
      case "LOST":
        if (this.goodFrames >= RECOVER_AFTER_FRAMES && angle >= upAngle) this.transition("READY", t, events)
        return
      case "READY":
        if (angle <= downAngle) {
          this.downAt = t
          this.transition("DOWN", t, events)
        }
        return
      case "DOWN": {
        if (angle < upAngle) return
        const dwell = t - (this.downAt ?? t)
        this.downAt = null
        if (dwell < minDwellMs) {
          this.transition("READY", t, events)
          return
        }
        this.count++
        this.lastRepAt = t
        this.transition("UP", t, events)
        events.push({ type: "rep", count: this.count, t, durationMs: dwell })
        return
      }
      case "UP":
        return
    }
  }

  private transition(to: State, t: number, events: EngineEvent[]): void {
    const from = this.state
    if (from === to) return
    this.state = to
    events.push({ type: "state", from, to, t })
  }
}
```

- [ ] **Step 4: Run, expect 9 passed.** Do not weaken thresholds to force a DOWN in the bounce test; smoothing may keep the angle above `downAngle`, which still yields count 0 and `READY`.

- [ ] **Step 5: Commit**

```bash
git add src/features/rep-counter/domain/rep-engine.ts src/features/rep-counter/domain/rep-engine.test.ts
git commit -m "feat(domain): add deterministic RepEngine finite-state machine"
```

---

### Task 5: Application ports, rolling window, inference budget, perf tracker

**Files:**
- Create: `application/ports.ts`, `application/rolling-window.ts` (+test), `application/inference-budget.ts` (+test), `application/perf-tracker.ts` (+test)

**Interfaces:**
- Produces (`ports.ts`):
  ```ts
  export type Delegate = "GPU" | "CPU"
  export interface PoseDetector { readonly delegate: Delegate; detect(input: VideoFrameLike, timestampMs: number): Landmark[] | null; close(): void }
  export interface FrameSource { readonly element: VideoFrameLike; readonly kind: "camera" | "video"; stop(): void }
  export interface FrameScheduler { now(): number; requestFrame(cb: (now: number) => void): number; cancelFrame(handle: number): void; isHidden(): boolean; onVisibilityChange(cb: () => void): () => void }
  export type VideoFrameLike = { currentTime: number; paused: boolean; ended: boolean }
  ```
  (`VideoFrameLike` is a structural subset of `HTMLVideoElement` so application code never names the DOM type.)
- `RollingWindow { push, size, values, percentile, clear }`.
- `ACTIVE_FPS = 30`, `IDLE_FPS = 10`, `targetFpsFor(state)`, `budgetMs(window, targetFps)`, `shouldInfer(now, lastAt, window, targetFps)`.
- `PerfSample = { at, renderFps, inferenceFps, inferenceP50, inferenceP95, dropped, delegate }`, `PerfTracker { recordInference(ms, at), recordRender(at), recordDrop(), sample(at), reset(), window }`.

- [ ] **Step 1: `application/ports.ts`**

```ts
import type { Landmark } from "../domain/types"

export type Delegate = "GPU" | "CPU"

/** Structural subset of HTMLVideoElement used by the session; keeps application code DOM-free. */
export type VideoFrameLike = { currentTime: number; paused: boolean; ended: boolean }

/** Pose model adapter. `detect` is synchronous and returns 33 landmarks or null when no pose is found. */
export interface PoseDetector {
  readonly delegate: Delegate
  detect(input: VideoFrameLike, timestampMs: number): Landmark[] | null
  close(): void
}

/** A playing video element (camera stream or clip). */
export interface FrameSource {
  readonly element: VideoFrameLike
  readonly kind: "camera" | "video"
  stop(): void
}

/** Frame timing and visibility, abstracted so the session can be tested with a fake clock. */
export interface FrameScheduler {
  now(): number
  requestFrame(cb: (now: number) => void): number
  cancelFrame(handle: number): void
  isHidden(): boolean
  /** Subscribe to visibility changes; returns an unsubscribe function. */
  onVisibilityChange(cb: () => void): () => void
}
```

- [ ] **Step 2: Failing tests `application/rolling-window.test.ts`**

```ts
import { describe, expect, it } from "vitest"
import { RollingWindow } from "./rolling-window"

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
  it("returns 0 for an empty window and clears", () => {
    const w = new RollingWindow(5)
    expect(w.percentile(90)).toBe(0)
    w.push(1); w.clear()
    expect(w.size()).toBe(0)
  })
})
```

- [ ] **Step 3: `application/rolling-window.ts`**

```ts
/** Fixed-size FIFO of numbers with nearest-rank percentiles. */
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
```

- [ ] **Step 4: Failing tests `application/inference-budget.test.ts`**

```ts
import { describe, expect, it } from "vitest"
import { budgetMs, shouldInfer, targetFpsFor } from "./inference-budget"
import { RollingWindow } from "./rolling-window"

const filled = (v: number) => { const w = new RollingWindow(30); for (let i = 0; i < 30; i++) w.push(v); return w }

describe("targetFpsFor", () => {
  it("runs at 30 while a person is in position and 10 while idle or lost", () => {
    expect(targetFpsFor("READY")).toBe(30)
    expect(targetFpsFor("DOWN")).toBe(30)
    expect(targetFpsFor("UP")).toBe(30)
    expect(targetFpsFor("IDLE")).toBe(10)
    expect(targetFpsFor("LOST")).toBe(10)
  })
})

describe("budgetMs", () => {
  it("floors at 1000/target when inference is fast", () => expect(budgetMs(filled(5), 30)).toBeCloseTo(1000 / 30))
  it("expands to p90 * 1.2 when inference is slow", () => expect(budgetMs(filled(100), 30)).toBeCloseTo(120))
  it("uses the floor when the window is empty", () => expect(budgetMs(new RollingWindow(30), 30)).toBeCloseTo(1000 / 30))
})

describe("shouldInfer", () => {
  it("always infers when nothing has run yet", () => expect(shouldInfer(0, null, new RollingWindow(30), 30)).toBe(true))
  it("skips frames inside the budget and allows after it", () => {
    expect(shouldInfer(1050, 1000, filled(100), 30)).toBe(false)
    expect(shouldInfer(1120, 1000, filled(100), 30)).toBe(true)
  })
  it("uses a 100ms floor when the target is 10 fps", () => {
    expect(shouldInfer(1050, 1000, filled(5), 10)).toBe(false)
    expect(shouldInfer(1100, 1000, filled(5), 10)).toBe(true)
  })
})
```

- [ ] **Step 5: `application/inference-budget.ts`**

```ts
import type { State } from "../domain/types"
import type { RollingWindow } from "./rolling-window"

export const ACTIVE_FPS = 30
export const IDLE_FPS = 10
const HEADROOM = 1.2
const LOAD_PERCENTILE = 90

/** Inference target by engine state: full rate while someone is in position, low rate while idle or lost. */
export function targetFpsFor(state: State): number {
  return state === "IDLE" || state === "LOST" ? IDLE_FPS : ACTIVE_FPS
}

/** Minimum gap between inferences: the fps floor, or p90 inference time with headroom when the device is slow. */
export function budgetMs(window: RollingWindow, targetFps: number): number {
  const floor = 1000 / targetFps
  if (window.size() === 0) return floor
  return Math.max(floor, window.percentile(LOAD_PERCENTILE) * HEADROOM)
}

/** True when enough time has passed since the last inference for the current budget. */
export function shouldInfer(now: number, lastInferenceAt: number | null, window: RollingWindow, targetFps: number): boolean {
  if (lastInferenceAt === null) return true
  return now - lastInferenceAt >= budgetMs(window, targetFps)
}
```

- [ ] **Step 6: Failing tests `application/perf-tracker.test.ts`**

```ts
import { describe, expect, it } from "vitest"
import { PerfTracker } from "./perf-tracker"

describe("PerfTracker", () => {
  it("reports inference and render fps over the trailing second and inference percentiles", () => {
    const p = new PerfTracker("GPU")
    for (let i = 0; i < 20; i++) p.recordInference(10 + i, i * 50)
    for (let i = 0; i < 60; i++) p.recordRender(i * (1000 / 60))
    p.recordDrop(); p.recordDrop()
    expect(p.sample(1000)).toEqual({ at: 1000, renderFps: 60, inferenceFps: 20, inferenceP50: 19, inferenceP95: 28, dropped: 2, delegate: "GPU" })
  })
  it("forgets events older than one second", () => {
    const p = new PerfTracker("CPU")
    p.recordInference(10, 0); p.recordInference(10, 1500)
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

- [ ] **Step 7: `application/perf-tracker.ts`**

```ts
import type { Delegate } from "./ports"
import { RollingWindow } from "./rolling-window"

const WINDOW_SIZE = 30
const SECOND_MS = 1000

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
    const cutoff = at - SECOND_MS
    while (this.list.length && this.list[0] < cutoff) this.list.shift()
  }
  countSince(cutoff: number): number { return this.list.filter((s) => s > cutoff).length }
  clear(): void { this.list = [] }
}

/** Collects inference timings, render ticks and dropped frames; emits HUD samples. */
export class PerfTracker {
  readonly window = new RollingWindow(WINDOW_SIZE)
  private inferences = new Stamps()
  private renders = new Stamps()
  private dropped = 0

  constructor(private readonly delegate: Delegate) {}

  recordInference(ms: number, at: number): void { this.window.push(ms); this.inferences.push(at) }
  recordRender(at: number): void { this.renders.push(at) }
  recordDrop(): void { this.dropped++ }

  sample(at: number): PerfSample {
    const cutoff = at - SECOND_MS
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

  reset(): void { this.inferences.clear(); this.renders.clear(); this.dropped = 0; this.window.clear() }
}
```

- [ ] **Step 8: Run all, expect pass; lint; commit**

```bash
pnpm vitest run src/features/rep-counter/application && pnpm lint
git add src/features/rep-counter/application
git commit -m "feat(application): add ports, rolling window, two-axis inference budget, and perf tracker"
```

---

### Task 6: RepSession use-case (testable loop)

**Files:**
- Create: `application/rep-session.ts`, `application/rep-session.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type SessionFrame = { landmarks: Landmark[] | null; events: EngineEvent[]; snapshot: Snapshot }
  export type SessionListeners = { onFrame: (f: SessionFrame) => void; onPerf: (s: PerfSample) => void; onEnded?: () => void }
  export type SessionDeps = { source: FrameSource; detector: PoseDetector; scheduler: FrameScheduler; engine: RepEngine }
  export class RepSession {
    constructor(deps: SessionDeps, listeners: SessionListeners)
    start(): void
    stop(): void
    latestLandmarks(): Landmark[] | null
    markRender(at: number): void
  }
  ```

- [ ] **Step 1: Failing tests `application/rep-session.test.ts`** (fake scheduler, fake detector)

```ts
import { describe, expect, it } from "vitest"
import { EXERCISES } from "../domain/exercises"
import { RepEngine } from "../domain/rep-engine"
import { syntheticFrame } from "../domain/rep-engine.test"
import type { Landmark } from "../domain/types"
import type { FrameScheduler, FrameSource, PoseDetector, VideoFrameLike } from "./ports"
import { RepSession } from "./rep-session"
import type { PerfSample, SessionFrame } from "./rep-session"

class FakeScheduler implements FrameScheduler {
  time = 0
  hidden = false
  private cbs = new Map<number, (now: number) => void>()
  private next = 1
  now() { return this.time }
  requestFrame(cb: (now: number) => void) { const h = this.next++; this.cbs.set(h, cb); return h }
  cancelFrame(h: number) { this.cbs.delete(h) }
  isHidden() { return this.hidden }
  onVisibilityChange() { return () => {} }
  /** Advance time and fire every pending frame callback once. */
  tick(ms: number) {
    this.time += ms
    const pending = [...this.cbs.entries()]
    this.cbs.clear()
    for (const [, cb] of pending) cb(this.time)
  }
}

class FakeDetector implements PoseDetector {
  readonly delegate = "CPU" as const
  calls = 0
  constructor(private frames: Landmark[][], public costMs: number, private scheduler: FakeScheduler) {}
  detect() { this.scheduler.time += this.costMs; return this.frames[Math.min(this.calls++, this.frames.length - 1)] }
  close() {}
}

function makeSource(video: VideoFrameLike): FrameSource {
  return { element: video, kind: "video", stop: () => {} }
}

function setup(angles: number[], costMs = 5) {
  const scheduler = new FakeScheduler()
  const landmarks = angles.map((a) => syntheticFrame(a, 0).landmarks)
  const detector = new FakeDetector(landmarks, costMs, scheduler)
  const video: VideoFrameLike = { currentTime: 0, paused: false, ended: false }
  const frames: SessionFrame[] = []
  const perf: PerfSample[] = []
  const session = new RepSession(
    { source: makeSource(video), detector, scheduler, engine: new RepEngine(EXERCISES.squat) },
    { onFrame: (f) => frames.push(f), onPerf: (s) => perf.push(s) },
  )
  return { scheduler, detector, video, frames, perf, session }
}

describe("RepSession", () => {
  it("runs inference on new video frames and forwards engine snapshots", () => {
    const { scheduler, video, frames, session } = setup([170, 170])
    session.start()
    video.currentTime = 0.033; scheduler.tick(40)
    expect(frames).toHaveLength(1)
    expect(frames[0].snapshot.state).toBe("READY")
    expect(session.latestLandmarks()).not.toBeNull()
  })

  it("skips inference when the video has not advanced", () => {
    const { scheduler, video, detector, session } = setup([170, 170])
    session.start()
    video.currentTime = 0.033; scheduler.tick(40)
    scheduler.tick(40)
    expect(detector.calls).toBe(1)
  })

  it("throttles to the idle budget while IDLE", () => {
    // 100 ms floor at 10 fps when nobody is in position: two frames 40 ms apart => one inference
    const { scheduler, video, detector, session } = setup([30, 30, 30])
    session.start()
    video.currentTime = 0.04; scheduler.tick(40)
    video.currentTime = 0.08; scheduler.tick(40)
    expect(detector.calls).toBe(1)
    video.currentTime = 0.12; scheduler.tick(40)
    expect(detector.calls).toBe(2)
  })

  it("pauses while the tab is hidden and does not infer", () => {
    const { scheduler, video, detector, session } = setup([170])
    scheduler.hidden = true
    session.start()
    video.currentTime = 0.033; scheduler.tick(40)
    expect(detector.calls).toBe(0)
  })

  it("emits perf samples every 500 ms and counts renders", () => {
    const { scheduler, video, perf, session } = setup(Array(30).fill(170), 1)
    session.start()
    for (let i = 1; i <= 20; i++) { video.currentTime = i * 0.04; session.markRender(scheduler.now()); scheduler.tick(40) }
    expect(perf.length).toBeGreaterThanOrEqual(1)
    expect(perf[0].delegate).toBe("CPU")
    expect(perf[0].renderFps).toBeGreaterThan(0)
  })

  it("calls onEnded once when the video ends and stops scheduling", () => {
    let ended = 0
    const scheduler = new FakeScheduler()
    const video: VideoFrameLike = { currentTime: 0, paused: false, ended: false }
    const session = new RepSession(
      { source: makeSource(video), detector: new FakeDetector([], 1, scheduler), scheduler, engine: new RepEngine(EXERCISES.squat) },
      { onFrame: () => {}, onPerf: () => {}, onEnded: () => ended++ },
    )
    session.start()
    video.ended = true
    scheduler.tick(40); scheduler.tick(40)
    expect(ended).toBe(1)
  })
})
```

- [ ] **Step 2: Run, expect FAIL** — `Cannot find module './rep-session'`.

- [ ] **Step 3: `application/rep-session.ts`**

```ts
import type { RepEngine } from "../domain/rep-engine"
import type { EngineEvent, Frame, Landmark, Snapshot } from "../domain/types"
import { shouldInfer, targetFpsFor } from "./inference-budget"
import { PerfTracker } from "./perf-tracker"
import type { PerfSample } from "./perf-tracker"
import type { FrameScheduler, FrameSource, PoseDetector } from "./ports"

export type { PerfSample }

export type SessionFrame = { landmarks: Landmark[] | null; events: EngineEvent[]; snapshot: Snapshot }

export type SessionListeners = {
  onFrame: (f: SessionFrame) => void
  onPerf: (s: PerfSample) => void
  onEnded?: () => void
}

export type SessionDeps = {
  source: FrameSource
  detector: PoseDetector
  scheduler: FrameScheduler
  engine: RepEngine
}

const PERF_INTERVAL_MS = 500

/**
 * Drives detector → engine on each new video frame under the adaptive budget.
 * Rendering is not its job: the overlay reads `latestLandmarks()` on its own loop and reports `markRender`.
 */
export class RepSession {
  private stopped = false
  private handle: number | null = null
  private lastInferenceAt: number | null = null
  private lastVideoTime = -1
  private lastPerfAt: number
  private latest: Landmark[] | null = null
  private ended = false
  private unsubscribeVisibility: () => void = () => {}
  private readonly perf: PerfTracker

  constructor(private readonly deps: SessionDeps, private readonly listeners: SessionListeners) {
    this.perf = new PerfTracker(deps.detector.delegate)
    this.lastPerfAt = deps.scheduler.now()
  }

  start(): void {
    this.unsubscribeVisibility = this.deps.scheduler.onVisibilityChange(() => {
      if (!this.deps.scheduler.isHidden()) this.schedule()
    })
    this.schedule()
  }

  stop(): void {
    this.stopped = true
    this.unsubscribeVisibility()
    if (this.handle !== null) this.deps.scheduler.cancelFrame(this.handle)
  }

  latestLandmarks(): Landmark[] | null { return this.latest }

  markRender(at: number): void { this.perf.recordRender(at) }

  private schedule(): void {
    if (this.stopped || this.ended) return
    this.handle = this.deps.scheduler.requestFrame((now) => this.tick(now))
  }

  private tick(now: number): void {
    if (this.stopped) return
    const { source, scheduler, detector, engine } = this.deps
    const video = source.element
    if (video.ended) { this.finish(); return }
    if (scheduler.isHidden() || video.paused || video.currentTime === this.lastVideoTime) { this.schedule(); return }

    if (!shouldInfer(now, this.lastInferenceAt, this.perf.window, targetFpsFor(engine.snapshot().state))) {
      this.perf.recordDrop()
      this.schedule()
      return
    }

    this.lastVideoTime = video.currentTime
    const started = scheduler.now()
    const landmarks = detector.detect(video, started)
    const inferenceMs = scheduler.now() - started
    this.lastInferenceAt = started
    this.perf.recordInference(inferenceMs, started)
    this.latest = landmarks

    const frame: Frame = { t: started, landmarks: landmarks ?? [] }
    const events = engine.step(frame)
    this.listeners.onFrame({ landmarks, events, snapshot: engine.snapshot() })

    if (started - this.lastPerfAt >= PERF_INTERVAL_MS) {
      this.lastPerfAt = started
      this.listeners.onPerf(this.perf.sample(started))
    }
    this.schedule()
  }

  private finish(): void {
    if (this.ended) return
    this.ended = true
    this.listeners.onPerf(this.perf.sample(this.deps.scheduler.now()))
    this.listeners.onEnded?.()
  }
}
```

- [ ] **Step 4: Run, expect 6 passed.** If the idle-throttle test fails, check that `targetFpsFor` is evaluated from the engine snapshot *before* inference (state is IDLE for angle 30 since it never reaches `upAngle`).

- [ ] **Step 5: Commit**

```bash
git add src/features/rep-counter/application/rep-session.ts src/features/rep-counter/application/rep-session.test.ts
git commit -m "feat(application): add RepSession use-case with fake-clock tests"
```

---

### Task 7: Infrastructure adapters and composition root

**Files:**
- Create: `infrastructure/mediapipe-pose-detector.ts`, `infrastructure/camera-source.ts`, `infrastructure/video-source.ts`, `infrastructure/browser-frame-scheduler.ts`, `infrastructure/create-session.ts`

No unit tests (browser/WebGL). Exercised by Task 8 manual run and Task 12 smoke.

**Interfaces:**
- Produces: `createMediaPipeDetector(): Promise<PoseDetector>`, `createCameraSource(video: HTMLVideoElement): Promise<FrameSource>`, `createVideoSource(video: HTMLVideoElement, url: string): Promise<FrameSource>`, `createBrowserScheduler(video: HTMLVideoElement): FrameScheduler`, `createSession(opts: { video: HTMLVideoElement; exercise: ExerciseId; clipUrl: string | null; listeners: SessionListeners }): Promise<{ session: RepSession; dispose(): void }>`.

- [ ] **Step 1: `infrastructure/mediapipe-pose-detector.ts`**

```ts
import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision"
import type { Landmark } from "../domain/types"
import type { Delegate, PoseDetector, VideoFrameLike } from "../application/ports"

const WASM_ROOT = "/wasm"
const MODEL_PATH = "/models/pose_landmarker_lite.task"
const CONFIDENCE = 0.5

async function build(delegate: Delegate): Promise<PoseLandmarker> {
  const vision = await FilesetResolver.forVisionTasks(WASM_ROOT)
  return PoseLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: MODEL_PATH, delegate },
    runningMode: "VIDEO",
    numPoses: 1,
    minPoseDetectionConfidence: CONFIDENCE,
    minPosePresenceConfidence: CONFIDENCE,
    minTrackingConfidence: CONFIDENCE,
  })
}

class MediaPipePoseDetector implements PoseDetector {
  constructor(private readonly landmarker: PoseLandmarker, readonly delegate: Delegate) {}

  detect(input: VideoFrameLike, timestampMs: number): Landmark[] | null {
    const result = this.landmarker.detectForVideo(input as HTMLVideoElement, timestampMs)
    const pose = result.landmarks[0]
    if (!pose) return null
    return pose.map((l) => ({ x: l.x, y: l.y, z: l.z, visibility: l.visibility ?? 0 }))
  }

  close(): void { this.landmarker.close() }
}

/** GPU first; on any failure fall back to CPU and report which delegate is active. */
export async function createMediaPipeDetector(): Promise<PoseDetector> {
  try {
    return new MediaPipePoseDetector(await build("GPU"), "GPU")
  } catch (gpuError) {
    console.warn("[repstate] GPU delegate failed, falling back to CPU", gpuError)
    return new MediaPipePoseDetector(await build("CPU"), "CPU")
  }
}
```

- [ ] **Step 2: `infrastructure/camera-source.ts` and `infrastructure/video-source.ts`**

`camera-source.ts`:

```ts
import type { FrameSource } from "../application/ports"

const CAMERA_CONSTRAINTS: MediaStreamConstraints = { video: { facingMode: "user", width: 640, height: 480 }, audio: false }

function whenMetadataLoaded(video: HTMLVideoElement): Promise<void> {
  if (video.readyState >= HTMLMediaElement.HAVE_METADATA) return Promise.resolve()
  return new Promise((resolve) => video.addEventListener("loadedmetadata", () => resolve(), { once: true }))
}

export { whenMetadataLoaded }

/** Attach the user-facing camera to `video` and start playback. Rejects when permission is denied. */
export async function createCameraSource(video: HTMLVideoElement): Promise<FrameSource> {
  const stream = await navigator.mediaDevices.getUserMedia(CAMERA_CONSTRAINTS)
  video.srcObject = stream
  video.muted = true
  video.playsInline = true
  await whenMetadataLoaded(video)
  await video.play()
  return {
    element: video,
    kind: "camera",
    stop: () => { stream.getTracks().forEach((t) => t.stop()); video.srcObject = null },
  }
}
```

`video-source.ts`:

```ts
import type { FrameSource } from "../application/ports"
import { whenMetadataLoaded } from "./camera-source"

/** Load a clip URL into `video` and play it once. */
export async function createVideoSource(video: HTMLVideoElement, url: string): Promise<FrameSource> {
  video.srcObject = null
  video.src = url
  video.muted = true
  video.playsInline = true
  video.loop = false
  await whenMetadataLoaded(video)
  await video.play()
  return {
    element: video,
    kind: "video",
    stop: () => { video.pause(); video.removeAttribute("src"); video.load() },
  }
}
```

- [ ] **Step 3: `infrastructure/browser-frame-scheduler.ts`**

```ts
import type { FrameScheduler } from "../application/ports"

type VideoWithFrameCallback = HTMLVideoElement & {
  requestVideoFrameCallback?: (cb: (now: number) => void) => number
  cancelVideoFrameCallback?: (handle: number) => void
}

/** Uses requestVideoFrameCallback when available (fires per decoded frame), else requestAnimationFrame. */
export function createBrowserScheduler(video: HTMLVideoElement): FrameScheduler {
  const v = video as VideoWithFrameCallback
  const hasRVFC = typeof v.requestVideoFrameCallback === "function"
  return {
    now: () => performance.now(),
    requestFrame: (cb) => (hasRVFC ? v.requestVideoFrameCallback!((now) => cb(now)) : requestAnimationFrame(cb)),
    cancelFrame: (h) => (hasRVFC ? v.cancelVideoFrameCallback!(h) : cancelAnimationFrame(h)),
    isHidden: () => document.hidden,
    onVisibilityChange: (cb) => {
      document.addEventListener("visibilitychange", cb)
      return () => document.removeEventListener("visibilitychange", cb)
    },
  }
}
```

- [ ] **Step 4: `infrastructure/create-session.ts`** (composition root; the only place that knows every adapter)

```ts
import { getExercise } from "../domain/exercises"
import { RepEngine } from "../domain/rep-engine"
import type { ExerciseId } from "../domain/types"
import { RepSession } from "../application/rep-session"
import type { SessionListeners } from "../application/rep-session"
import { createBrowserScheduler } from "./browser-frame-scheduler"
import { createCameraSource } from "./camera-source"
import { createMediaPipeDetector } from "./mediapipe-pose-detector"
import { createVideoSource } from "./video-source"

export type CreateSessionOptions = {
  video: HTMLVideoElement
  exercise: ExerciseId
  /** null → live camera */
  clipUrl: string | null
  listeners: SessionListeners
}

/** Wire detector, source, scheduler and engine into a started session. `dispose` releases everything. */
export async function createSession({ video, exercise, clipUrl, listeners }: CreateSessionOptions): Promise<{ session: RepSession; dispose(): void }> {
  const detector = await createMediaPipeDetector()
  let source
  try {
    source = clipUrl ? await createVideoSource(video, clipUrl) : await createCameraSource(video)
  } catch (error) {
    detector.close()
    throw error
  }
  const session = new RepSession(
    { source, detector, scheduler: createBrowserScheduler(video), engine: new RepEngine(getExercise(exercise)) },
    listeners,
  )
  session.start()
  return {
    session,
    dispose: () => { session.stop(); source.stop(); detector.close() },
  }
}
```

- [ ] **Step 5: `pnpm typecheck && pnpm lint`** — expected clean.

- [ ] **Step 6: Commit**

```bash
git add src/features/rep-counter/infrastructure
git commit -m "feat(infrastructure): add MediaPipe detector, camera/video sources, browser scheduler, and session composition root"
```

---

### Task 8: Live demo UI with shadcn/ui

**Files:**
- Create: `ui/use-rep-session.ts`, `ui/rep-counter.tsx`, `ui/perf-hud.tsx`, `ui/skeleton-overlay.tsx`, `ui/exercise-picker.tsx`, `ui/camera-stage.tsx`, `ui/live-demo.tsx`
- Modify: `src/routes/index.tsx`

**Interfaces:**
- Consumes: Task 7 `createSession`; Task 3 `EXERCISE_IDS`, `getExercise`; shadcn `Button`, `Badge`, `Card*`, `Alert*`, `ToggleGroup*`; icons.
- Produces:
  - `useRepSession({ exercise, clipUrl, enabled })` → `{ videoRef, status, error, snapshot, landmarks, perf, restart, getLandmarks, markRender }`, `status: 'idle' | 'loading' | 'running' | 'error' | 'ended'`.
  - `CameraStage` (video + overlay + LOST/error/loading overlays), `RepCounter`, `PerfHud`, `ExercisePicker`, `SkeletonOverlay`, `LiveDemo`.

- [ ] **Step 1: `ui/use-rep-session.ts`**

```ts
import { useCallback, useEffect, useRef, useState } from "react"
import type { EngineEvent, ExerciseId, Landmark, Snapshot } from "../domain/types"
import type { PerfSample } from "../application/perf-tracker"
import type { RepSession } from "../application/rep-session"

export type SessionStatus = "idle" | "loading" | "running" | "error" | "ended"

const EMPTY_SNAPSHOT: Snapshot = { state: "IDLE", count: 0, angle: null, lastRepAt: null }

export type UseRepSessionOptions = { exercise: ExerciseId; clipUrl: string | null; enabled: boolean }

/** Owns the session lifecycle for a video element. Heavy modules are imported lazily so prerender never loads them. */
export function useRepSession({ exercise, clipUrl, enabled }: UseRepSessionOptions) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const sessionRef = useRef<RepSession | null>(null)
  const [status, setStatus] = useState<SessionStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const [snapshot, setSnapshot] = useState<Snapshot>(EMPTY_SNAPSHOT)
  const [landmarks, setLandmarks] = useState<Landmark[] | null>(null)
  const [perf, setPerf] = useState<PerfSample | null>(null)
  const [lastEvents, setLastEvents] = useState<EngineEvent[]>([])
  const [generation, setGeneration] = useState(0)

  const restart = useCallback(() => setGeneration((n) => n + 1), [])
  const getLandmarks = useCallback(() => sessionRef.current?.latestLandmarks() ?? null, [])
  const markRender = useCallback((at: number) => sessionRef.current?.markRender(at), [])

  useEffect(() => {
    const video = videoRef.current
    if (!enabled || !video) return
    let cancelled = false
    let dispose: (() => void) | null = null

    setStatus("loading"); setError(null); setSnapshot(EMPTY_SNAPSHOT); setLandmarks(null); setPerf(null)

    import("../infrastructure/create-session")
      .then(({ createSession }) =>
        createSession({
          video, exercise, clipUrl,
          listeners: {
            onFrame: ({ landmarks, events, snapshot }) => {
              setLandmarks(landmarks); setSnapshot(snapshot)
              if (events.length) setLastEvents(events)
            },
            onPerf: setPerf,
            onEnded: () => setStatus("ended"),
          },
        }),
      )
      .then((created) => {
        if (cancelled) { created.dispose(); return }
        sessionRef.current = created.session
        dispose = created.dispose
        setStatus("running")
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setStatus("error")
        setError(e instanceof Error ? e.message : String(e))
      })

    return () => { cancelled = true; sessionRef.current = null; dispose?.() }
  }, [enabled, exercise, clipUrl, generation])

  return { videoRef, status, error, snapshot, landmarks, perf, lastEvents, restart, getLandmarks, markRender }
}
```

- [ ] **Step 2: `ui/rep-counter.tsx`**

```tsx
import { Badge } from "@/components/ui/badge"
import type { Snapshot, State } from "../domain/types"

const STATE_VARIANT: Record<State, "secondary" | "default" | "outline" | "destructive"> = {
  IDLE: "secondary", READY: "default", DOWN: "outline", UP: "default", LOST: "destructive",
}

export function RepCounter({ snapshot }: { snapshot: Snapshot }) {
  return (
    <div className="flex items-baseline gap-4">
      <output className="text-7xl font-bold tabular-nums" data-testid="rep-count" aria-live="polite" aria-atomic="true" aria-label="Rep count">
        {snapshot.count}
      </output>
      <Badge variant={STATE_VARIANT[snapshot.state]} data-testid="state">{snapshot.state}</Badge>
      {snapshot.angle !== null && <span className="text-muted-foreground text-sm tabular-nums">{Math.round(snapshot.angle)}°</span>}
    </div>
  )
}
```

- [ ] **Step 3: `ui/perf-hud.tsx`**

```tsx
import { Card, CardContent } from "@/components/ui/card"
import type { PerfSample } from "../application/perf-tracker"

const METRICS: { label: string; value: (p: PerfSample) => string }[] = [
  { label: "render fps", value: (p) => String(p.renderFps) },
  { label: "infer fps", value: (p) => String(p.inferenceFps) },
  { label: "infer p50", value: (p) => `${p.inferenceP50.toFixed(1)} ms` },
  { label: "infer p95", value: (p) => `${p.inferenceP95.toFixed(1)} ms` },
  { label: "dropped", value: (p) => String(p.dropped) },
  { label: "delegate", value: (p) => p.delegate },
]

export function PerfHud({ perf }: { perf: PerfSample | null }) {
  return (
    <Card data-testid="hud">
      <CardContent className="grid grid-cols-3 gap-3 pt-4 sm:grid-cols-6">
        {METRICS.map(({ label, value }) => (
          <div key={label} className="flex flex-col">
            <span className="text-muted-foreground text-[10px] uppercase">{label}</span>
            <span className="font-mono text-sm tabular-nums">{perf ? value(perf) : "–"}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 4: `ui/skeleton-overlay.tsx`** (own rAF loop; reads landmarks via getter, never React state)

```tsx
import { useEffect, useRef } from "react"
import type { Landmark } from "../domain/types"

const CONNECTIONS: [number, number][] = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24],
  [23, 25], [25, 27], [24, 26], [26, 28],
]
const MIN_DRAW_VISIBILITY = 0.5
const BONE = "rgb(16 185 129 / 0.9)"
const JOINT = "rgb(245 158 11 / 0.95)"

export type SkeletonOverlayProps = {
  getLandmarks: () => Landmark[] | null
  onRender?: (at: number) => void
  width: number
  height: number
  highlight: number[]
  active: boolean
}

export function SkeletonOverlay({ getLandmarks, onRender, width, height, highlight, active }: SkeletonOverlayProps) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx || !active) return
    let raf = 0
    const draw = (at: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const landmarks = getLandmarks()
      if (landmarks) paint(ctx, canvas, landmarks, highlight)
      onRender?.(at)
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [getLandmarks, onRender, highlight, active])
  return <canvas ref={ref} width={width} height={height} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" />
}

function paint(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, landmarks: Landmark[], highlight: number[]) {
  ctx.lineWidth = 3
  ctx.strokeStyle = BONE
  for (const [a, b] of CONNECTIONS) {
    const p = landmarks[a], q = landmarks[b]
    if (!p || !q || p.visibility < MIN_DRAW_VISIBILITY || q.visibility < MIN_DRAW_VISIBILITY) continue
    ctx.beginPath(); ctx.moveTo(p.x * canvas.width, p.y * canvas.height); ctx.lineTo(q.x * canvas.width, q.y * canvas.height); ctx.stroke()
  }
  ctx.fillStyle = JOINT
  for (const i of highlight) {
    const p = landmarks[i]
    if (!p || p.visibility < MIN_DRAW_VISIBILITY) continue
    ctx.beginPath(); ctx.arc(p.x * canvas.width, p.y * canvas.height, 6, 0, Math.PI * 2); ctx.fill()
  }
}
```

- [ ] **Step 5: `ui/exercise-picker.tsx`** (shadcn ToggleGroup, single select)

```tsx
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { EXERCISE_IDS, getExercise } from "../domain/exercises"
import type { ExerciseId } from "../domain/types"

export function ExercisePicker({ value, onChange }: { value: ExerciseId; onChange: (id: ExerciseId) => void }) {
  return (
    <ToggleGroup type="single" value={value} onValueChange={(v) => { if (v) onChange(v as ExerciseId) }} aria-label="Exercise" variant="outline">
      {EXERCISE_IDS.map((id) => (
        <ToggleGroupItem key={id} value={id} aria-label={getExercise(id).label}>{getExercise(id).label}</ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
```

- [ ] **Step 6: `ui/camera-stage.tsx`** (video + overlay + status layers)

```tsx
import type { RefObject } from "react"
import { Link } from "@tanstack/react-router"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertIcon } from "@/components/ui/icons"
import type { ExerciseDef, Landmark, Snapshot } from "../domain/types"
import { SkeletonOverlay } from "./skeleton-overlay"
import type { SessionStatus } from "./use-rep-session"

const STAGE_WIDTH = 640
const STAGE_HEIGHT = 480

export type CameraStageProps = {
  videoRef: RefObject<HTMLVideoElement | null>
  status: SessionStatus
  error: string | null
  snapshot: Snapshot
  exercise: ExerciseDef
  getLandmarks: () => Landmark[] | null
  markRender: (at: number) => void
  highlight: number[]
  /** Shown in the error overlay; omit on the benchmark page. */
  fallbackLink?: boolean
}

export function CameraStage({ videoRef, status, error, snapshot, exercise, getLandmarks, markRender, highlight, fallbackLink = true }: CameraStageProps) {
  return (
    <div className="bg-muted relative aspect-[4/3] w-full max-w-2xl overflow-hidden rounded-lg">
      <video ref={videoRef} className="h-full w-full object-contain" playsInline muted />
      <SkeletonOverlay getLandmarks={getLandmarks} onRender={markRender} width={STAGE_WIDTH} height={STAGE_HEIGHT} highlight={highlight} active={status === "running"} />
      {snapshot.state === "LOST" && (
        <Alert variant="destructive" className="absolute inset-x-2 bottom-2" role="status">
          <AlertIcon />
          <AlertTitle>Pose lost</AlertTitle>
          <AlertDescription>{exercise.lostHint}</AlertDescription>
        </Alert>
      )}
      {status === "error" && (
        <div className="bg-background/90 absolute inset-0 flex items-center justify-center p-4">
          <Alert variant="destructive" role="alert">
            <AlertIcon />
            <AlertTitle>Camera unavailable</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            {fallbackLink && <Button asChild variant="link" className="px-0"><Link to="/benchmark">Try the sample clips instead</Link></Button>}
          </Alert>
        </div>
      )}
      {status === "loading" && <p className="text-muted-foreground absolute inset-0 flex items-center justify-center" role="status">Loading model…</p>}
    </div>
  )
}
```

- [ ] **Step 7: `ui/live-demo.tsx`**

```tsx
import { useMemo, useState } from "react"
import { Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { CameraIcon, RefreshIcon } from "@/components/ui/icons"
import { getExercise } from "../domain/exercises"
import type { ExerciseId } from "../domain/types"
import { CameraStage } from "./camera-stage"
import { ExercisePicker } from "./exercise-picker"
import { PerfHud } from "./perf-hud"
import { RepCounter } from "./rep-counter"
import { useRepSession } from "./use-rep-session"

export function LiveDemo() {
  const [exerciseId, setExerciseId] = useState<ExerciseId>("squat")
  const [started, setStarted] = useState(false)
  const session = useRepSession({ exercise: exerciseId, clipUrl: null, enabled: started })
  const exercise = getExercise(exerciseId)
  const highlight = useMemo(() => exercise.joints.flat(), [exercise])

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Deterministic rep counting in the browser</h1>
        <p className="text-muted-foreground max-w-2xl">
          MediaPipe pose landmarks feed a pure-TypeScript finite-state machine. No server, nothing leaves your device.
          HUD numbers are measured live; reproducible numbers are on the <Link to="/benchmark" className="underline">benchmark page</Link>.
        </p>
      </section>

      <div className="flex flex-wrap items-center gap-4">
        <ExercisePicker value={exerciseId} onChange={setExerciseId} />
        {started
          ? <Button variant="outline" onClick={session.restart}><RefreshIcon /> Reset</Button>
          : <Button onClick={() => setStarted(true)}><CameraIcon /> Start camera</Button>}
      </div>

      <CameraStage
        videoRef={session.videoRef} status={session.status} error={session.error} snapshot={session.snapshot}
        exercise={exercise} getLandmarks={session.getLandmarks} markRender={session.markRender} highlight={highlight}
      />
      <RepCounter snapshot={session.snapshot} />
      <PerfHud perf={session.perf} />
    </div>
  )
}
```

- [ ] **Step 8: `src/routes/index.tsx`**

```tsx
import { createFileRoute } from "@tanstack/react-router"
import { LiveDemo } from "@/features/rep-counter/ui/live-demo"
import { createMeta } from "@/lib/site"

export const Route = createFileRoute("/")({
  head: () => ({ meta: createMeta("Live demo") }),
  component: LiveDemo,
})
```

- [ ] **Step 9: Verify manually**

`pnpm dev` → `/`, Start camera, allow, do 5 squats. Expected: skeleton draws smoothly, state badge cycles READY→DOWN→UP→READY, count 5, HUD render fps ≈ display rate (~60) while infer fps ≤ 30, infer fps ≤ 10 after stepping out of frame (LOST alert visible). Deny camera in another tab: destructive alert with link. `pnpm typecheck && pnpm lint`.

- [ ] **Step 10: Commit**

```bash
git add src/features/rep-counter/ui src/routes/index.tsx
git commit -m "feat(ui): add live demo with shadcn controls, skeleton overlay, rep counter, and perf HUD"
```

---

### Task 9: Benchmark feature

**Files:**
- Create: `public/clips/squat-10.webm`, `public/clips/pushup-10.webm` (manual), `src/features/benchmark/domain/clips.ts`, `domain/benchmark-report.ts` (+test), `infrastructure/download-json.ts`, `ui/clip-runner.tsx`, `ui/benchmark-actions.tsx`, `ui/benchmark-page.tsx`, `src/routes/benchmark.tsx`

**Interfaces:**
- `ClipSpec = { clip: string; exercise: ExerciseId; groundTruth: number }`, `CLIPS: ClipSpec[]`, `clipUrl(spec)`.
- `ClipResult = ClipSpec & { detected; renderFps; inferenceFps; inferenceP50; inferenceP95; dropped; delegate }`, `BenchmarkReport = { version: 1; date; userAgent; hardwareConcurrency; results: ClipResult[] }`, `buildReport(results, env)`, `toReadmeRows(report)`.
- `downloadJson(name, data)`.
- Route search: `{ record: boolean }`.

- [ ] **Step 1: Record clips (manual)**

Side-on, full body, plain background, exactly 10 clean reps, 20–30 s:

```bash
ffmpeg -i squat-raw.mp4 -vf "scale=640:-2,fps=30" -c:v libvpx-vp9 -b:v 600k -an public/clips/squat-10.webm
ffmpeg -i pushup-raw.mp4 -vf "scale=640:-2,fps=30" -c:v libvpx-vp9 -b:v 600k -an public/clips/pushup-10.webm
```

- [ ] **Step 2: `domain/clips.ts`**

```ts
import type { ExerciseId } from "@/features/rep-counter/domain/types"

export type ClipSpec = { clip: string; exercise: ExerciseId; groundTruth: number }

export const CLIPS: ClipSpec[] = [
  { clip: "squat-10", exercise: "squat", groundTruth: 10 },
  { clip: "pushup-10", exercise: "pushup", groundTruth: 10 },
]

export const clipUrl = (spec: ClipSpec): string => `/clips/${spec.clip}.webm`
```

- [ ] **Step 3: Failing test `domain/benchmark-report.test.ts`**

```ts
import { describe, expect, it } from "vitest"
import { buildReport, toReadmeRows } from "./benchmark-report"
import type { ClipResult } from "./benchmark-report"

const result: ClipResult = { clip: "squat-10", exercise: "squat", groundTruth: 10, detected: 10, renderFps: 60, inferenceFps: 29, inferenceP50: 12.3, inferenceP95: 18.9, dropped: 4, delegate: "GPU" }

describe("benchmark report", () => {
  it("builds a versioned report with environment", () => {
    const r = buildReport([result], { date: "2026-10-10", userAgent: "UA", hardwareConcurrency: 8 })
    expect(r).toEqual({ version: 1, date: "2026-10-10", userAgent: "UA", hardwareConcurrency: 8, results: [result] })
  })
  it("renders one markdown row per clip", () => {
    const r = buildReport([result], { date: "2026-10-10", userAgent: "UA", hardwareConcurrency: 8 })
    expect(toReadmeRows(r)).toBe("| squat-10 | 10/10 | 60 / 29 | 12.3 / 18.9 | 4 | GPU | 2026-10-10 | UA (8 cores) |")
  })
})
```

- [ ] **Step 4: `domain/benchmark-report.ts`**

```ts
import type { Delegate } from "@/features/rep-counter/application/ports"
import type { ClipSpec } from "./clips"

export type ClipResult = ClipSpec & {
  detected: number
  renderFps: number
  inferenceFps: number
  inferenceP50: number
  inferenceP95: number
  dropped: number
  delegate: Delegate
}

export type ReportEnvironment = { date: string; userAgent: string; hardwareConcurrency: number }

export type BenchmarkReport = ReportEnvironment & { version: 1; results: ClipResult[] }

/** Assemble the exportable report; pure so it is testable without a browser. */
export function buildReport(results: ClipResult[], env: ReportEnvironment): BenchmarkReport {
  return { version: 1, ...env, results }
}

/** Markdown table rows matching the README benchmark table header. */
export function toReadmeRows(report: BenchmarkReport): string {
  return report.results
    .map((r) => `| ${r.clip} | ${r.detected}/${r.groundTruth} | ${r.renderFps} / ${r.inferenceFps} | ${r.inferenceP50.toFixed(1)} / ${r.inferenceP95.toFixed(1)} | ${r.dropped} | ${r.delegate} | ${report.date} | ${report.userAgent} (${report.hardwareConcurrency} cores) |`)
    .join("\n")
}
```

Run `pnpm vitest run src/features/benchmark` → 2 passed.

- [ ] **Step 5: `infrastructure/download-json.ts`**

```ts
/** Trigger a browser download of `data` as pretty-printed JSON. */
export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement("a"), { href: url, download: filename })
  a.click()
  URL.revokeObjectURL(url)
}
```

- [ ] **Step 6: `ui/clip-runner.tsx`**

```tsx
import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlayIcon, RefreshIcon } from "@/components/ui/icons"
import { getExercise } from "@/features/rep-counter/domain/exercises"
import type { Frame } from "@/features/rep-counter/domain/types"
import { CameraStage } from "@/features/rep-counter/ui/camera-stage"
import { PerfHud } from "@/features/rep-counter/ui/perf-hud"
import { RepCounter } from "@/features/rep-counter/ui/rep-counter"
import { useRepSession } from "@/features/rep-counter/ui/use-rep-session"
import type { ClipResult } from "../domain/benchmark-report"
import { clipUrl } from "../domain/clips"
import type { ClipSpec } from "../domain/clips"

export type ClipRunnerProps = {
  spec: ClipSpec
  /** When true, landmark frames are collected for fixture export. */
  record: boolean
  onDone: (result: ClipResult, frames: Frame[]) => void
}

export function ClipRunner({ spec, record, onDone }: ClipRunnerProps) {
  const [enabled, setEnabled] = useState(false)
  const session = useRepSession({ exercise: spec.exercise, clipUrl: clipUrl(spec), enabled })
  const exercise = getExercise(spec.exercise)
  const highlight = useMemo(() => exercise.joints.flat(), [exercise])
  const frames = useRef<Frame[]>([])
  const reported = useRef(false)

  useEffect(() => {
    if (record && session.landmarks && session.status === "running") frames.current.push({ t: performance.now(), landmarks: session.landmarks })
  }, [session.landmarks, record, session.status])

  useEffect(() => {
    if (session.status !== "ended" || reported.current || !session.perf) return
    reported.current = true
    const { renderFps, inferenceFps, inferenceP50, inferenceP95, dropped, delegate } = session.perf
    onDone({ ...spec, detected: session.snapshot.count, renderFps, inferenceFps, inferenceP50, inferenceP95, dropped, delegate }, frames.current)
  }, [session.status, session.perf, session.snapshot.count, spec, onDone])

  const run = () => { frames.current = []; reported.current = false; enabled ? session.restart() : setEnabled(true) }

  return (
    <Card data-testid={`clip-${spec.clip}`}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{exercise.label} · {spec.clip} · ground truth {spec.groundTruth}</CardTitle>
        <Button size="sm" onClick={run} data-testid={`run-${spec.clip}`}>
          {enabled ? <><RefreshIcon /> Run again</> : <><PlayIcon /> Run</>}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <CameraStage
          videoRef={session.videoRef} status={session.status} error={session.error} snapshot={session.snapshot}
          exercise={exercise} getLandmarks={session.getLandmarks} markRender={session.markRender} highlight={highlight} fallbackLink={false}
        />
        <RepCounter snapshot={session.snapshot} />
        <PerfHud perf={session.perf} />
        <p className="text-muted-foreground text-xs" data-testid={`status-${spec.clip}`}>{session.status}</p>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 7: `ui/benchmark-actions.tsx`**

```tsx
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { CopyIcon, DownloadIcon } from "@/components/ui/icons"
import type { Frame } from "@/features/rep-counter/domain/types"
import { buildReport, toReadmeRows } from "../domain/benchmark-report"
import type { ClipResult } from "../domain/benchmark-report"
import { downloadJson } from "../infrastructure/download-json"

export type BenchmarkActionsProps = { results: ClipResult[]; recordings: Record<string, Frame[]> }

export function BenchmarkActions({ results, recordings }: BenchmarkActionsProps) {
  const report = () => buildReport(results, {
    date: new Date().toISOString().slice(0, 10),
    userAgent: navigator.userAgent,
    hardwareConcurrency: navigator.hardwareConcurrency ?? 0,
  })
  const disabled = results.length === 0
  return (
    <div className="flex flex-wrap gap-3">
      <Button variant="outline" disabled={disabled} onClick={() => { const r = report(); downloadJson(`benchmark-${r.date}.json`, r) }}>
        <DownloadIcon /> Export JSON
      </Button>
      <Button variant="outline" disabled={disabled} onClick={async () => { await navigator.clipboard.writeText(toReadmeRows(report())); toast.success("README rows copied") }}>
        <CopyIcon /> Copy README rows
      </Button>
      {Object.entries(recordings).map(([clip, frames]) => (
        <Button key={clip} variant="secondary" onClick={() => downloadJson(`${clip}.json`, frames)}>
          <DownloadIcon /> Landmarks: {clip}
        </Button>
      ))}
    </div>
  )
}
```

- [ ] **Step 8: `ui/benchmark-page.tsx` and `src/routes/benchmark.tsx`**

`benchmark-page.tsx`:

```tsx
import { useCallback, useState } from "react"
import type { Frame } from "@/features/rep-counter/domain/types"
import type { ClipResult } from "../domain/benchmark-report"
import { CLIPS } from "../domain/clips"
import { BenchmarkActions } from "./benchmark-actions"
import { ClipRunner } from "./clip-runner"

export function BenchmarkPage({ record }: { record: boolean }) {
  const [results, setResults] = useState<Record<string, ClipResult>>({})
  const [recordings, setRecordings] = useState<Record<string, Frame[]>>({})

  const onDone = useCallback((r: ClipResult, frames: Frame[]) => {
    setResults((prev) => ({ ...prev, [r.clip]: r }))
    if (frames.length) setRecordings((prev) => ({ ...prev, [r.clip]: frames }))
  }, [])

  const ordered = CLIPS.map((c) => results[c.clip]).filter((r): r is ClipResult => Boolean(r))

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Benchmark</h1>
        <p className="text-muted-foreground max-w-2xl">
          Each clip has a known rep count. Run it through the real pipeline on your device; the numbers are what this machine measured.
          Engine correctness is proven separately in CI against recorded landmark fixtures.
        </p>
      </section>
      {CLIPS.map((spec) => <ClipRunner key={spec.clip} spec={spec} record={record} onDone={onDone} />)}
      <BenchmarkActions results={ordered} recordings={recordings} />
    </div>
  )
}
```

`src/routes/benchmark.tsx`:

```tsx
import { createFileRoute } from "@tanstack/react-router"
import { BenchmarkPage } from "@/features/benchmark/ui/benchmark-page"
import { createMeta } from "@/lib/site"

type BenchmarkSearch = { record: boolean }

export const Route = createFileRoute("/benchmark")({
  validateSearch: (search: Record<string, unknown>): BenchmarkSearch => ({ record: search.record === "1" || search.record === 1 || search.record === true }),
  head: () => ({ meta: createMeta("Benchmark", "Replay bundled clips through the real pipeline and export reproducible numbers.") }),
  component: () => <BenchmarkPage record={Route.useSearch().record} />,
})
```

- [ ] **Step 9: Verify**

`pnpm dev` → `/benchmark`, Run both. Expected: status `ended`, `10/10` each, Export JSON downloads, Copy shows toast. If a clip is not 10/10, re-record it rather than changing thresholds. `pnpm typecheck && pnpm lint && pnpm test`.

- [ ] **Step 10: Commit**

```bash
git add public/clips src/features/benchmark src/routes/benchmark.tsx
git commit -m "feat(benchmark): add clip replay page with report export and landmark recorder"
```

---

### Task 10: Landmark fixtures and fixture tests

**Files:**
- Create: `fixtures/landmarks/squat-10.json`, `squat-10.meta.json`, `pushup-10.json`, `pushup-10.meta.json`, `src/features/rep-counter/domain/fixtures.test.ts`

- [ ] **Step 1: Record** — `pnpm dev`, open `/benchmark?record=1`, Run each clip to the end, click "Landmarks: squat-10" and "Landmarks: pushup-10".

```bash
mkdir -p fixtures/landmarks && mv ~/Downloads/squat-10.json ~/Downloads/pushup-10.json fixtures/landmarks/
node -e '
for (const n of ["squat-10","pushup-10"]) {
  const p=`fixtures/landmarks/${n}.json`; const f=JSON.parse(require("fs").readFileSync(p));
  const t0=f[0].t; for (const fr of f) fr.t=Math.round(fr.t-t0);
  require("fs").writeFileSync(p, JSON.stringify(f));
}'
```

`squat-10.meta.json` (and `pushup-10.meta.json` with `"exercise": "pushup"`):

```json
{ "groundTruthReps": 10, "exercise": "squat", "recordedWith": { "model": "pose_landmarker_lite float16", "delegate": "GPU", "date": "2026-10-10" } }
```

- [ ] **Step 2: `domain/fixtures.test.ts`**

```ts
import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { EXERCISES } from "./exercises"
import { RepEngine } from "./rep-engine"
import type { EngineEvent, ExerciseId, Frame } from "./types"

type Meta = { groundTruthReps: number; exercise: ExerciseId }
const MAX_ENGINE_COST_US = 100

function load(name: string) {
  const frames = JSON.parse(readFileSync(`fixtures/landmarks/${name}.json`, "utf8")) as Frame[]
  const meta = JSON.parse(readFileSync(`fixtures/landmarks/${name}.meta.json`, "utf8")) as Meta
  return { frames, meta }
}

describe.each(["squat-10", "pushup-10"])("fixture %s", (name) => {
  const { frames, meta } = load(name)
  const def = EXERCISES[meta.exercise]
  const events = (): EngineEvent[] => { const e = new RepEngine(def); return frames.flatMap((f) => e.step(f)) }

  it("counts exactly the ground-truth reps", () => {
    expect(events().filter((e) => e.type === "rep")).toHaveLength(meta.groundTruthReps)
  })
  it("never emits two reps closer than minDwellMs", () => {
    const reps = events().filter((e): e is Extract<EngineEvent, { type: "rep" }> => e.type === "rep")
    for (let i = 1; i < reps.length; i++) expect(reps[i].t - reps[i - 1].t).toBeGreaterThanOrEqual(def.minDwellMs)
  })
  it("produces a stable state sequence", () => {
    expect(events().filter((e) => e.type === "state").map((e) => (e as Extract<EngineEvent, { type: "state" }>).to)).toMatchSnapshot()
  })
  it("processes the fixture far faster than real time", () => {
    const engine = new RepEngine(def)
    const started = performance.now()
    for (let i = 0; i < 20; i++) { engine.reset(); for (const f of frames) engine.step(f) }
    const perFrameUs = ((performance.now() - started) / (frames.length * 20)) * 1000
    console.info(`[${name}] engine cost ≈ ${perFrameUs.toFixed(2)} µs/frame over ${frames.length} frames`)
    expect(perFrameUs).toBeLessThan(MAX_ENGINE_COST_US)
  })
})
```

- [ ] **Step 3: Run** — `pnpm vitest run src/features/rep-counter/domain/fixtures.test.ts` → 8 passed, snapshots written. If count ≠ 10, re-record the clip; do not tune thresholds to one clip.

- [ ] **Step 4: Commit**

```bash
git add fixtures src/features/rep-counter/domain/fixtures.test.ts src/features/rep-counter/domain/__snapshots__
git commit -m "test(domain): add recorded landmark fixtures with accuracy and throughput checks"
```

---

### Task 11: How-it-works page

**Files:**
- Create: `src/features/docs/ui/fsm-diagram.tsx`, `src/features/docs/ui/thresholds-table.tsx`, `src/routes/how-it-works.tsx`

- [ ] **Step 1: `fsm-diagram.tsx`** (static SVG figure; a diagram, not an icon, so inline SVG is allowed here)

```tsx
const NODES = [
  { id: "IDLE", x: 60, y: 60 }, { id: "READY", x: 220, y: 60 }, { id: "DOWN", x: 380, y: 60 }, { id: "UP", x: 540, y: 60 }, { id: "LOST", x: 300, y: 200 },
] as const

const EDGES = [
  { d: "M100,60 L180,60", label: "visible ∧ angle ≥ up", x: 140, y: 45 },
  { d: "M260,60 L340,60", label: "angle ≤ down", x: 300, y: 45 },
  { d: "M420,60 L500,60", label: "angle ≥ up ∧ dwell ≥ 200 ms → rep", x: 460, y: 45 },
  { d: "M540,78 Q380,140 230,78", label: "next frame", x: 385, y: 120 },
  { d: "M380,78 Q300,110 230,78", label: "angle ≥ up, dwell < 200 ms (no rep)", x: 305, y: 100 },
  { d: "M220,78 L290,182", label: "3 low-visibility frames", x: 215, y: 140 },
  { d: "M330,182 L250,78", label: "3 good frames ∧ angle ≥ up", x: 330, y: 140 },
]

export function FsmDiagram() {
  return (
    <svg viewBox="0 0 640 260" role="img" aria-label="Rep engine state machine: IDLE to READY to DOWN to UP and back to READY; any state to LOST; LOST back to READY" className="w-full max-w-2xl">
      <defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" className="fill-muted-foreground" /></marker></defs>
      {EDGES.map((e) => (
        <g key={e.label}>
          <path d={e.d} className="stroke-muted-foreground fill-none" markerEnd="url(#arrow)" />
          <text x={e.x} y={e.y} textAnchor="middle" className="fill-current text-[11px]">{e.label}</text>
        </g>
      ))}
      {NODES.map((n) => (
        <g key={n.id}>
          <rect x={n.x - 40} y={n.y - 18} width={80} height={36} rx={8} className="fill-card stroke-border" />
          <text x={n.x} y={n.y + 5} textAnchor="middle" className="fill-current text-sm font-semibold">{n.id}</text>
        </g>
      ))}
    </svg>
  )
}
```

- [ ] **Step 2: `thresholds-table.tsx`** (shadcn Table)

```tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EXERCISE_IDS, getExercise } from "@/features/rep-counter/domain/exercises"

export function ThresholdsTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Exercise</TableHead><TableHead>Joints (angle at middle)</TableHead><TableHead>down ≤</TableHead><TableHead>up ≥</TableHead><TableHead>dwell</TableHead><TableHead>visibility ≥</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {EXERCISE_IDS.map(getExercise).map((d) => (
          <TableRow key={d.id}>
            <TableCell>{d.label}</TableCell>
            <TableCell>{d.joints.map((j) => j.join("–")).join(", ")}</TableCell>
            <TableCell>{d.downAngle}°</TableCell><TableCell>{d.upAngle}°</TableCell><TableCell>{d.minDwellMs} ms</TableCell><TableCell>{d.minVisibility}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

- [ ] **Step 3: `src/routes/how-it-works.tsx`**

```tsx
import { createFileRoute, Link } from "@tanstack/react-router"
import { Separator } from "@/components/ui/separator"
import { FsmDiagram } from "@/features/docs/ui/fsm-diagram"
import { ThresholdsTable } from "@/features/docs/ui/thresholds-table"
import { createMeta, site } from "@/lib/site"

export const Route = createFileRoute("/how-it-works")({
  head: () => ({ meta: createMeta("How it works", "Pipeline, state machine, thresholds, and how the numbers are proven.") }),
  component: HowItWorks,
})

function HowItWorks() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-3xl">
      <h1>How it works</h1>
      <h2>Pipeline</h2>
      <p>
        Camera or clip → MediaPipe PoseLandmarker (33 landmarks, GPU with CPU fallback) → <code>RepEngine.step(frame)</code> → events.
        Inference runs only when the adaptive budget allows: <code>budget = max(1000/target, p90(inference) × 1.2)</code>, where <code>target</code> is 30 fps while someone is in position and 10 fps while idle or lost.
        A slow device drops frames instead of queueing work. The skeleton overlay draws on its own animation-frame loop at display rate, so rendering never waits on inference.
      </p>
      <Separator />
      <h2>State machine</h2>
      <FsmDiagram />
      <p>Hysteresis (separate <em>down</em> and <em>up</em> thresholds) stops jitter from double counting. A 200 ms minimum dwell stops a fast bounce from counting. Angles are smoothed with an exponential moving average (α = 0.5) that resets when the pose is lost.</p>
      <h2>Angles and thresholds</h2>
      <ThresholdsTable />
      <p>When both sides are visible the smaller angle is used; when one side fails the visibility gate the other is used; when neither passes for three frames the engine enters <code>LOST</code>, freezes the counter, and discards any rep in progress.</p>
      <Separator />
      <h2>Proof</h2>
      <p>
        CI replays recorded landmark fixtures through the engine and asserts the exact rep count, the state sequence, and rep spacing. The <Link to="/benchmark">benchmark page</Link> runs the real pipeline on your device.
        Source: <a href={`${site.repoUrl}/tree/main/src/features/rep-counter/domain`}>domain/</a>, fixtures: <a href={`${site.repoUrl}/tree/main/fixtures`}>fixtures/</a>.
      </p>
    </article>
  )
}
```

- [ ] **Step 4: Verify and commit** — `pnpm dev` → `/how-it-works` renders diagram and table. `pnpm typecheck && pnpm lint`.

```bash
git add src/features/docs src/routes/how-it-works.tsx
git commit -m "feat(docs): add how-it-works page with FSM diagram and thresholds table"
```

---

### Task 12: Playwright smoke, Lighthouse CI, GitHub Actions

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

```bash
pnpm exec playwright install chromium && pnpm e2e
```

Expected: 1 passed (CPU delegate under SwiftShader is acceptable).

- [ ] **Step 3: `lighthouserc.json`**

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

`pnpm build && pnpm exec lhci autorun` → all ≥ 0.9. The model/WASM are only fetched after "Start camera", so the landing stays light.

- [ ] **Step 4: `.github/workflows/ci.yml`**

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

- [ ] **Step 5: Commit**

```bash
git add playwright.config.ts e2e lighthouserc.json .github
git commit -m "ci: add Playwright smoke, Lighthouse budget, and GitHub Actions"
```

---

### Task 13: README, benchmark artifact, deploy, portfolio entry

**Files:**
- Create: `benchmarks/2026-10-10-<device>.json`
- Modify: `README.md`; portfolio `src/data/projects.json`

- [ ] **Step 1: Produce the artifact** — run both clips on `/benchmark`, Export JSON → `benchmarks/2026-10-10-<short-device>.json`, Copy README rows.

- [ ] **Step 2: `README.md`**

```md
# Repstate

Squat and push-up rep counter that runs entirely in the browser. MediaPipe pose landmarks → a deterministic, pure-TypeScript finite-state machine → reps. Rendering decoupled from inference, inference on a two-axis adaptive budget. Nothing leaves your device.

Live: https://repstate.netlify.app · Benchmark: https://repstate.netlify.app/benchmark · How it works: https://repstate.netlify.app/how-it-works

## What this proves

| Claim | Evidence |
|---|---|
| Deterministic FSM rep engine, no React state in the hot path | [`domain/rep-engine.ts`](src/features/rep-counter/domain/rep-engine.ts), fixture tests in CI |
| Rendering decoupled from inference; adaptive inference budget (load + activity) | [`application/inference-budget.ts`](src/features/rep-counter/application/inference-budget.ts), [`ui/skeleton-overlay.tsx`](src/features/rep-counter/ui/skeleton-overlay.tsx), HUD, benchmark JSON |
| No false reps across recorded sessions | `fixtures/landmarks/*` replayed in CI: exact count, dwell spacing, state snapshot |
| Real MediaPipe pipeline with GPU→CPU fallback | [`infrastructure/mediapipe-pose-detector.ts`](src/features/rep-counter/infrastructure/mediapipe-pose-detector.ts) |
| Session loop unit-tested with fake clock and detector | [`application/rep-session.test.ts`](src/features/rep-counter/application/rep-session.test.ts) |
| Lighthouse ≥ 90 on landing | Lighthouse CI in `.github/workflows/ci.yml` |

## Architecture

`ui → application → domain`; `infrastructure` implements `application` ports (`PoseDetector`, `FrameSource`, `FrameScheduler`). `domain` has no browser, React, or MediaPipe imports (enforced by ESLint). shadcn/ui + Hugeicons for UI.

## Benchmark

Produced by `/benchmark` on the listed device; raw JSON in [`benchmarks/`](benchmarks/). Re-run on your machine and open a PR with your row.

| Clip | Detected / truth | Render / inference FPS | Inference p50 / p95 (ms) | Dropped | Delegate | Date | Device |
|---|---|---|---|---|---|---|---|
<PASTE ROWS FROM "Copy README rows">

Engine cost on fixtures (CI log): well under 100 µs per frame; inference, not the FSM, is the bottleneck.

## Develop

```bash
pnpm install        # also copies MediaPipe WASM to public/wasm
pnpm dev            # http://localhost:3000
pnpm test           # domain + application tests, including fixtures
pnpm e2e            # Playwright smoke on /benchmark
```

Record new fixtures: open `/benchmark?record=1`, run a clip, download landmarks, add the JSON and a `.meta.json` under `fixtures/landmarks/`.

## Scope

v1: squat, push-up, live camera, bundled clips, benchmark export. Not in v1: accounts, server, worker pipeline, form scoring, npm package.

## License

MIT
```

Replace the placeholder row, then `grep -n "<PASTE" README.md` must print nothing.

- [ ] **Step 3: Push and deploy**

```bash
git add README.md benchmarks && git commit -m "docs: add README with claims mapping and first benchmark artifact"
git remote add origin git@github.com:montasim/repstate.git && git push -u origin main
```

Netlify → Add new site → Import `montasim/repstate` (settings from `netlify.toml`), site name `repstate`. Verify `/benchmark` on the deployed URL shows `10/10` for both clips.

- [ ] **Step 4: Portfolio entry** (in `~/Work/Personal/v2/src/data/projects.json`, copy the `BugReceipt` object shape)

```json
{
  "id": "repstate",
  "title": "Repstate",
  "type": "website",
  "featured": true,
  "description": "Open-source browser rep counter: MediaPipe pose landmarks drive a deterministic finite-state-machine engine with a two-axis adaptive inference budget, render loop decoupled from inference, recorded-landmark fixture tests, and reproducible benchmarks.",
  "technologies": ["TanStack Start", "React 19", "TypeScript", "MediaPipe", "shadcn/ui", "Tailwind CSS", "Vitest", "Playwright", "GitHub Actions", "Netlify"],
  "topics": ["computer-vision", "mediapipe", "state-machine", "real-time", "local-first", "typescript"],
  "githubUrl": "https://github.com/montasim/repstate",
  "liveUrl": "https://repstate.netlify.app"
}
```

Run `pnpm test` in the portfolio repo, then `git commit -am "feat: add Repstate project entry"`.

---

## Self-Review

**Spec coverage:** §3 stack → Task 1 (plus shadcn/Hugeicons per user direction). §4.1 engine → Tasks 2–4. §4.2 pipeline → Tasks 5–7 (ports/application/infrastructure split; adaptive two-axis budget; render decoupling via `latestLandmarks`/`markRender`). §4.3 routes → Tasks 8, 9, 11, each with `head()` meta and `validateSearch` where needed. §4.4 fixtures/recorder → Tasks 9–10. §5 benchmark layers → Tasks 10 (CI) and 9/13 (browser). §6 error handling: camera denied / model failure → `CameraStage` destructive Alert with retry via Reset (Task 8); GPU fallback (Task 7); LOST alert (Task 8); tab hidden pause (Task 6, tested). §7 testing: synthetic (Task 4), fixtures (Task 10), fake-clock session (Task 6), budget (Task 5), Playwright + Lighthouse (Task 12). §8 a11y: `<output aria-live>`, labelled ToggleGroup, `role="status"/"alert"`, keyboard-operable shadcn controls. §12 independence note carried into Global Constraints.

**SOLID check:** SRP per file (one class/component each); OCP via `ExerciseDef` table (new exercise = data, no engine change); LSP/ISP via three small ports; DIP: `RepSession` depends on ports, `create-session.ts` is the single composition root.

**Placeholder scan:** README `<PASTE ROWS …>` is intentional with an explicit replacement step and grep check. No TBD/TODO elsewhere.

**Type consistency:** `PoseDetector.detect(input: VideoFrameLike, t)` implemented by `MediaPipePoseDetector` and `FakeDetector`; `FrameSource.element: VideoFrameLike` is an `HTMLVideoElement` at runtime (structural subset); `SessionListeners` shared by `RepSession`, `createSession`, `useRepSession`; `PerfSample` re-exported from `rep-session.ts` for test imports; `ClipResult` fields match `PerfSample` names; `SessionStatus` from `use-rep-session.ts` used by `CameraStage`; `EXERCISE_IDS` used by `ExercisePicker` and `ThresholdsTable`.
