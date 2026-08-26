import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FunnelSimpleIcon, SearchIcon, XIcon } from "@/components/ui/icons"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { inquiryTypeFilters } from "@/features/owner-dashboard/domain/inquiry-filters"
import type { InquiryTypeFilter } from "@/features/owner-dashboard/domain/inquiry-filters"
import type { InquiryStat } from "@/features/owner-dashboard/infrastructure/dashboard.server"

type InquiryFilterValue = {
  query: string
  type: InquiryTypeFilter
}

const inquiryTypeLabels: Record<Exclude<InquiryTypeFilter, "all">, string> = {
  hire: "Role inquiries",
  project: "Project inquiries",
  general: "General inquiries",
}

function isInquiryTypeFilter(value: string): value is InquiryTypeFilter {
  return inquiryTypeFilters.includes(value as InquiryTypeFilter)
}

function typeCount(typeCounts: InquiryStat[], type: InquiryTypeFilter) {
  if (type === "all") {
    return typeCounts.reduce((total, item) => total + item.count, 0)
  }
  return typeCounts.find((item) => item.label === type)?.count ?? 0
}

function typeLabel(type: InquiryTypeFilter, typeCounts: InquiryStat[]) {
  if (type === "all") {
    return `All inquiries (${typeCount(typeCounts, type)})`
  }
  return `${inquiryTypeLabels[type]} (${typeCount(typeCounts, type)})`
}

export function InquiryFilters({
  onChange,
  query,
  resultTotal,
  type,
  typeCounts,
}: {
  onChange: (value: InquiryFilterValue) => void
  query: string
  resultTotal: number
  type: InquiryTypeFilter
  typeCounts: InquiryStat[]
}) {
  const [draftQuery, setDraftQuery] = useState(query)
  const [draftType, setDraftType] = useState(type)
  const onChangeRef = useRef(onChange)
  const submittedQueryRef = useRef(query)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    setDraftQuery(query)
    submittedQueryRef.current = query
  }, [query])

  useEffect(() => {
    setDraftType(type)
  }, [type])

  useEffect(() => {
    const normalizedQuery = draftQuery.trim()
    if (normalizedQuery === submittedQueryRef.current) return

    const timeout = window.setTimeout(() => {
      submittedQueryRef.current = normalizedQuery
      onChangeRef.current({ query: normalizedQuery, type: draftType })
    }, 300)

    return () => window.clearTimeout(timeout)
  }, [draftQuery, draftType])

  function updateType(value: string) {
    if (!isInquiryTypeFilter(value)) return
    setDraftType(value)
    const normalizedQuery = draftQuery.trim()
    submittedQueryRef.current = normalizedQuery
    onChangeRef.current({ query: normalizedQuery, type: value })
  }

  function clearSearch() {
    setDraftQuery("")
    submittedQueryRef.current = ""
    onChangeRef.current({ query: "", type: draftType })
  }

  return (
    <section aria-label="Filter inquiries">
      <p className="sr-only" aria-live="polite">
        {resultTotal} matching {resultTotal === 1 ? "inquiry" : "inquiries"}
      </p>
      <Card className="grid gap-3 bg-background p-4 sm:grid-cols-[minmax(0,1fr)_minmax(13rem,0.38fr)] sm:p-5">
        <div className="min-w-0">
          <Label
            htmlFor="inquiry-search"
            className="mb-2 block text-xs font-medium text-strong-foreground"
          >
            Search inquiries
          </Label>
          <span className="relative block">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="inquiry-search"
              type="search"
              value={draftQuery}
              onChange={(event) => setDraftQuery(event.currentTarget.value)}
              placeholder="Search names, emails, roles, or messages"
              className="pr-10 pl-9"
            />
            {draftQuery ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={clearSearch}
                className="absolute top-1/2 right-1.5 -translate-y-1/2 text-muted-foreground"
                aria-label="Clear inquiry search"
              >
                <XIcon className="size-3.5" />
              </Button>
            ) : null}
          </span>
        </div>

        <div>
          <span
            id="inquiry-type-filter-label"
            className="mb-2 flex items-center gap-1.5 text-xs font-medium text-strong-foreground"
          >
            <FunnelSimpleIcon className="size-3.5" />
            Inquiry type
          </span>
          <Select value={draftType} onValueChange={updateType}>
            <SelectTrigger aria-labelledby="inquiry-type-filter-label">
              <SelectValue>{typeLabel(draftType, typeCounts)}</SelectValue>
            </SelectTrigger>
            <SelectContent align="start">
              <SelectItem value="all">
                {typeLabel("all", typeCounts)}
              </SelectItem>
              {inquiryTypeFilters.slice(1).map((item) => (
                <SelectItem key={item} value={item}>
                  {typeLabel(item, typeCounts)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>
    </section>
  )
}

export function InquiryFilterEmptyState({ onClear }: { onClear: () => void }) {
  return (
    <Card
      asChild
      className="grid min-h-64 place-items-center bg-background px-6 py-12 text-center"
    >
      <section>
        <div className="max-w-sm">
          <SearchIcon className="mx-auto size-6 text-muted-foreground" />
          <h2 className="mt-4 text-sm font-semibold text-strong-foreground">
            No matching inquiries
          </h2>
          <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
            Try a broader search or choose a different inquiry type.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={onClear}
          >
            Clear filters
          </Button>
        </div>
      </section>
    </Card>
  )
}
