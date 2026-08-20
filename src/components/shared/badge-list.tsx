"use client"

import { useState } from "react"

import { Badge } from "@/components/ui/badge"
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
          <Badge
            asChild
            className={cn(
              badgeClassName,
              "cursor-pointer hover:border-foreground/30 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
            )}
          >
            <button
              type="button"
              aria-expanded={expanded}
              aria-label={
                expanded
                  ? `Show fewer ${label}`
                  : `Show ${remaining} more ${label}`
              }
              onClick={() => setExpanded((current) => !current)}
            >
              {expanded ? "Show fewer" : `+${remaining} more`}
            </button>
          </Badge>
        </li>
      ) : null}
    </ul>
  )
}
