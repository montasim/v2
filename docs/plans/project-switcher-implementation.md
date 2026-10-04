# Project Switcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a visitor on a project detail page open a GitHub-style dropdown from the breadcrumb, search all projects, and jump straight to another project's page.

**Architecture:** One new client component, `ProjectSwitcher`, renders a button in the last breadcrumb item. Clicking it opens a Radix Popover containing a `cmdk` command list (search box plus project list with logos). Selecting a project calls TanStack Router `navigate` to `/projects/$slug`. The project list comes from the existing content catalogs at module load, so there is no new data fetching.

**Tech Stack:** React 19, TanStack Router (`useNavigate`), `radix-ui` Popover (already installed, re-exported as `Popover` from `radix-ui`), `cmdk` (already installed; wrapped in `src/components/ui/command.tsx`), Tailwind CSS v4, Vitest + Testing Library (jsdom).

## Global Constraints

- No new dependencies. `radix-ui` `^1.6.7` and `cmdk` `^1.1.1` are already in `package.json`.
- Only list projects that have a detail page. `src/routes/projects_.$slug.tsx` throws `notFound()` when `projectCaseStudyCatalog.findByProjectId(project.id)` is undefined, so filter on that.
- Link slugs must match the route: the route resolves `projectCatalog.findBySlug(params.slug)`, which keys projects by `project.id.replace(/^project-/, "")`. Use exactly that derivation.
- List order is `projectCatalog.records` (the curated hiring-priority order used on the Projects page). One flat list, no grouping.
- Breadcrumb label is the project title only (no "details" suffix); the page `<title>` keeps "… details".
- Accessibility: the trigger is a real `<button>` with `aria-haspopup="dialog"`, `aria-expanded` (Radix sets both) and `aria-current="page"`; the search input is focused when the popover opens; Esc closes it; arrow keys plus Enter work (cmdk default).
- Code style: Prettier (`pnpm check`), ESLint (`pnpm lint`), and TypeScript (`pnpm typecheck`) must pass. Match surrounding file conventions: named exports, `cn()` for class merging, icons from `@/components/ui/icons`.

## File Structure

| File                                                                      | Responsibility                                                                                                  |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `src/components/portfolio/project-switcher.tsx` (create)                  | `ProjectSwitcher` component and the module-level `projectSwitcherOptions` list                                  |
| `src/components/portfolio/project-switcher.test.tsx` (create)             | Behaviour tests: open, current item marked, search filtering, keyboard and click navigation, detail-page filter |
| `src/components/portfolio/project-detail-page.tsx` (modify, lines ~55-75) | Replace the last `BreadcrumbPage` with `ProjectSwitcher`                                                        |

---

### Task 1: `ProjectSwitcher` component

**Files:**

- Create: `src/components/portfolio/project-switcher.tsx`
- Test: `src/components/portfolio/project-switcher.test.tsx`

**Interfaces:**

- Consumes: `projectCatalog.records`, `projectCatalog.findBySlug(slug)` from `@/lib/content/projects`; `projectCaseStudyCatalog.findByProjectId(id)` from `@/lib/content/project-case-studies`; `ProjectTypeIcon({ type, className })` from `@/components/portfolio/project-type-icon`; `Command` primitives from `cmdk` and `CommandInput`, `CommandList`, `CommandEmpty`, `CommandItem` from `@/components/ui/command`.
- Produces:
  - `export type ProjectSwitcherOption = { slug: string; title: string; type: Project["type"]; logoUrl?: string }`
  - `export const projectSwitcherOptions: readonly ProjectSwitcherOption[]`
  - `export function ProjectSwitcher({ current, label }: { current: Project; label: string }): JSX.Element`

- [ ] **Step 1: Write the failing tests**

Create `src/components/portfolio/project-switcher.test.tsx`:

