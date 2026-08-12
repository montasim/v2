import type { ComponentProps } from "react"

import { SiteContainer } from "@/components/shared/site-container"
import { cn } from "@/lib/utils"

export function PageShell({
  padded = false,
  className,
  ...props
}: ComponentProps<"main"> & { padded?: boolean }) {
  return (
    <SiteContainer
      asChild
      className={cn("page-enter", padded && "py-12 sm:py-16", className)}
    >
      <main id="main-content" {...props} />
    </SiteContainer>
  )
}
