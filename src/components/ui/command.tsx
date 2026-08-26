import * as React from "react"
import { Command } from "cmdk"
import { Dialog as DialogPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

export function CommandDialog({
  className,
  open,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof Command> & {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          aria-label="Portfolio command menu"
          className="motion-command fixed top-[10%] left-1/2 z-[61] w-[calc(100%-1.5rem)] max-w-2xl -translate-x-1/2 outline-none sm:w-[calc(100%-3rem)]"
        >
          <Command
            data-slot="command-dialog"
            className={cn(
              "w-full max-w-2xl overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-2xl",
              className
            )}
            {...props}
          />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export function CommandInput({
  className,
  ...props
}: React.ComponentProps<typeof Command.Input>) {
  return (
    <div
      data-slot="command-input-wrapper"
      className="flex items-center border-b px-4"
    >
      <Command.Input
        data-slot="command-input"
        className={cn(
          "flex h-14 w-full bg-transparent py-4 text-base outline-none placeholder:text-muted-foreground",
          className
        )}
        {...props}
      />
    </div>
  )
}

export function CommandList({
  className,
  ...props
}: React.ComponentProps<typeof Command.List>) {
  return (
    <Command.List
      data-slot="command-list"
      className={cn("max-h-[min(76dvh,38rem)] overflow-y-auto p-3", className)}
      {...props}
    />
  )
}

export function CommandEmpty(
  props: React.ComponentProps<typeof Command.Empty>
) {
  return (
    <Command.Empty
      data-slot="command-empty"
      className="py-10 text-center text-base text-muted-foreground"
      {...props}
    />
  )
}

export function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof Command.Group>) {
  return (
    <Command.Group
      data-slot="command-group"
      className={cn(
        "overflow-hidden text-emphasis-foreground [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-sm [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export function CommandItem({
  className,
  ...props
}: React.ComponentProps<typeof Command.Item>) {
  return (
    <Command.Item
      data-slot="command-item"
      className={cn(
        "relative flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-base transition-colors duration-150 ease-out outline-none select-none data-[selected=true]:bg-muted data-[selected=true]:text-foreground motion-reduce:transition-none [&_svg]:size-[1.125rem] [&_svg]:shrink-0",
        className
      )}
      {...props}
    />
  )
}

export function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Command.Separator>) {
  return (
    <Command.Separator
      data-slot="command-separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}
