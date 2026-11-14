import * as React from "react"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const initialViewWindowMs = 500
const initialViewDelayMs = 400

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? React.useEffect : React.useLayoutEffect

export function MotionReveal({
  asChild = false,
  delay = 0,
  rootMargin = "0px 0px -8%",
  variant = "default",
  className,
  style,
  ...props
}: React.ComponentProps<"div"> & {
  asChild?: boolean
  delay?: number
  rootMargin?: string
  variant?: "default" | "subtle"
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
    const mountedAt = performance.now()

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return

        // Already on screen when the page opened: wait for the hero/page entrance to lead.
        if (performance.now() - mountedAt < initialViewWindowMs) {
          element.style.setProperty(
            "--motion-reveal-delay",
            `${delay + initialViewDelayMs}ms`
          )
        }
        element.dataset.motionState = "revealed"
        observer.unobserve(element)
      },
      { rootMargin, threshold: 0.08 }
    )
    let observationFrame = 0

    const revealForReducedMotion = (event: MediaQueryListEvent) => {
      if (!event.matches) return

      window.cancelAnimationFrame(observationFrame)
      element.dataset.motionState = "revealed"
      observer.disconnect()
    }

    observationFrame = window.requestAnimationFrame(() => {
      observer.observe(element)
    })
    reducedMotion.addEventListener("change", revealForReducedMotion)

    return () => {
      window.cancelAnimationFrame(observationFrame)
      observer.disconnect()
      reducedMotion.removeEventListener("change", revealForReducedMotion)
    }
  }, [delay, rootMargin])

  return (
    <Comp
      ref={(node: HTMLElement | null) => {
        elementRef.current = node
      }}
      className={cn(
        "motion-reveal",
        variant === "subtle" && "motion-reveal-subtle",
        className
      )}
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
