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
          collisionPadding={16}
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
  // External logos can fail; fall back to the project type icon.
  const [failed, setFailed] = useState(false)
  const box =
    "grid size-5 shrink-0 place-items-center rounded-sm text-muted-foreground"
  return option.logoUrl && !failed ? (
    <img
      src={option.logoUrl}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn(box, "object-contain")}
    />
  ) : (
    <span aria-hidden="true" className={box}>
      <ProjectTypeIcon type={option.type} className="size-4" />
    </span>
  )
}
