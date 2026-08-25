import { useCallback, useEffect, useRef, useState } from "react"
import { landingNavigation, landingSectionIds } from "@/lib/site"

const landingTopSectionId = landingNavigation[0].sectionId
const scrollAnimationDurationMs = 700
const instantScrollBehavior = "instant" as ScrollBehavior

function setWindowScrollTop(top: number) {
  window.scrollTo({ left: 0, top, behavior: instantScrollBehavior })
}

function getSectionScrollTop(section: HTMLElement) {
  const scrollMarginTop = Number.parseFloat(
    window.getComputedStyle(section).scrollMarginTop
  )

  return Math.max(
    0,
    window.scrollY +
      section.getBoundingClientRect().top -
      (Number.isNaN(scrollMarginTop) ? 0 : scrollMarginTop)
  )
}

function animateWindowScrollTo(targetY: number) {
  const startY = window.scrollY
  const distance = targetY - startY
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches

  if (Math.abs(distance) < 1 || prefersReducedMotion) {
    setWindowScrollTop(targetY)
    return () => undefined
  }

  let animationFrame = 0
  let startedAt: number | undefined
  let settled = false

  const settle = () => {
    if (settled) return
    settled = true
  }

  const step = (timestamp: number) => {
    startedAt ??= timestamp
    const progress = Math.min(
      (timestamp - startedAt) / scrollAnimationDurationMs,
      1
    )
    const easedProgress = 1 - Math.pow(1 - progress, 4)

    setWindowScrollTop(Math.round(startY + distance * easedProgress))

    if (progress < 1) {
      animationFrame = window.requestAnimationFrame(step)
      return
    }

    settle()
  }

  animationFrame = window.requestAnimationFrame(step)

  return () => {
    if (settled) return
    window.cancelAnimationFrame(animationFrame)
    settle()
  }
}

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

function clearHash() {
  if (!window.location.hash) return

  const url = new URL(window.location.href)
  url.hash = ""
  window.history.replaceState(
    window.history.state,
    "",
    `${url.pathname}${url.search}`
  )
}

export function useLandingNavigation(pathname: string, hash: string) {
  const [activeSection, setActiveSection] = useState(
    hash.replace(/^#/, "") || landingNavigation[0].sectionId
  )
  const activeSectionRef = useRef(activeSection)
  const scrollTargetRef = useRef<string | null>(null)
  const keepHomeUrlHashlessRef = useRef(false)
  const cancelScrollAnimationRef = useRef<(() => void) | null>(null)

  const updateActiveSection = useCallback((sectionId: string) => {
    if (keepHomeUrlHashlessRef.current) {
      if (sectionId === landingTopSectionId) {
        activeSectionRef.current = sectionId
        setActiveSection(sectionId)
        clearHash()
        return
      }

      keepHomeUrlHashlessRef.current = false
    }

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

      cancelScrollAnimationRef.current?.()
      keepHomeUrlHashlessRef.current = false
      scrollTargetRef.current = sectionId
      updateActiveSection(sectionId)
      cancelScrollAnimationRef.current = animateWindowScrollTo(
        getSectionScrollTop(section)
      )

      return true
    },
    [pathname, updateActiveSection]
  )

  const navigateToTop = useCallback(() => {
    if (pathname !== "/") return false

    cancelScrollAnimationRef.current?.()
    keepHomeUrlHashlessRef.current = true
    scrollTargetRef.current = landingTopSectionId
    activeSectionRef.current = landingTopSectionId
    setActiveSection(landingTopSectionId)
    clearHash()
    cancelScrollAnimationRef.current = animateWindowScrollTo(0)

    return true
  }, [pathname])

  useEffect(() => {
    if (pathname !== "/" || !hash) return

    const sectionId = hash.replace(/^#/, "")
    keepHomeUrlHashlessRef.current = false
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
      cancelScrollAnimationRef.current?.()
      cancelScrollAnimationRef.current = null
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
      cancelScrollAnimationRef.current?.()
      cancelScrollAnimationRef.current = null
      observer.disconnect()
      window.removeEventListener("wheel", cancelProgrammaticScroll)
      window.removeEventListener("touchstart", cancelProgrammaticScroll)
      window.removeEventListener(
        "keydown",
        cancelProgrammaticScrollFromKeyboard
      )
    }
  }, [pathname, updateActiveSection])

  return {
    activeSection,
    items: landingNavigation,
    navigateToSection,
    navigateToTop,
  }
}
