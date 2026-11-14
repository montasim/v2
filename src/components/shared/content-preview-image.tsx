import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

type ContentPreviewImageProps = Omit<ComponentProps<"img">, "className"> & {
  className?: string
}

/** Content artwork is evidence: frames may size it, but never crop it. */
export function ContentPreviewImage({
  className,
  ...props
}: ContentPreviewImageProps) {
  return (
    // Lazy by default; pass loading="eager" for artwork at the very top of a page.
    <img
      loading="lazy"
      decoding="async"
      {...props}
      className={cn("bg-background object-contain", className)}
    />
  )
}
