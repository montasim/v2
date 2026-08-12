import type { ComponentProps } from "react"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

export function SiteContainer({
  asChild = false,
  className,
  ...props
}: ComponentProps<"div"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "div"

  return (
    <Comp
      className={cn("mx-auto w-full max-w-[64.68rem] px-4 sm:px-6", className)}
      {...props}
    />
  )
}
