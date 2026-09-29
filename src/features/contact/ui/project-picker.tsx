import { useState } from "react"
import { Command } from "cmdk"
import { Popover } from "radix-ui"
import { CheckIcon, CaretDownIcon, SearchIcon } from "@/components/ui/icons"

export function ProjectPicker({
  projects,
  value,
  onValueChange,
  placeholder,
  disabled,
  ...props
}: {
  projects: Array<{ id: string; title: string }>
  value: string
  onValueChange: (value: string) => void
  placeholder: string
  disabled?: boolean
  id: string
  "aria-invalid"?: boolean
  "aria-describedby"?: string
}) {
  const [open, setOpen] = useState(false)
  const options = [
    { id: "none", title: placeholder },
    ...projects,
    { id: "other", title: "Other / not listed" },
  ]
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          {...props}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault()
              setOpen(true)
            }
          }}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="dialog"
          disabled={disabled}
          className="flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 text-left text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50 aria-invalid:border-destructive"
        >
          <span className="truncate">
            {options.find((option) => option.id === value)?.title ??
              placeholder}
          </span>
          <CaretDownIcon
            aria-hidden="true"
            className="size-4 shrink-0 opacity-50"
          />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          aria-label="Choose an app or project"
          className="z-50 w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md"
        >
          <Command label="Search apps or projects">
            <div className="flex items-center gap-2 border-b px-3">
              <SearchIcon
                aria-hidden="true"
                className="size-4 shrink-0 text-muted-foreground"
              />
              <Command.Input
                aria-label="Search apps or projects"
                placeholder="Search apps or projects…"
                className="h-11 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <Command.List className="max-h-[min(18rem,var(--radix-popover-content-available-height))] overflow-y-auto p-1">
              <Command.Empty className="px-3 py-4 text-sm text-muted-foreground">
                No matching apps or projects.
              </Command.Empty>
              {options.map((option) => (
                <Command.Item
                  key={option.id}
                  value={option.id}
                  keywords={[option.title]}
                  onSelect={() => {
                    onValueChange(option.id)
                    setOpen(false)
                  }}
                  className="flex cursor-pointer items-center justify-between gap-2 rounded-sm px-2 py-2 text-sm data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
                >
                  <span>{option.title}</span>
                  {value === option.id && (
                    <CheckIcon aria-hidden="true" className="size-4 shrink-0" />
                  )}
                </Command.Item>
              ))}
            </Command.List>
          </Command>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
