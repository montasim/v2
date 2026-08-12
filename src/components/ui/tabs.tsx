import * as React from "react"
import { Tabs as TabsPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

export const Tabs = TabsPrimitive.Root

export function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        "flex [scrollbar-width:none] items-center gap-5 overflow-x-auto border-b sm:gap-7 [&::-webkit-scrollbar]:hidden",
        className
      )}
      {...props}
    />
  )
}

export function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "relative shrink-0 rounded-sm pt-2 pb-3 text-sm font-medium text-muted-foreground outline-none after:absolute after:right-0 after:bottom-[-1px] after:left-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-foreground after:transition-transform after:duration-200 after:ease-[cubic-bezier(0.16,1,0.3,1)] hover:text-foreground focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ring data-[state=active]:text-foreground data-[state=active]:after:scale-x-100 motion-reduce:after:transition-none",
        className
      )}
      {...props}
    />
  )
}

export function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn("mt-6 outline-none", className)}
      {...props}
    />
  )
}
