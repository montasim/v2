import type { ReactNode } from "react"
import { FunnelSimpleIcon } from "@phosphor-icons/react"
import { DetailPage } from "@/components/shared/detail-page"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  introAction,
}: {
  title: string
  description: string
  filter: TFilter
  filters: readonly CatalogFilter<TFilter>[]
  records: readonly TRecord[]
  matches: (record: TRecord, filter: TFilter) => boolean
  onFilterChange: (filter: TFilter) => void
  resultLabel: string
  renderRecord: (record: TRecord) => ReactNode
  introAction?: ReactNode
}) {
  const visible = records.filter((record) => matches(record, filter))

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
        <TabsList aria-label="Filter results">
          <span className="hidden shrink-0 items-center gap-1.5 pt-2 pb-3 text-xs font-medium text-muted-foreground sm:inline-flex">
            <FunnelSimpleIcon className="size-3" aria-hidden="true" />
            Filter
          </span>
          {filters.map((item) => (
            <TabsTrigger key={item.value} value={String(item.value)}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <p className="sr-only" aria-live="polite">
          {visible.length} {resultLabel} shown
        </p>
        <TabsContent
          value={String(filter)}
          className="grid gap-5"
          aria-label={resultLabel}
        >
          {visible.map(renderRecord)}
        </TabsContent>
      </Tabs>
    </DetailPage>
  )
}
