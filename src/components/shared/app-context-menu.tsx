import { useCallback, useRef, useState } from "react"
import type { MouseEvent as ReactMouseEvent, ReactNode } from "react"
import { toast } from "sonner"
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowsClockwiseIcon,
  ClipboardIcon,
  CoffeeIcon,
  CopyIcon,
  SelectionAllIcon,
} from "@/components/ui/icons"

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { usePortfolioCommands } from "@/hooks/use-portfolio-commands"
import { sectionShortcuts } from "@/lib/portfolio-shortcuts"

type CopyTarget = {
  kind: "email" | "link" | "selection"
  value: string
}

function getLinkCopyTarget(link: HTMLAnchorElement): CopyTarget {
  if (link.protocol !== "mailto:") return { kind: "link", value: link.href }

  const encodedAddress = link.href.slice("mailto:".length).split("?", 1)[0]
  let address = encodedAddress
  try {
    address = decodeURIComponent(encodedAddress)
  } catch {
    // Keep the original address if the link contains invalid URL encoding.
  }

  return { kind: "email", value: address }
}

export function AppContextMenu({ children }: { children: ReactNode }) {
  const { executeAction, navigateToSection } = usePortfolioCommands()
  const [copyTarget, setCopyTarget] = useState<CopyTarget | null>(null)
  const contextLinkRef = useRef<CopyTarget | null>(null)
  const copyTargetRef = useRef<CopyTarget | null>(null)

  const handleContextMenu = useCallback((event: ReactMouseEvent) => {
    const target = event.target instanceof Element ? event.target : null
    const link = target?.closest<HTMLAnchorElement>("a[href]")
    contextLinkRef.current = link ? getLinkCopyTarget(link) : null
  }, [])

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) return

    const selection = window.getSelection()?.toString() || ""
    const target =
      contextLinkRef.current ||
      (selection ? { kind: "selection", value: selection } : null)
    copyTargetRef.current = target
    setCopyTarget(target)
  }, [])

  async function handleCopy() {
    const target = copyTargetRef.current
    if (!target) return

    try {
      await navigator.clipboard.writeText(target.value)
      if (target.kind === "email") toast.success("Email copied")
      if (target.kind === "link") toast.success("Link copied")
    } catch {
      // Clipboard access may be denied by browser permissions.
    }
  }

  async function handlePaste() {
    const text = await navigator.clipboard.readText().catch(() => "")
    if (text) document.execCommand("insertText", false, text)
  }

  function handleSelectAll() {
    window.getSelection()?.selectAllChildren(document.body)
  }

  return (
    <ContextMenu modal={false} onOpenChange={handleOpenChange}>
      <ContextMenuTrigger
        className="min-h-[100dvh] select-text"
        onContextMenuCapture={handleContextMenu}
      >
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-60">
        <ContextMenuGroup>
          <ContextMenuItem onSelect={handleCopy} disabled={!copyTarget}>
            <CopyIcon />
            Copy
            <ContextMenuShortcut>⌘C</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem onSelect={handlePaste}>
            <ClipboardIcon />
            Paste
            <ContextMenuShortcut>⌘V</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem onSelect={handleSelectAll}>
            <SelectionAllIcon />
            Select All
            <ContextMenuShortcut>⌘A</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuGroup>

        <ContextMenuSeparator />

        <ContextMenuGroup>
          <ContextMenuItem onSelect={() => executeAction("coffee")}>
            <CoffeeIcon />
            Buy me a coffee
            <ContextMenuShortcut>⌘B</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuGroup>

        <ContextMenuSeparator />

        <ContextMenuGroup>
          {sectionShortcuts.map((item) => (
            <ContextMenuItem
              key={item.label}
              onSelect={() => navigateToSection(item)}
            >
              {item.label}
              <ContextMenuShortcut>{item.key}</ContextMenuShortcut>
            </ContextMenuItem>
          ))}
        </ContextMenuGroup>

        <ContextMenuSeparator />

        <ContextMenuGroup>
          <ContextMenuItem onSelect={() => window.history.back()}>
            <ArrowLeftIcon />
            Back
            <ContextMenuShortcut>⌘←</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem onSelect={() => window.history.forward()}>
            <ArrowRightIcon />
            Forward
            <ContextMenuShortcut>⌘→</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem onSelect={() => window.location.reload()}>
            <ArrowsClockwiseIcon />
            Reload
            <ContextMenuShortcut>⌘R</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  )
}
