"use client"

import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function BadgeList({
  items,
  label,
  limit,
  className,
  badgeClassName,
}: {
  items: readonly string[]
  label: string
  limit?: number
  className?: string
  badgeClassName?: string
}) {
  const [expanded, setExpanded] = useState(false)
  const hasHiddenItems = Boolean(limit && items.length > limit)
  const visible = hasHiddenItems && !expanded ? items.slice(0, limit) : items
  const remaining = items.length - visible.length

  return (
    <ul className={cn("flex flex-wrap gap-2", className)} aria-label={label}>
      {visible.map((item) => (
        <li key={item}>
          <Badge className={badgeClassName}>{item}</Badge>
        </li>
      ))}
      {hasHiddenItems ? (
        <li>
          <Button
            type="button"
            variant="outline"
            size="xs"
            aria-expanded={expanded}
            aria-label={
              expanded
                ? `Show fewer ${label}`
                : `Show ${remaining} more ${label}`
            }
            onClick={() => setExpanded((current) => !current)}
            className={cn(
              badgeClassName,
              "h-auto rounded-full border-border bg-card px-2 py-0.5 text-xs font-medium text-muted-foreground hover:border-foreground/30 hover:text-foreground"
            )}
          >
            {expanded ? "Show fewer" : `+${remaining} more`}
          </Button>
        </li>
      ) : null}
    </ul>
  )
}
