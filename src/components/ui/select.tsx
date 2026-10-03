"use client"

import * as React from "react"
import { Select as SelectPrimitive } from "radix-ui"

import { CaretDownIcon, CheckIcon, SearchIcon } from "@/components/ui/icons"
import { cn } from "@/lib/utils"

function Select(props: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

function SelectValue(
  props: React.ComponentProps<typeof SelectPrimitive.Value>
) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

function SelectTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(
        "flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-sm text-strong-foreground transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50 data-placeholder:text-muted-foreground dark:bg-input/20 dark:hover:bg-input/30 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <CaretDownIcon className="size-4 text-muted-foreground" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

const SelectSearchContext = React.createContext("")

const passThroughKeys = new Set([
  "ArrowDown",
  "ArrowUp",
  "Enter",
  "Escape",
  "Tab",
])

function optionText(children: React.ReactNode) {
  return React.Children.toArray(children)
    .filter((child) => typeof child === "string" || typeof child === "number")
    .join("")
}

function SelectContent({
  className,
  children,
  position = "popper",
  onKeyDownCapture,
  onCloseAutoFocus,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  const [query, setQuery] = React.useState("")
  const searchRef = React.useRef<HTMLInputElement>(null)

  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        position={position}
        sideOffset={4}
        className={cn(
          "relative z-50 flex max-h-(--radix-select-content-available-height) min-w-(--radix-select-trigger-width) origin-(--radix-select-content-transform-origin) flex-col overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-md data-[side=bottom]:animate-in data-[side=bottom]:fade-in-0 data-[side=bottom]:slide-in-from-top-1 data-[side=top]:animate-in data-[side=top]:fade-in-0 data-[side=top]:slide-in-from-bottom-1 motion-reduce:animate-none",
          className
        )}
        onCloseAutoFocus={(event) => {
          // Radix keeps this mounted while closed, so clear the search here.
          setQuery("")
          onCloseAutoFocus?.(event)
        }}
        onKeyDownCapture={(event) => {
          onKeyDownCapture?.(event)
          // Typing anywhere in the open list goes to the search box instead of
          // Radix typeahead; the focus move makes the browser insert the key.
          const isCharacter =
            event.key.length === 1 && !event.ctrlKey && !event.metaKey
          if (isCharacter && event.target !== searchRef.current) {
            searchRef.current?.focus()
            event.stopPropagation()
          }
        }}
        {...props}
      >
        <div className="relative border-b p-1">
          <SearchIcon
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground"
          />
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            onKeyDown={(event) => {
              // Keep Radix list navigation; block its typeahead while typing.
              if (!passThroughKeys.has(event.key)) event.stopPropagation()
            }}
            placeholder="Search…"
            aria-label="Search options"
            className="h-8 w-full rounded-md bg-transparent pr-2 pl-7 text-sm text-strong-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
        {/* 11.75rem = five 2.25rem options plus the 0.25rem viewport padding. */}
        <SelectPrimitive.Viewport className="max-h-[11.75rem] p-1">
          <SelectSearchContext.Provider value={query.trim().toLowerCase()}>
            {children}
          </SelectSearchContext.Provider>
        </SelectPrimitive.Viewport>
        <p className="hidden px-3 py-2 text-sm text-muted-foreground [[data-slot=select-content]:not(:has([role=option]:not([hidden])))_&]:block">
          No matches
        </p>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectItem({
  className,
  children,
  disabled,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  const query = React.useContext(SelectSearchContext)
  // Filtered options stay mounted (so the trigger keeps its selected label)
  // but are hidden and disabled, which also drops them from keyboard nav.
  const hidden =
    Boolean(query) && !optionText(children).toLowerCase().includes(query)

  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      hidden={hidden}
      disabled={disabled || hidden}
      className={cn(
        "relative flex min-h-9 w-full cursor-default items-center rounded-md py-2 pr-8 pl-2 text-sm outline-none select-none focus:bg-accent focus:text-accent-foreground data-[state=checked]:bg-accent data-[state=checked]:font-medium data-[state=checked]:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <span className="pointer-events-none absolute right-2 grid size-4 place-items-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-3.5" />
        </SelectPrimitive.ItemIndicator>
      </span>
    </SelectPrimitive.Item>
  )
}

function SelectGroup({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      // Hide a group heading once search filters out all of its options.
      className={cn(
        "[&:not(:has([role=option]:not([hidden])))]:hidden",
        className
      )}
      {...props}
    />
  )
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn(
        "px-2 pt-2 pb-1 text-xs font-medium text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
}
