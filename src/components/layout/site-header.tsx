import { useEffect, useState } from "react"
import { Link, useRouterState } from "@tanstack/react-router"
import { useServerFn } from "@tanstack/react-start"
import {
  BookOpenTextIcon,
  BriefcaseIcon,
  CodeIcon,
  EnvelopeSimpleIcon,
  FilesIcon,
  FolderIcon,
  ListIcon,
  MoonIcon,
  SunIcon,
  UserIcon,
} from "@/components/ui/icons"
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
import { replaySiteLoader } from "@/components/layout/site-loader"
import { NewsletterForm } from "@/features/newsletter/ui/newsletter-form"
import { getPortfolioOwnerAuth } from "@/features/owner-auth/application/owner-auth"
import {
  getPageScrollEventTarget,
  getPageScrollTop,
  isPageScrolledToEnd,
} from "@/lib/page-scroll"
import type { landingNavigation } from "@/lib/site"
import { cn } from "@/lib/utils"

// Keyed by the landing sections, so a new section without an icon fails to compile.
const mobileMenuIcons: Record<
  (typeof landingNavigation)[number]["sectionId"],
  typeof UserIcon
> = {
  about: UserIcon,
  experience: BriefcaseIcon,
  projects: FolderIcon,
  skills: CodeIcon,
}

const mobileMenuLinkClassName =
  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-strong-foreground transition-[color,background-color,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-foreground/5 active:scale-[0.98] motion-reduce:transition-none"

function Brand({
  isOwner,
  navigateToTop,
}: {
  isOwner: boolean
  navigateToTop: () => boolean
}) {
  return (
    <Link
      to="/"
      onClick={(event) => {
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return
        }
        replaySiteLoader()
        if (!navigateToTop()) return
        event.preventDefault()
      }}
      aria-label={isOwner ? "Montasim — owner signed in" : "Montasim"}
      className="flex items-center gap-2 rounded-md font-semibold tracking-tight text-strong-foreground"
    >
      <span className="relative shrink-0">
        <img
          src="/images/logo-animated.svg"
          alt=""
          width="28"
          height="28"
          className="size-7"
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

const navHideOffset = 56
const scrollJitter = 8

// "down" slides the header away, "up" brings it back with a shadow, "top" is the resting state.
function useNavScrollState() {
  const [state, setState] = useState<"top" | "up" | "down">("top")

  useEffect(() => {
    const target = getPageScrollEventTarget()
    let lastTop = getPageScrollTop()

    const onScroll = () => {
      const top = getPageScrollTop()
      if (top < navHideOffset) {
        setState("top")
      } else if (Math.abs(top - lastTop) < scrollJitter) {
        return
      } else if (top > lastTop) {
        setState("down")
      } else if (!isPageScrolledToEnd()) {
        // Hiding the header grows the scroller, which clamps scrollTop at the end; ignore that.
        setState("up")
      }
      lastTop = top
    }

    target.addEventListener("scroll", onScroll, { passive: true })
    return () => target.removeEventListener("scroll", onScroll)
  }, [])

  return state
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
  const { activeSection, items, navigateToSection, navigateToTop } =
    useLandingNavigation(pathname, hash)
  const navScrollState = useNavScrollState()

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
    <header
      data-nav={navScrollState}
      className="site-header site-header-enter sticky top-0 z-40 border-b bg-background/82 backdrop-blur-[20px]"
    >
      <SiteContainer asChild className="flex h-14 items-center justify-between">
        <nav aria-label="Primary navigation">
          <Brand isOwner={isOwner} navigateToTop={navigateToTop} />
          <div className="nav-stagger hidden items-center gap-1 lg:flex">
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
                    "rounded-md px-2.5 py-1.5 text-sm font-medium text-strong-foreground transition-[color,background-color,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-foreground/5 active:scale-[0.98] motion-reduce:transition-none",
                    isActive && "bg-foreground/10"
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
                "rounded-md px-2.5 py-1.5 text-sm font-medium text-strong-foreground transition-[color,background-color,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-foreground/5 active:scale-[0.98] motion-reduce:transition-none",
                pathname.startsWith("/blog") && "bg-foreground/10"
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
              <SheetContent
                closeLabel="Close navigation"
                // Radix skips links when auto-focusing, so it would land on the newsletter
                // email field and pop the phone keyboard; focus the panel instead.
                onOpenAutoFocus={(event) => {
                  event.preventDefault()
                  ;(event.currentTarget as HTMLElement).focus()
                }}
              >
                <SheetTitle className="mb-6">
                  <Brand isOwner={isOwner} navigateToTop={navigateToTop} />
                </SheetTitle>
                <nav className="grid gap-1" aria-label="Mobile navigation">
                  {items.map((item) => {
                    const isActive =
                      pathname === "/" && activeSection === item.sectionId
                    const Icon = mobileMenuIcons[item.sectionId]
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
                            mobileMenuLinkClassName,
                            isActive && "bg-foreground/10"
                          )}
                          aria-current={isActive ? "location" : undefined}
                        >
                          <Icon className="size-4.5" aria-hidden="true" />
                          {item.label}
                        </Link>
                      </SheetClose>
                    )
                  })}
                  <SheetClose asChild>
                    <Link
                      to="/case-studies"
                      className={cn(
                        mobileMenuLinkClassName,
                        pathname.startsWith("/case-studies") &&
                          "bg-foreground/10"
                      )}
                      aria-current={
                        pathname.startsWith("/case-studies")
                          ? "page"
                          : undefined
                      }
                    >
                      <FilesIcon className="size-4.5" aria-hidden="true" />
                      Case studies
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      to="/blog"
                      search={{ topic: "all", q: "" }}
                      className={cn(
                        mobileMenuLinkClassName,
                        pathname.startsWith("/blog") && "bg-foreground/10"
                      )}
                      aria-current={
                        pathname.startsWith("/blog") ? "page" : undefined
                      }
                    >
                      <BookOpenTextIcon
                        className="size-4.5 translate-y-px"
                        aria-hidden="true"
                      />
                      Blog
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      to="/contact"
                      className={cn(
                        mobileMenuLinkClassName,
                        pathname === "/contact" && "bg-foreground/10"
                      )}
                      aria-current={
                        pathname === "/contact" ? "page" : undefined
                      }
                    >
                      <EnvelopeSimpleIcon
                        className="size-4.5"
                        aria-hidden="true"
                      />
                      Contact
                    </Link>
                  </SheetClose>
                </nav>
                <section
                  aria-labelledby="mobile-newsletter-heading"
                  className="mt-auto border-t pt-5"
                >
                  <h3
                    id="mobile-newsletter-heading"
                    className="text-sm font-semibold text-strong-foreground"
                  >
                    Subscribe to the newsletter
                  </h3>
                  <p className="mt-0.5 text-xs leading-[1.55] text-muted-foreground">
                    Occasional engineering notes. A confirmation email will be
                    sent after subscribing.
                  </p>
                  <NewsletterForm className="mt-4" />
                </section>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </SiteContainer>
      <ScrollProgress />
    </header>
  )
}