```tsx
// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  ProjectSwitcher,
  projectSwitcherOptions,
} from "@/components/portfolio/project-switcher"
import { projectCaseStudyCatalog } from "@/lib/content/project-case-studies"
import { projectCatalog } from "@/lib/content/projects"

const navigate = vi.hoisted(() => vi.fn())

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
}))

const current = projectCatalog.findBySlug("postcraft")!

function openSwitcher() {
  render(<ProjectSwitcher current={current} label={current.title} />)
  fireEvent.click(screen.getByRole("button", { name: /PostCraft/ }))
}

describe("ProjectSwitcher", () => {
  beforeEach(() => {
    navigate.mockClear()
    // cmdk and Radix popper rely on these browser APIs, missing in jsdom.
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
    })
    Object.defineProperty(window, "ResizeObserver", {
      configurable: true,
      value: class MockResizeObserver {
        observe = vi.fn()
        unobserve = vi.fn()
        disconnect = vi.fn()
      },
    })
  })

  afterEach(cleanup)

  it("lists only projects that have a detail page, with route slugs", () => {
    expect(projectSwitcherOptions.length).toBeGreaterThan(1)
    for (const option of projectSwitcherOptions) {
      const project = projectCatalog.findBySlug(option.slug)
      expect(project?.title).toBe(option.title)
      expect(projectCaseStudyCatalog.findByProjectId(project!.id)).toBeDefined()
    }
  })

  it("opens a searchable list with the current project marked", () => {
    openSwitcher()

    expect(
      screen
        .getByRole("button", { name: /PostCraft/ })
        .getAttribute("aria-current")
    ).toBe("page")
    const search = screen.getByPlaceholderText("Find a project…")
    expect(document.activeElement).toBe(search)
    expect(
      screen.getByRole("option", { name: /PostCraft/ }).dataset.current
    ).toBe("true")
    expect(screen.getAllByRole("option")).toHaveLength(
      projectSwitcherOptions.length
    )
  })

  it("filters projects as you type", () => {
    openSwitcher()

    fireEvent.change(screen.getByPlaceholderText("Find a project…"), {
      target: { value: "bugrec" },
    })

    expect(screen.getByRole("option", { name: /BugReceipt/ })).toBeTruthy()
    expect(screen.queryByRole("option", { name: /PostCraft/ })).toBeNull()
  })

  it("shows an empty state when nothing matches", () => {
    openSwitcher()

    fireEvent.change(screen.getByPlaceholderText("Find a project…"), {
      target: { value: "zzzz-no-project" },
    })

    expect(screen.getByText("No projects found.")).toBeTruthy()
  })

  it("navigates to the chosen project's page", () => {
    openSwitcher()

    fireEvent.click(screen.getByRole("option", { name: /BugReceipt/ }))

    expect(navigate).toHaveBeenCalledWith({
      to: "/projects/$slug",
      params: { slug: "bugreceipt" },
    })
  })

  it("does not navigate when the current project is chosen", () => {
    openSwitcher()

    fireEvent.click(screen.getByRole("option", { name: /PostCraft/ }))

    expect(navigate).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm vitest run src/components/portfolio/project-switcher.test.tsx`
Expected: FAIL with `Failed to resolve import "@/components/portfolio/project-switcher"`.

- [ ] **Step 3: Write the implementation**

Create `src/components/portfolio/project-switcher.tsx`:

```tsx
import { useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { Command } from "cmdk"
import { Popover } from "radix-ui"

import { ProjectTypeIcon } from "@/components/portfolio/project-type-icon"
import {
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { CaretDownIcon, CheckIcon } from "@/components/ui/icons"
import { projectCaseStudyCatalog } from "@/lib/content/project-case-studies"
import { projectCatalog } from "@/lib/content/projects"
import type { Project } from "@/lib/content/projects"
import { cn } from "@/lib/utils"

export type ProjectSwitcherOption = {
  slug: string
  title: string
  type: Project["type"]
  logoUrl?: string
}

// Same slug derivation as projectCatalog.findBySlug, and only projects whose
// detail route resolves (the route 404s without a case study).
export const projectSwitcherOptions: readonly ProjectSwitcherOption[] =
  projectCatalog.records
    .filter((project) => projectCaseStudyCatalog.findByProjectId(project.id))
    .map((project) => ({
      slug: project.id.replace(/^project-/, ""),
      title: project.title,
      type: project.type,
      logoUrl: project.logoUrl,
    }))

/**
 * GitHub-style project switcher: a breadcrumb button that opens a searchable
 * list of every project and navigates to the chosen project's page.
 */
export function ProjectSwitcher({
  current,
  label,
}: {
  current: Project
  label: string
}) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const currentSlug = current.id.replace(/^project-/, "")

  function choose(slug: string) {
    setOpen(false)
    if (slug === currentSlug) return
    void navigate({ to: "/projects/$slug", params: { slug } })
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        aria-current="page"
        className="group inline-flex items-center gap-1 rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {label}
        <CaretDownIcon
          aria-hidden="true"
          className="size-3.5 transition-transform group-data-[state=open]:rotate-180 motion-reduce:transition-none"
        />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          aria-label="Switch project"
          className="z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-lg outline-none"
        >
          <Command loop>
            <CommandInput
              autoFocus
              placeholder="Find a project…"
              className="h-11 py-3 text-sm"
            />
            <CommandList className="max-h-80 p-1.5">
              <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                No projects found.
              </CommandEmpty>
              {projectSwitcherOptions.map((option) => (
                <CommandItem
                  key={option.slug}
                  value={option.slug}
                  keywords={[option.title, option.type]}
                  data-current={option.slug === currentSlug}
                  onSelect={() => choose(option.slug)}
                  className="min-h-9 gap-2.5 px-2.5 py-1.5 text-sm"
                >
                  <ProjectLogo option={option} />
                  <span className="min-w-0 flex-1 truncate">
                    {option.title}
                  </span>
                  {option.slug === currentSlug ? (
                    <CheckIcon
                      aria-hidden="true"
                      className="size-4 text-muted-foreground"
                    />
                  ) : null}
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

function ProjectLogo({ option }: { option: ProjectSwitcherOption }) {
  const box =
    "grid size-5 shrink-0 place-items-center rounded-sm text-muted-foreground"
  return option.logoUrl ? (
    <img
      src={option.logoUrl}
      alt=""
      loading="lazy"
      className={cn(box, "object-contain")}
    />
  ) : (
    <span aria-hidden="true" className={box}>
      <ProjectTypeIcon type={option.type} className="size-4" />
    </span>
  )
}
```

