import * as React from "react"
import { Dialog } from "radix-ui"
import { XIcon } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export const Sheet = Dialog.Root
export const SheetTrigger = Dialog.Trigger
export const SheetClose = Dialog.Close
export function SheetContent({
  className,
  children,
  closeLabel = "Close panel",
  ...props
}: React.ComponentProps<typeof Dialog.Content> & { closeLabel?: string }) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/15 backdrop-blur-xs motion-reduce:animate-none" />
      <Dialog.Content
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-3/4 max-w-sm flex-col border-l bg-background p-4 shadow-xl motion-reduce:animate-none",
          className
        )}
        {...props}
      >
        {children}
        <Dialog.Close asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3"
            aria-label={closeLabel}
          >
            <XIcon />
          </Button>
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  )
}
export const SheetTitle = Dialog.Title
export const SheetDescription = Dialog.Description
