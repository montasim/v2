import type { ReactNode } from "react"
import { FunnelSimpleIcon } from "@/components/ui/icons"
import { DetailPage } from "@/components/shared/detail-page"
import { OverflowTabsList } from "@/components/ui/overflow-tabs-list"
import { CatalogPagination } from "@/components/shared/catalog-pagination"
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs"
import type { CatalogFilter } from "@/lib/content/shared"

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
