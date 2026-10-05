import {
  ArrowLeftCompactIcon,
  ArrowRightCompactIcon,
} from "@/components/ui/icons"
import { Button } from "@/components/ui/button"
import {
  Pagination,
  PaginationButton,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination"
import { cn } from "@/lib/utils"

export function CatalogPagination({
  page,
  pageCount,
  pageSize,
  total,
  resultLabel,
  onPageChange,
}: {
  page: number
  pageCount: number
  pageSize: number
  total: number
  resultLabel: string
  onPageChange: (page: number) => void
}) {
  const first = (page - 1) * pageSize + 1
  const last = Math.min(page * pageSize, total)

  return (
    <Pagination
      className="mt-8 flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center"
      aria-label={`${resultLabel} pagination`}
    >
      <p className="text-xs text-muted-foreground" aria-live="polite">
        Showing{" "}
        <span className="font-medium text-strong-foreground tabular-nums">
          {first}–{last}
        </span>{" "}
        of{" "}
        <span className="font-medium text-strong-foreground tabular-nums">
          {total}
        </span>{" "}
        {resultLabel}
      </p>

      {pageCount > 1 ? (
        <PaginationContent className="sm:ml-auto">
          <PaginationItem>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-10 sm:size-8"
              disabled={page === 1}
              onClick={() => onPageChange(page - 1)}
              aria-label={`Previous ${resultLabel} page`}
            >
              <ArrowLeftCompactIcon />
            </Button>
          </PaginationItem>

          {paginationItems(page, pageCount).map((item, index) =>
            item === "ellipsis" ? (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={item}>
                <PaginationButton
                  type="button"
                  isActive={item === page}
                  className={cn(
                    "size-10 shrink-0 text-xs tabular-nums sm:size-8",
                    item === page &&
                      "bg-emphasis-foreground text-background hover:bg-emphasis-foreground/85"
                  )}
                  onClick={() => onPageChange(item)}
                  aria-label={`Page ${item}`}
                >
                  {item}
                </PaginationButton>
              </PaginationItem>
            )
          )}

          <PaginationItem>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-10 sm:size-8"
              disabled={page === pageCount}
              onClick={() => onPageChange(page + 1)}
              aria-label={`Next ${resultLabel} page`}
            >
              <ArrowRightCompactIcon />
            </Button>
          </PaginationItem>
        </PaginationContent>
      ) : null}
    </Pagination>
  )
}

function paginationItems(page: number, pageCount: number) {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1)
  }

  const items: Array<number | "ellipsis"> = [1, 2]
  const start = Math.max(3, page - 1)
  const end = Math.min(pageCount - 2, page + 1)
  if (start > 3) items.push("ellipsis")
  for (let value = start; value <= end; value += 1) items.push(value)
  if (end < pageCount - 2) items.push("ellipsis")
  items.push(pageCount - 1, pageCount)
  return items
}
