import { useEffect, useState } from "react"
import { Link, useNavigate } from "@tanstack/react-router"
import {
  ArrowUpRightIcon,
  BriefcaseIcon,
  CodeIcon,
  GithubLogoIcon,
} from "@/components/ui/icons"

import { profileCatalog } from "@/lib/content/profile"
import { KONAMI_DISPLAY_SEQUENCE, useKonamiCode } from "@/hooks/use-konami-code"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"

const internalCommands = [
  {
    key: "p",
    label: "Inspect project architecture",
    description: "Explore production applications and engineering decisions",
    to: "/projects" as const,
    icon: CodeIcon,
  },
  {
    key: "e",
    label: "Open engineering record",
    description: "Review roles, outcomes, and reliability work",
    to: "/experience" as const,
    icon: BriefcaseIcon,
  },
] as const

function CommandRow({
  icon: Icon,
  label,
  description,
  shortcut,
}: {
  icon: typeof CodeIcon
  label: string
  description: string
  shortcut: string
}) {
  return (
    <span className="group flex items-center gap-3 rounded-xl border bg-background/40 p-3.5 transition-[background-color,border-color,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-ring/50 hover:bg-muted active:scale-[0.99] motion-reduce:transition-none">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-strong-foreground transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:bg-ring/15 group-hover:text-ring motion-reduce:transition-none">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-strong-foreground">
          {label}
        </span>
        <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
          {description}
        </span>
      </span>
      <kbd className="rounded-md border bg-card px-2 py-1 font-mono text-[0.625rem] font-medium text-muted-foreground uppercase">
        {shortcut}
      </kbd>
    </span>
  )
}

export function KonamiCommandCenter() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const githubUrl = profileCatalog.socialUrl("github")

  const progress = useKonamiCode(() => setOpen(true))

  useEffect(() => {
    if (!open) return

    function handleShortcut(event: KeyboardEvent) {
      if (typeof event.key !== "string") return

      if (
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      const key = event.key.toLowerCase()
      const command = internalCommands.find((item) => item.key === key)

      if (command) {
        event.preventDefault()
        setOpen(false)
        void navigate({ to: command.to })
      } else if (key === "g") {
        event.preventDefault()
        setOpen(false)
        window.open(githubUrl, "_blank", "noopener,noreferrer")
      }
    }

    window.addEventListener("keydown", handleShortcut)
    return () => window.removeEventListener("keydown", handleShortcut)
  }, [githubUrl, navigate, open])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {progress > 0 && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed top-[4.5rem] left-1/2 z-[45] flex -translate-x-1/2 items-center gap-2.5 rounded-full border bg-card/95 px-3 py-2 font-mono text-xs shadow-lg backdrop-blur-sm motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1"
        >
          <span className="text-[0.625rem] font-medium tracking-[0.14em] text-muted-foreground">
            CODE
          </span>
          <span className="font-semibold tracking-[0.08em] text-strong-foreground">
            {KONAMI_DISPLAY_SEQUENCE.slice(0, progress).join(" ")}
          </span>
        </div>
      )}
      <SheetContent
        closeLabel="Close developer command center"
        className="w-full max-w-md bg-card p-0 sm:w-[28rem]"
      >
        <div className="border-b px-5 py-5 sm:px-7 sm:py-6">
          <p className="flex items-center gap-2 font-mono text-[0.6875rem] font-medium tracking-[0.14em] text-ring uppercase">
            <span
              className="size-1.5 rounded-full bg-ring"
              aria-hidden="true"
            />
            Hidden layer · online
          </p>
          <SheetTitle className="mt-5 pr-10 text-xl font-bold tracking-tight text-strong-foreground sm:text-3xl">
            Developer command center
          </SheetTitle>
          <SheetDescription className="mt-3 text-sm leading-relaxed text-muted-foreground">
            A second interface for people curious enough to look beneath the
            surface.
          </SheetDescription>
        </div>

        <nav
          className="grid gap-2 overflow-y-auto p-5 sm:p-7"
          aria-label="Developer shortcuts"
        >
          {internalCommands.map((command) => (
            <SheetClose asChild key={command.key}>
              <Link
                to={command.to}
                className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              >
                <CommandRow
                  icon={command.icon}
                  label={command.label}
                  description={command.description}
                  shortcut={command.key}
                />
              </Link>
            </SheetClose>
          ))}
          <SheetClose asChild>
            <a
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              <CommandRow
                icon={GithubLogoIcon}
                label="Open source map"
                description="Browse public repositories and source code"
                shortcut="g"
              />
            </a>
          </SheetClose>
        </nav>

        <p className="mt-auto flex items-center justify-between gap-4 border-t px-5 py-4 text-xs text-muted-foreground sm:px-7">
          <span>Unlocked with the Konami code</span>
          <a
            href={githubUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-medium text-strong-foreground hover:underline"
          >
            GitHub <ArrowUpRightIcon className="size-3" aria-hidden="true" />
          </a>
        </p>
      </SheetContent>
    </Sheet>
  )
}
