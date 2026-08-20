import { useCallback, useState } from "react"
import type { ReactNode } from "react"
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowsClockwiseIcon,
  ClipboardIcon,
  CoffeeIcon,
  CopyIcon,
  SelectionAllIcon,
} from "@phosphor-icons/react"

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

export function AppContextMenu({ children }: { children: ReactNode }) {
  const { executeAction, navigateToSection } = usePortfolioCommands()
  const [hasSelection, setHasSelection] = useState(false)

  const handleOpenChange = useCallback((open: boolean) => {
    if (open) setHasSelection(Boolean(window.getSelection()?.toString()))
  }, [])

  async function handleCopy() {
    const text = window.getSelection()?.toString() ?? ""
    if (text) await navigator.clipboard.writeText(text).catch(() => undefined)
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
      <ContextMenuTrigger className="min-h-[100dvh] select-text">
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-60">
        <ContextMenuGroup>
          <ContextMenuItem onSelect={handleCopy} disabled={!hasSelection}>
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