Notes for the implementer:

- cmdk filters on `value` plus `keywords`; using the slug as `value` keeps values unique, and `keywords` makes the title and type searchable.
- `CommandInput` from `ui/command.tsx` is styled for the full-screen palette (`h-14 text-base`); the `className` overrides above shrink it for a popover. Do not change `ui/command.tsx`, because the palette depends on those defaults.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm vitest run src/components/portfolio/project-switcher.test.tsx`
Expected: PASS, 6 tests.

If "filters projects as you type" fails because cmdk scores `bugrec` against the slug too loosely, keep the assertion on BugReceipt and replace the PostCraft absence check with `expect(screen.getAllByRole("option")).toHaveLength(1)` only if BugReceipt is the sole match; do not weaken the navigation tests.

- [ ] **Step 5: Type-check, lint and format**

Run: `pnpm typecheck && pnpm lint && pnpm prettier --check src/components/portfolio/project-switcher.tsx src/components/portfolio/project-switcher.test.tsx`
Expected: no errors; Prettier prints "All matched files use Prettier code style!".

- [ ] **Step 6: Commit**

```bash
git add src/components/portfolio/project-switcher.tsx src/components/portfolio/project-switcher.test.tsx
git commit -m "Add a searchable project switcher component"
```

---

### Task 2: Wire the switcher into the project breadcrumb

**Files:**

- Modify: `src/components/portfolio/project-detail-page.tsx` (imports at the top; the last breadcrumb item, currently `<BreadcrumbPage>{project.title}</BreadcrumbPage>` around line 72)

**Interfaces:**

- Consumes: `ProjectSwitcher({ current, label })` from Task 1.
- Produces: nothing new for later tasks.

- [ ] **Step 1: Replace the last breadcrumb item**

In `src/components/portfolio/project-detail-page.tsx`, add the import next to the other portfolio imports:

```tsx
import { ProjectSwitcher } from "@/components/portfolio/project-switcher"
```

Replace:

```tsx
<BreadcrumbItem>
  <BreadcrumbPage>{project.title}</BreadcrumbPage>
</BreadcrumbItem>
```

with:

```tsx
<BreadcrumbItem>
  <ProjectSwitcher current={project} label={`${project.title}`} />
</BreadcrumbItem>
```

`BreadcrumbPage` is now unused in this file; remove it from the `@/components/ui/breadcrumb` import list so ESLint passes.

- [ ] **Step 2: Type-check, lint, format and run the related tests**

Run: `pnpm typecheck && pnpm lint && pnpm prettier --check src/components/portfolio/project-detail-page.tsx && pnpm vitest run src/components/portfolio`
Expected: no type, lint or format errors; all `src/components/portfolio` tests pass (including the 6 new ones).

- [ ] **Step 3: Verify in the browser**

Start the dev server if it is not running (`pnpm dev`, port 3000) and open `http://localhost:3000/projects/postcraft`. Check each item:

1. The breadcrumb reads `Overview / Projects / PostCraft ▾`, and the caret flips when open.
2. Clicking it opens a panel under the breadcrumb with a focused "Find a project…" box and all projects with logos (or type icons); PostCraft has a check mark.
3. Typing `bug` narrows the list to BugReceipt; Enter navigates to `/projects/bugreceipt`, and the breadcrumb there shows `BugReceipt ▾`.
4. Arrow keys move the highlight and wrap at the ends; Esc closes the panel and returns focus to the trigger.
5. At a 375px-wide viewport the panel fits on screen (no horizontal scroll) and the list scrolls inside the panel.
6. Dark mode: the panel uses the popover background and is readable.

- [ ] **Step 4: Commit**

```bash
git add src/components/portfolio/project-detail-page.tsx
git commit -m "Add the project switcher to the project page breadcrumb"
```

---

## Out of scope (add later only if needed)

- Grouping the list by the Projects page filters (employment, client work, …). The flat list matches GitHub's switcher; grouping is a small change to `projectSwitcherOptions` plus `CommandGroup` if wanted.
- Keyboard shortcut to open the switcher. The site already has a Ctrl+K command palette.
- Recently visited projects at the top of the list.
