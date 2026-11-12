import { useEffect, useRef } from "react"

const interactive = "a, button, [role='button'], summary, label"

export function CustomCursor() {
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return
    // Reduced motion: the ring sits on the dot instead of trailing it.
    const ease = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 1
      : 0.15
    const root = document.documentElement
    root.dataset.customCursor = "hidden"

    let mx = 0
    let my = 0
    let rx = 0
    let ry = 0
    let frame = 0

    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return
      mx = event.clientX
      my = event.clientY
      root.dataset.customCursor = "visible"
      dot.current?.style.setProperty("transform", `translate(${mx}px, ${my}px)`)
      const target = event.target as Element | null
      root.toggleAttribute("data-cursor-hover", !!target?.closest?.(interactive))
    }
    const hide = () => (root.dataset.customCursor = "hidden")
    const follow = () => {
      rx += (mx - rx) * ease
      ry += (my - ry) * ease
      ring.current?.style.setProperty("transform", `translate(${rx}px, ${ry}px)`)
      frame = requestAnimationFrame(follow)
    }
    frame = requestAnimationFrame(follow)
    window.addEventListener("pointermove", move, { passive: true })
    root.addEventListener("pointerleave", hide)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("pointermove", move)
      root.removeEventListener("pointerleave", hide)
      delete root.dataset.customCursor
      root.removeAttribute("data-cursor-hover")
    }
  }, [])

  return (
    <>
      <div ref={ring} className="custom-cursor-ring" aria-hidden="true" />
      <div ref={dot} className="custom-cursor-dot" aria-hidden="true" />
    </>
  )
}
