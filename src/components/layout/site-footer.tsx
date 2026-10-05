import { Link } from "@tanstack/react-router"
import { Separator } from "@/components/ui/separator"
import { SiteContainer } from "@/components/shared/site-container"
import { profileCatalog } from "@/lib/content/profile"

const footerLinkClass =
  "inline-flex min-h-11 items-center rounded-sm px-2.5 text-sm font-medium text-strong-foreground underline-offset-8 transition-colors hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring motion-reduce:transition-none"

export function SiteFooter() {
  const { profile } = profileCatalog
  return (
    <SiteContainer asChild className="pt-4 pb-24 sm:pb-8">
      <footer>
        <Separator />
        <div className="flex flex-col items-center justify-center gap-x-6 gap-y-2 pt-5 text-center sm:flex-row sm:flex-wrap sm:justify-between sm:text-left">
          <p className="text-xs leading-5 text-muted-foreground">
            © {new Date().getFullYear()} {profile.name}
          </p>
          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap items-center justify-center gap-1 sm:ml-auto"
          >
            <Link
              to="/contact"
              className={footerLinkClass}
              activeProps={{
                className: "underline decoration-border",
                "aria-current": "page",
              }}
            >
              Contact
            </Link>
            <Link
              to="/case-studies"
              className={footerLinkClass}
              activeProps={{
                className: "underline decoration-border",
                "aria-current": "page",
              }}
            >
              Case studies
            </Link>
            <Link
              to="/blog"
              search={{ topic: "all", q: "" }}
              className={footerLinkClass}
              activeProps={{
                className: "underline decoration-border",
                "aria-current": "page",
              }}
            >
              Blog
            </Link>
            <Link
              to="/projects"
              className={footerLinkClass}
              activeProps={{
                className: "underline decoration-border",
                "aria-current": "page",
              }}
            >
              Projects
            </Link>
          </nav>
        </div>
      </footer>
    </SiteContainer>
  )
}
