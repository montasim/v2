import { Badge } from "@/components/ui/badge"
import { ViewIcon } from "@/components/ui/icons"
import { Skeleton } from "@/components/ui/skeleton"
import type { VisitorCount } from "@/features/visitor-count/use-visitor-count"
import { cn } from "@/lib/utils"

function formatVisitorCount(count: number) {
  return new Intl.NumberFormat("en", {
    compactDisplay: "short",
    maximumFractionDigits: 1,
    notation: "compact",
  }).format(count)
}

export function VisitorCountBadge({
  count,
  className,
}: {
  count: VisitorCount
  className?: string
}) {
  const isUnavailable = count === "unavailable"

  return (
    <Badge
      variant="secondary"
      className={cn("gap-1.5 font-medium tabular-nums", className)}
      aria-label={
        count === null
          ? "Loading visitor count"
          : isUnavailable
            ? "0 views"
            : `${count} ${count === 1 ? "visitor" : "visitors"}`
      }
    >
      <ViewIcon className="size-3.5" />
      {count === null ? (
        <Skeleton className="h-3 w-10 bg-foreground/10" />
      ) : isUnavailable ? (
        <span aria-hidden="true">0 views</span>
      ) : (
        `${formatVisitorCount(count)} ${count === 1 ? "visitor" : "visitors"}`
      )}
    </Badge>
  )
}
