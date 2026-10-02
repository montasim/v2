import type { ReactNode } from "react"
import { CaretDownIcon } from "@/components/ui/icons"

export function DashboardInsights({
  title,
  metrics,
  children,
}: {
  title: string
  metrics: { label: string; value: ReactNode }[]
  children: ReactNode
}) {
  return (
    <details className="group rounded-xl border bg-card">
      <summary className="flex min-h-12 cursor-pointer list-none flex-wrap items-center gap-x-6 gap-y-2 rounded-xl px-4 py-3 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none [&::-webkit-details-marker]:hidden">
        {metrics.map(({ label, value }) => (
          <span key={label} className="text-xs text-muted-foreground">
            {label}
            <strong className="ml-2 text-base font-semibold text-strong-foreground tabular-nums">
              {value}
            </strong>
          </span>
        ))}
        <span className="ml-auto flex items-center gap-2 text-xs font-medium">
          {title}
          <CaretDownIcon
            className="size-3.5 group-open:rotate-180"
            aria-hidden="true"
          />
        </span>
      </summary>
      <div className="border-t p-4">{children}</div>
    </details>
  )
}
