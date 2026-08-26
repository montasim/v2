import { useEffect, useState } from "react"
import { createAuthClient } from "@neondatabase/auth"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useServerFn } from "@tanstack/react-start"

import { PageShell } from "@/components/shared/page-shell"
import { Button } from "@/components/ui/button"
import { CircleDashedIcon, ShieldCheckIcon } from "@/components/ui/icons"
import { resolveOwnerOAuthDestination } from "@/features/owner-auth/infrastructure/oauth-callback"
import { getPortfolioOwnerAuth } from "@/features/owner-auth/application/owner-auth"

export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [
      { title: "Completing sign-in | Montasim" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: OwnerOAuthCallbackPage,
})

function OwnerOAuthCallbackPage() {
  const [failed, setFailed] = useState(false)
  const getOwnerAuth = useServerFn(getPortfolioOwnerAuth)

  useEffect(() => {
    let active = true
    const client = createAuthClient(
      new URL("/api/auth", window.location.origin).toString()
    )

    void resolveOwnerOAuthDestination(
      () => client.getSession(),
      () => getOwnerAuth()
    ).then((destination) => {
      if (!active) return
      if (destination === "/root") {
        setFailed(true)
        return
      }
      window.location.replace(destination)
    })

    return () => {
      active = false
    }
  }, [getOwnerAuth])

  return (
    <PageShell className="flex min-h-[calc(100dvh-10rem)] items-center py-12 sm:py-16">
      <section
        aria-labelledby="oauth-callback-heading"
        className="mx-auto w-full max-w-xl overflow-hidden rounded-2xl border bg-background"
      >
        <header className="border-b px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <ShieldCheckIcon className="text-strong-foreground" />
            Private owner access
          </div>
          <h1
            id="oauth-callback-heading"
            className="mt-3 text-xl font-semibold tracking-tight text-strong-foreground sm:text-2xl"
          >
            {failed ? "Sign-in could not be completed" : "Completing sign-in"}
          </h1>
        </header>

        <div className="px-5 py-6 sm:px-7 sm:py-7">
          {failed ? (
            <>
              <p className="text-sm leading-6 text-muted-foreground">
                This Google account could not be authorized. Return to owner
                access and try again with the configured account.
              </p>
              <Button asChild className="mt-6">
                <Link to="/root">Return to sign-in</Link>
              </Button>
            </>
          ) : (
            <div
              className="flex items-center gap-2 text-sm text-muted-foreground"
              role="status"
            >
              <CircleDashedIcon className="animate-spin motion-reduce:animate-none" />
              Verifying your Google session…
            </div>
          )}
        </div>
      </section>
    </PageShell>
  )
}
