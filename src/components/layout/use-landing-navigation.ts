import { useEffect, useState } from "react"
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

  useEffect(() => {
    if (pathname === "/" && hash) setActiveSection(hash.replace(/^#/, ""))
  }, [hash, pathname])

  useEffect(() => {
    if (pathname !== "/") return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (left, right) =>
              left.boundingClientRect.top - right.boundingClientRect.top
          )
        const sectionId = visible[0]?.target.id
        if (sectionId) {
          setActiveSection(sectionId)
          replaceHash(sectionId)
        }
      },
      { rootMargin: "-56px 0px -68% 0px", threshold: 0.01 }
    )

    for (const sectionId of landingSectionIds) {
      const section = document.getElementById(sectionId)
      if (section) observer.observe(section)
    }

    return () => observer.disconnect()
  }, [pathname])

  return { activeSection, items: landingNavigation }
}
