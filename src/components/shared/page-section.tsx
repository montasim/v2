import type { ComponentProps, ReactNode } from "react"

import { SectionHeading } from "@/components/shared/section-heading"
import { cn } from "@/lib/utils"

export function PageSection({
  headingId,
  title,
  to,
  label,
  className,
  children,
  ...props
}: Omit<ComponentProps<"section">, "title"> & {
  headingId: string
  title: string
  to?: string
  label?: string
  children: ReactNode
}) {
  return (
    <section
      className={cn("scroll-mt-14 py-10 sm:py-12", className)}
      aria-labelledby={headingId}
      {...props}
    >
      <SectionHeading id={headingId} title={title} to={to} label={label} />
      {children}
    </section>
  )
}
