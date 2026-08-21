import { useCallback, useEffect, useRef, useState } from "react"
import { landingNavigation, landingSectionIds } from "@/lib/site"

function replaceHash(sectionId: string) {
  if (window.location.hash === `#${sectionId}`) return

  const url = new URL(window.location.href)
  url.hash = sectionId
  window.history.replaceState(
    window.history.state,
    "",
    `${url.pathname}${url.search}${url.hash}`
  )
}

export function useLandingNavigation(pathname: string, hash: string) {
  const [activeSection, setActiveSection] = useState(
    hash.replace(/^#/, "") || landingNavigation[0].sectionId
  )
  const activeSectionRef = useRef(activeSection)
  const scrollTargetRef = useRef<string | null>(null)

  const updateActiveSection = useCallback((sectionId: string) => {
    if (activeSectionRef.current === sectionId) {
      replaceHash(sectionId)
      return
    }

    activeSectionRef.current = sectionId
    setActiveSection(sectionId)
    replaceHash(sectionId)
  }, [])

  const navigateToSection = useCallback(
    (sectionId: string) => {
      if (pathname !== "/") return false

      const section = document.getElementById(sectionId)
      if (!section) return false

      scrollTargetRef.current = sectionId
      updateActiveSection(sectionId)
      section.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start",
      })

      return true
    },
    [pathname, updateActiveSection]
  )

  useEffect(() => {
    if (pathname !== "/" || !hash) return

    const sectionId = hash.replace(/^#/, "")
    activeSectionRef.current = sectionId
    setActiveSection(sectionId)
  }, [hash, pathname])

  useEffect(() => {
    if (pathname !== "/") return

    const observer = new IntersectionObserver(
      (entries) => {
        const scrollTarget = scrollTargetRef.current
        if (scrollTarget) {
          const reachedTarget = entries.some(
            (entry) => entry.isIntersecting && entry.target.id === scrollTarget
          )
          if (reachedTarget) scrollTargetRef.current = null
          else return
        }

        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (left, right) =>
              left.boundingClientRect.top - right.boundingClientRect.top
          )
        const sectionId = visible[0]?.target.id
        if (sectionId) updateActiveSection(sectionId)
      },
      { rootMargin: "-56px 0px -68% 0px", threshold: 0.01 }
    )

    for (const sectionId of landingSectionIds) {
      const section = document.getElementById(sectionId)
      if (section) observer.observe(section)
    }

    const cancelProgrammaticScroll = () => {
      scrollTargetRef.current = null
    }
    const cancelProgrammaticScrollFromKeyboard = (event: KeyboardEvent) => {
      if (
        [
          "ArrowDown",
          "ArrowUp",
          "End",
          "Home",
          "PageDown",
          "PageUp",
          " ",
        ].includes(event.key)
      ) {
        cancelProgrammaticScroll()
      }
    }

    window.addEventListener("wheel", cancelProgrammaticScroll, {
      passive: true,
    })
    window.addEventListener("touchstart", cancelProgrammaticScroll, {
      passive: true,
    })
    window.addEventListener("keydown", cancelProgrammaticScrollFromKeyboard)

    return () => {
      observer.disconnect()
      window.removeEventListener("wheel", cancelProgrammaticScroll)
      window.removeEventListener("touchstart", cancelProgrammaticScroll)
      window.removeEventListener(
        "keydown",
        cancelProgrammaticScrollFromKeyboard
      )
    }
  }, [pathname, updateActiveSection])

  return { activeSection, items: landingNavigation, navigateToSection }
}
