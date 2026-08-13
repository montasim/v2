import * as React from "react"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? React.useEffect : React.useLayoutEffect

export function MotionReveal({
  asChild = false,
  delay = 0,
  className,
  style,
  ...props
}: React.ComponentProps<"div"> & {
  asChild?: boolean
  delay?: number
}) {
  const elementRef = React.useRef<HTMLElement | null>(null)
  const Comp = asChild ? Slot.Root : "div"

  useIsomorphicLayoutEffect(() => {
    const element = elementRef.current

    if (!element) return

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")

    if (reducedMotion.matches || !("IntersectionObserver" in window)) {
      element.dataset.motionState = "revealed"
      return
    }

    element.dataset.motionState = "pending"

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return

        element.dataset.motionState = "revealed"
        observer.unobserve(element)
      },
      { rootMargin: "0px 0px -8%", threshold: 0.08 }
    )

    const revealForReducedMotion = (event: MediaQueryListEvent) => {
      if (!event.matches) return

      element.dataset.motionState = "revealed"
      observer.disconnect()
    }

    observer.observe(element)
    reducedMotion.addEventListener("change", revealForReducedMotion)

    return () => {
      observer.disconnect()
      reducedMotion.removeEventListener("change", revealForReducedMotion)
    }
  }, [])

  return (
    <Comp
      ref={(node: HTMLElement | null) => {
        elementRef.current = node
      }}
      className={cn("motion-reveal", className)}
      style={
        {
          "--motion-reveal-delay": `${delay}ms`,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    />
  )
}
