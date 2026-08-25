import * as React from "react"
import { Slot } from "radix-ui"
import { cn } from "@/lib/utils"

export const cardInsetClassName = "p-5 sm:p-6"

export function Card({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "div"

  return (
    <Comp
      data-slot="card"
      className={cn(
        "rounded-xl border bg-card text-card-foreground",
        className
      )}
      {...props}
    />
  )
}
export function CardContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-5 pb-5 sm:px-6 sm:pb-6", className)}
      {...props}
    />
  )
}
