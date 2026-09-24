import * as React from "react"

import { CaretLeftIcon, CaretRightIcon } from "@/components/ui/icons"
import { TabsList } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

const EDGE_TOLERANCE = 2

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export function OverflowTabsList({
  className,
  children,
  activeValue,
  ...props
}: React.ComponentProps<typeof TabsList> & { activeValue?: string }) {
  const listRef = React.useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = React.useState(false)
  const [canScrollRight, setCanScrollRight] = React.useState(false)

  const updateOverflow = React.useCallback(() => {
    const list = listRef.current
    if (!list) return

    setCanScrollLeft(list.scrollLeft > EDGE_TOLERANCE)
    setCanScrollRight(
      list.scrollLeft + list.clientWidth < list.scrollWidth - EDGE_TOLERANCE
    )
  }, [])

  React.useEffect(() => {
    const list = listRef.current
    if (!list) return

    updateOverflow()
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateOverflow)
      return () => window.removeEventListener("resize", updateOverflow)
    }

    const resizeObserver = new ResizeObserver(updateOverflow)
    resizeObserver.observe(list)
    return () => resizeObserver.disconnect()
  }, [children, updateOverflow])

  React.useEffect(() => {
    const list = listRef.current
    if (!list) return

    const activeTab = list.querySelector<HTMLElement>(
      '[role="tab"][data-state="active"]'
    )
    activeTab?.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "nearest",
      inline: "nearest",
    })

    const frame = requestAnimationFrame(updateOverflow)
    return () => cancelAnimationFrame(frame)
  }, [activeValue, updateOverflow])

  function scroll(direction: -1 | 1) {
    const list = listRef.current
    if (!list) return

    list.scrollBy({
      left: direction * Math.max(list.clientWidth * 0.7, 240),
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    })
  }

  return (
    <div className="relative min-w-0">
      <TabsList
        ref={listRef}
        className={cn("scroll-px-12", className)}
        onScroll={updateOverflow}
        {...props}
      >
        {children}
      </TabsList>

      {canScrollLeft ? (
        <div className="pointer-events-none absolute inset-y-0 left-0 flex w-14 items-center bg-gradient-to-r from-background via-background to-transparent pr-3 pb-1 sm:w-12">
          <button
            type="button"
            className="pointer-events-auto grid size-11 place-items-center rounded-md border bg-background text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring sm:size-8"
            aria-label="Show previous filters"
            onClick={() => scroll(-1)}
          >
            <CaretLeftIcon className="size-4" aria-hidden="true" />
          </button>
        </div>
      ) : null}

      {canScrollRight ? (
        <div className="pointer-events-none absolute inset-y-0 right-0 flex w-14 items-center justify-end bg-gradient-to-l from-background via-background to-transparent pb-1 pl-3 sm:w-12">
          <button
            type="button"
            className="pointer-events-auto grid size-11 place-items-center rounded-md border bg-background text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring sm:size-8"
            aria-label="Show more filters"
            onClick={() => scroll(1)}
          >
            <CaretRightIcon className="size-4" aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </div>
  )
}
