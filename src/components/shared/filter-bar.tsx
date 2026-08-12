import { FunnelSimpleIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"

export type FilterItem = { value: string; label: string }
export function FilterBar({
  value,
  onValueChange,
  items,
}: {
  value: string
  onValueChange: (value: string) => void
  items: FilterItem[]
}) {
  return (
    <div
      className="mt-10 flex [scrollbar-width:none] items-center gap-5 overflow-x-auto border-b sm:gap-7 [&::-webkit-scrollbar]:hidden"
      role="group"
      aria-label="Filter results"
    >
      <span className="hidden shrink-0 items-center gap-1.5 pt-2 pb-3 text-xs font-medium text-muted-foreground sm:inline-flex">
        <FunnelSimpleIcon className="size-3" aria-hidden="true" />
        Filter
      </span>
      {items.map((item) => (
        <Button
          key={item.value}
          type="button"
          variant="ghost"
          className="relative h-auto shrink-0 rounded-sm bg-transparent px-0 pt-2 pb-3 text-sm font-medium text-muted-foreground after:absolute after:right-0 after:bottom-[-1px] after:left-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-foreground after:transition-transform after:duration-200 after:ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-transparent hover:text-foreground focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ring aria-pressed:text-foreground aria-pressed:after:scale-x-100 motion-reduce:after:transition-none"
          aria-pressed={value === item.value}
          onClick={() => onValueChange(item.value)}
        >
          {item.label}
        </Button>
      ))}
    </div>
  )
}
