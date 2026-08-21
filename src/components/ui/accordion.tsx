import * as React from "react"
import { Accordion as AccordionPrimitive } from "radix-ui"
import { CaretDownIcon } from "@/components/ui/icons"
import { cn } from "@/lib/utils"

export const Accordion = AccordionPrimitive.Root
export function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      className={cn("rounded-xl border bg-card px-5 sm:px-6", className)}
      {...props}
    />
  )
}
export function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        className={cn(
          "group flex flex-1 items-start justify-between py-4 text-left text-sm font-medium",
          className
        )}
        {...props}
      >
        {children}
        <CaretDownIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group-data-[state=open]:rotate-180 motion-reduce:transition-none" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}
export function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down motion-reduce:animate-none"
      {...props}
    >
      <div className={cn("pb-5 sm:pb-6", className)}>{children}</div>
    </AccordionPrimitive.Content>
  )
}
