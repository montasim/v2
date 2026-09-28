import type { ComponentProps, ReactNode } from "react"

import { ArrowRightCompactIcon } from "@/components/ui/icons"
import { InternalAction } from "@/components/shared/navigation-action"
import { MotionReveal } from "@/components/shared/motion-reveal"
import type { InternalPath } from "@/components/shared/navigation-action"
import { cn } from "@/lib/utils"

export function PageSection({
  headingId,
  title,
  to,
  label,
  revealRootMargin,
  revealVariant,
  className,
  children,
  ...props
}: Omit<ComponentProps<"section">, "title"> & {
  headingId: string
  title: string
  to?: InternalPath
  label?: string
  revealRootMargin?: string
  revealVariant?: "default" | "subtle"
  children: ReactNode
}) {
  return (
    <MotionReveal
      asChild
      delay={80}
      rootMargin={revealRootMargin}
      variant={revealVariant}
    >
      <section
        className={cn("scroll-mt-14 py-10 sm:py-12", className)}
        aria-labelledby={headingId}
        {...props}
      >
        <div className="mb-6 flex items-center justify-between gap-4 border-b pb-4 sm:gap-6">
          <h2
            id={headingId}
            className="text-xl font-semibold tracking-tight text-strong-foreground sm:text-2xl"
          >
            {title}
          </h2>
          {to && label ? (
            <InternalAction
              to={to}
              variant="link"
              aria-label={label}
              className="group/action h-auto shrink-0 p-0 font-medium whitespace-nowrap text-strong-foreground"
            >
              <span aria-hidden="true" className="sm:hidden">
                View all
              </span>
              <span aria-hidden="true" className="hidden sm:inline">
                {label}
              </span>
              <ArrowRightCompactIcon className="group-hover/action:translate-x-0.5" />
            </InternalAction>
          ) : null}
        </div>
        {children}
      </section>
    </MotionReveal>
  )
}
