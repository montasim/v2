import { useState } from "react"
import type { ReactNode } from "react"
import { Command } from "cmdk"
import { Popover } from "radix-ui"

import {
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { CaretDownIcon, CheckIcon, SearchIcon } from "@/components/ui/icons"
import { cn } from "@/lib/utils"

export type BreadcrumbSwitcherOption = {
  value: string
  title: string
  keywords?: string[]
  imageUrl?: string
  /** Shown when there is no image or it fails to load. */
  fallbackIcon: ReactNode
}

/**
 * GitHub-style switcher for the last breadcrumb item: a button that opens a
 * searchable list of sibling pages and reports the chosen value.
 */
export function BreadcrumbSwitcher({
  label,
  current,
  options,
  onSelect,
  ariaLabel,
  searchPlaceholder,
  emptyText,
}: {
  label: string
  current: string
  options: readonly BreadcrumbSwitcherOption[]
  onSelect: (value: string) => void
  ariaLabel: string
  searchPlaceholder: string
  emptyText: string
}) {
  const [open, setOpen] = useState(false)

  function choose(value: string) {
    setOpen(false)
    if (value !== current) onSelect(value)
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        aria-current="page"
        className="group inline-flex max-w-full min-w-0 items-center gap-1 rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <span className="truncate">{label}</span>
        <CaretDownIcon
          aria-hidden="true"
          className="size-3.5 shrink-0 transition-transform group-data-[state=open]:rotate-180 motion-reduce:transition-none"
        />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          collisionPadding={16}
          aria-label={ariaLabel}
          className="z-50 w-[min(28rem,calc(100vw-2rem))] overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-lg outline-none"
        >
          <Command loop>
            {/* The shared CommandInput wrapper has 1rem side padding; the icon
                sits in it and the input text is shifted past the icon. */}
            <div className="relative">
              <SearchIcon
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <CommandInput
                autoFocus
                placeholder={searchPlaceholder}
                className="h-11 py-3 pl-6 text-sm"
              />
            </div>
            <CommandList className="max-h-80 p-1.5">
              <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                {emptyText}
              </CommandEmpty>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  keywords={[option.title, ...(option.keywords ?? [])]}
                  data-current={option.value === current}
                  onSelect={() => choose(option.value)}
                  className="min-h-9 gap-2.5 px-2.5 py-1.5 text-sm"
                >
                  <OptionImage option={option} />
                  <span className="min-w-0 flex-1 truncate">
                    {option.title}
                  </span>
                  {option.value === current ? (
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

function OptionImage({ option }: { option: BreadcrumbSwitcherOption }) {
  // External images can fail; fall back to the option's icon.
  const [failed, setFailed] = useState(false)
  const box =
    "grid size-5 shrink-0 place-items-center rounded-sm text-muted-foreground"
  return option.imageUrl && !failed ? (
    <img
      src={option.imageUrl}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn(box, "object-contain")}
    />
  ) : (
    <span aria-hidden="true" className={box}>
      {option.fallbackIcon}
    </span>
  )
}
