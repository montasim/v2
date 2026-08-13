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
  const visible = limit ? items.slice(0, limit) : items
  const remaining = items.length - visible.length

  return (
    <ul className={cn("flex flex-wrap gap-2", className)} aria-label={label}>
      {visible.map((item) => (
        <li key={item}>
          <Badge className={badgeClassName}>{item}</Badge>
        </li>
      ))}
      {remaining > 0 ? (
        <li>
          <Badge className={badgeClassName}>+{remaining} more</Badge>
        </li>
      ) : null}
    </ul>
  )
}
