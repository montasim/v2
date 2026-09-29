import type { ReactNode } from "react"
import {
  ArrowLeftCompactIcon,
  ArrowRightCompactIcon,
  FunnelSimpleIcon,
} from "@/components/ui/icons"
import { Button } from "@/components/ui/button"
import { DetailPage } from "@/components/shared/detail-page"
import { OverflowTabsList } from "@/components/ui/overflow-tabs-list"
import {
  Pagination,
  PaginationButton,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination"
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs"
import type { CatalogFilter } from "@/lib/content/shared"
import { cn } from "@/lib/utils"

export function CatalogPage<TRecord, TFilter extends string | number>({
  title,
  description,
  filter,
  filters,
  records,
  matches,
  onFilterChange,
  resultLabel,
  renderRecord,
  renderRecords,
  emptyState,
  introAction,
  page,
  pageSize,
  onPageChange,
  resultsId,
}: {
  title: string
  description: string
  filter: TFilter
  filters: readonly CatalogFilter<TFilter>[]
  records: readonly TRecord[]
  matches: (record: TRecord, filter: TFilter) => boolean
  onFilterChange: (filter: TFilter) => void
  resultLabel: string
  renderRecord?: (record: TRecord, index: number) => ReactNode
  renderRecords?: (records: readonly TRecord[]) => ReactNode
  emptyState?: ReactNode
  introAction?: ReactNode
  page?: number
  pageSize?: number
  onPageChange?: (page: number) => void
  resultsId?: string
}) {
  const visible = records.filter((record) => matches(record, filter))
  const paginationEnabled = Boolean(page && pageSize && onPageChange)
  const pageCount = paginationEnabled
    ? Math.max(1, Math.ceil(visible.length / pageSize!))
    : 1
  const currentPage = paginationEnabled ? Math.min(page!, pageCount) : 1
  const firstRecordIndex = paginationEnabled ? (currentPage - 1) * pageSize! : 0
  const visiblePage = paginationEnabled
    ? visible.slice(firstRecordIndex, firstRecordIndex + pageSize!)
    : visible

  return (
    <DetailPage
      title={title}
      description={description}
      introAction={introAction}
    >
      <Tabs
        value={String(filter)}
        onValueChange={(value) => {
          const selected = filters.find(
            (item) => String(item.value) === value
          )?.value
          if (selected !== undefined) onFilterChange(selected)
        }}
        className="mt-10"
      >
        <OverflowTabsList
          aria-label="Filter results"
          activeValue={String(filter)}
        >
          <span className="hidden shrink-0 items-center gap-1.5 pt-2 pb-3 text-xs font-medium text-muted-foreground sm:inline-flex">
            <FunnelSimpleIcon className="size-3" aria-hidden="true" />
            Filter
          </span>
          {filters.map((item) => (
            <TabsTrigger key={item.value} value={String(item.value)}>
              {item.label}
            </TabsTrigger>
          ))}
        </OverflowTabsList>
        <p className="sr-only" aria-live="polite">
          {visible.length} {resultLabel} shown
        </p>
        <TabsContent
          id={resultsId}
          tabIndex={paginationEnabled ? -1 : undefined}
          value={String(filter)}
          className="grid scroll-mt-20 gap-5"
          aria-label={resultLabel}
        >
          {visiblePage.length === 0
            ? emptyState
            : renderRecords
              ? renderRecords(visiblePage)
              : visiblePage.map((record, index) =>
                  renderRecord?.(record, firstRecordIndex + index)
                )}
        </TabsContent>

        {paginationEnabled && visible.length ? (
          <CatalogPagination
            page={currentPage}
            pageCount={pageCount}
            pageSize={pageSize!}
            total={visible.length}
            resultLabel={resultLabel}
            onPageChange={onPageChange!}
          />
        ) : null}
      </Tabs>
    </DetailPage>
  )
}

function CatalogPagination({
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
