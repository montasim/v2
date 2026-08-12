import { Link, useRouterState } from "@tanstack/react-router"
import { ListIcon, MoonIcon, SunIcon } from "@phosphor-icons/react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { SiteContainer } from "@/components/shared/site-container"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useTheme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

const landingNavigation = [
  { label: "About", sectionId: "about" },
  { label: "Experience", sectionId: "experience" },
  { label: "Projects", sectionId: "projects" },
  { label: "Skills", sectionId: "skills" },
] as const

function Brand() {
  return (
    <Link
      to="/"
      className="flex items-center gap-2 rounded-md font-semibold tracking-tight transition-opacity duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:opacity-75 active:opacity-60 motion-reduce:transition-none"
    >
      <img
        src="/images/logo.webp"
        alt=""
        width="28"
        height="28"
        className="size-7 rounded-sm"
      />
      <span>Montasim</span>
    </Link>
  )
}

function ScrollProgress() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-px bg-emphasis-foreground/15"
      aria-hidden="true"
    >
      <div className="reading-progress h-full bg-emphasis-foreground will-change-transform" />
    </div>
  )
}

export function SiteHeader() {
  const { theme, toggleTheme } = useTheme()
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const hash = useRouterState({
    select: (state) => state.location.hash,
  })
  const [activeSection, setActiveSection] = useState<string>("about")

  useEffect(() => {
    if (pathname !== "/" || !hash) return

    const sectionId = hash.replace(/^#/, "")
    const section = document.getElementById(sectionId)
    if (!section) return

    setActiveSection(sectionId)
    section.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    })
  }, [hash, pathname])

  useEffect(() => {
    if (pathname !== "/") return

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleSection = entries.find((entry) => entry.isIntersecting)
        if (visibleSection?.target.id) {
          setActiveSection(visibleSection.target.id)
        }
      },
      { rootMargin: "-56px 0px -68% 0px", threshold: 0.01 }
    )

    for (const item of landingNavigation) {
      const section = document.getElementById(item.sectionId)
      if (section) observer.observe(section)
    }

    return () => {
      observer.disconnect()
    }
  }, [pathname])

  const themeButton = (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </Button>
  )
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm">
      <SiteContainer asChild className="flex h-14 items-center justify-between">
        <nav aria-label="Primary navigation">
          <Brand />
          <div className="hidden items-center gap-1 lg:flex">
            {landingNavigation.map((item) => {
              const isActive =
                pathname === "/" && activeSection === item.sectionId
              return (
                <Link
                  key={item.sectionId}
                  to="/"
                  hash={item.sectionId}
                  className={cn(
                    "rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-[color,background-color,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-muted hover:text-foreground active:scale-[0.98] motion-reduce:transition-none",
                    isActive && "bg-muted font-medium text-foreground"
                  )}
                  aria-current={isActive ? "location" : undefined}
                >
                  {item.label}
                </Link>
              )
            })}
            <span className="mx-1 h-4 border-l" aria-hidden="true" />
            {themeButton}
          </div>
          <div className="flex items-center gap-1 lg:hidden">
            {themeButton}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Open navigation"
                >
                  <ListIcon />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetTitle className="mb-6">
                  <Brand />
                </SheetTitle>
                <nav className="grid gap-1" aria-label="Mobile navigation">
                  {landingNavigation.map((item) => {
                    const isActive =
                      pathname === "/" && activeSection === item.sectionId
                    return (
                      <SheetClose key={item.sectionId} asChild>
                        <Link
                          to="/"
                          hash={item.sectionId}
                          className={cn(
                            "rounded-md px-3 py-2 text-sm text-muted-foreground transition-[color,background-color,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-muted hover:text-foreground active:scale-[0.98] motion-reduce:transition-none",
                            isActive && "bg-muted font-medium text-foreground"
                          )}
                          aria-current={isActive ? "location" : undefined}
                        >
                          {item.label}
                        </Link>
                      </SheetClose>
                    )
                  })}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </SiteContainer>
      <ScrollProgress />
    </header>
  )
}
