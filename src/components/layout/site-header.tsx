import { useEffect, useState } from "react"
import { Link, useRouterState } from "@tanstack/react-router"
import { useServerFn } from "@tanstack/react-start"
import { ListIcon, MoonIcon, SunIcon } from "@/components/ui/icons"
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
import { useLandingNavigation } from "@/components/layout/use-landing-navigation"
import { getPortfolioOwnerAuth } from "@/features/owner-auth/application/owner-auth"
import { cn } from "@/lib/utils"

function Brand({ isOwner }: { isOwner: boolean }) {
  return (
    <Link
      to="/"
      aria-label={isOwner ? "Montasim — owner signed in" : "Montasim"}
      className="flex items-center gap-2 rounded-md font-semibold tracking-tight transition-opacity duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:opacity-75 active:opacity-60 motion-reduce:transition-none"
    >
      <span className="relative shrink-0">
        <img
          src="/images/logo.webp"
          alt=""
          width="28"
          height="28"
          className="size-7 rounded-sm"
        />
        {isOwner ? (
          <span
            className="absolute right-0 bottom-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-background"
            aria-hidden="true"
          />
        ) : null}
      </span>
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
  const getOwnerAuth = useServerFn(getPortfolioOwnerAuth)
  const [isOwner, setIsOwner] = useState(false)
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const hash = useRouterState({
    select: (state) => state.location.hash,
  })
  const { activeSection, items, navigateToSection } = useLandingNavigation(
    pathname,
    hash
  )

  useEffect(() => {
    let active = true

    void getOwnerAuth()
      .then((auth) => {
        if (active) setIsOwner(auth.status === "owner")
      })
      .catch(() => {
        if (active) setIsOwner(false)
      })

    return () => {
      active = false
    }
  }, [getOwnerAuth])

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
    <header className="site-header-enter sticky top-0 z-40 border-b bg-background/98">
      <SiteContainer asChild className="flex h-14 items-center justify-between">
        <nav aria-label="Primary navigation">
          <Brand isOwner={isOwner} />
          <div className="hidden items-center gap-1 lg:flex">
            {items.map((item) => {
              const isActive =
                pathname === "/" && activeSection === item.sectionId
              return (
                <Link
                  key={item.sectionId}
                  to="/"
                  hash={item.sectionId}
                  onClick={(event) => {
                    if (!navigateToSection(item.sectionId)) return
                    event.preventDefault()
                  }}
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
            <Link
              to="/blog"
              search={{ topic: "all", q: "" }}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-[color,background-color,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-muted hover:text-foreground active:scale-[0.98] motion-reduce:transition-none",
                pathname.startsWith("/blog") &&
                  "bg-muted font-medium text-foreground"
              )}
              aria-current={pathname.startsWith("/blog") ? "page" : undefined}
            >
              Blog
            </Link>
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
              <SheetContent closeLabel="Close navigation">
                <SheetTitle className="mb-6">
                  <Brand isOwner={isOwner} />
                </SheetTitle>
                <nav className="grid gap-1" aria-label="Mobile navigation">
                  {items.map((item) => {
                    const isActive =
                      pathname === "/" && activeSection === item.sectionId
                    return (
                      <SheetClose key={item.sectionId} asChild>
                        <Link
                          to="/"
                          hash={item.sectionId}
                          onClick={(event) => {
                            if (!navigateToSection(item.sectionId)) return
                            event.preventDefault()
                          }}
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
                  <SheetClose asChild>
                    <Link
                      to="/blog"
                      search={{ topic: "all", q: "" }}
                      className={cn(
                        "rounded-md px-3 py-2 text-sm text-muted-foreground transition-[color,background-color,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-muted hover:text-foreground active:scale-[0.98] motion-reduce:transition-none",
                        pathname.startsWith("/blog") &&
                          "bg-muted font-medium text-foreground"
                      )}
                      aria-current={
                        pathname.startsWith("/blog") ? "page" : undefined
                      }
                    >
                      Blog
                    </Link>
                  </SheetClose>
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
