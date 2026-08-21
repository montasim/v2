import { Badge } from "@/components/ui/badge"
import { ViewIcon } from "@/components/ui/icons"
import { Skeleton } from "@/components/ui/skeleton"

function formatVisitorCount(count: number) {
  return new Intl.NumberFormat("en", {
    compactDisplay: "short",
    maximumFractionDigits: 1,
    notation: "compact",
  }).format(count)
}

export function VisitorCountBadge({ count }: { count: number | null }) {
  return (
    <Badge
      variant="secondary"
      className="gap-1.5 font-medium tabular-nums"
      aria-label={
        count === null
          ? "Loading visitor count"
          : `${count} ${count === 1 ? "visitor" : "visitors"}`
      }
    >
      <ViewIcon className="size-3.5" />
      {count === null ? (
        <Skeleton className="h-3 w-10 bg-foreground/10" />
      ) : (
        `${formatVisitorCount(count)} ${count === 1 ? "visitor" : "visitors"}`
      )}
    </Badge>
  )
}
