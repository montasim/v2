import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router"

import appCss from "../styles.css?url"
import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { SideRails } from "@/components/layout/side-rails"
import { KonamiCommandCenter } from "@/components/portfolio/konami-command-center"
import { PageShell } from "@/components/shared/page-shell"
import { ThemeProvider } from "@/components/theme-provider"
import { PortfolioAssistant } from "@/features/chat/ui/portfolio-assistant"
import { createMeta, site } from "@/lib/site"

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#f6f6f3" },
      ...createMeta(site.fullName, site.description).meta,
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "icon",
        href: "/images/logo.webp",
        type: "image/webp",
        sizes: "64x64",
      },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "canonical", href: site.url },
    ],
  }),
  notFoundComponent: () => (
    <PageShell className="py-24 text-center">
      <p className="text-sm text-muted-foreground">404</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        The requested page does not exist.
      </p>
    </PageShell>
  ),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className="scroll-smooth motion-reduce:scroll-auto"
      suppressHydrationWarning
    >
      <head>
        <HeadContent />
      </head>
      <body className="min-h-[100dvh] bg-background text-foreground antialiased selection:bg-[#d8aa63] selection:text-[#151614]">
        <ThemeProvider>
          <a
            href="#main-content"
            className="fixed top-4 left-4 z-[60] -translate-y-24 rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-background transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] focus:translate-y-0 motion-reduce:transition-none"
          >
            Skip to content
          </a>
          <SiteHeader />
          <SideRails />
          <KonamiCommandCenter />
          <PortfolioAssistant />
          {children}
          <SiteFooter />
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  )
}
