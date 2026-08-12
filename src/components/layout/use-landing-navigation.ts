import { useEffect, useState } from "react"
import { landingNavigation } from "@/lib/site"

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
        if (visible[0]?.target.id) setActiveSection(visible[0].target.id)
      },
      { rootMargin: "-56px 0px -68% 0px", threshold: 0.01 }
    )

    for (const item of landingNavigation) {
      const section = document.getElementById(item.sectionId)
      if (section) observer.observe(section)
    }

    return () => observer.disconnect()
  }, [pathname])

  return { activeSection, items: landingNavigation }
}
