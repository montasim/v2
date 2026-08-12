import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

export function ResultsGrid({
  className,
  ...props
}: ComponentProps<"section">) {
  return <section className={cn("mt-6 grid gap-5", className)} {...props} />
}
