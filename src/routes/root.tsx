import { useState } from "react"
import { createAuthClient } from "@neondatabase/auth"
import { createFileRoute, redirect } from "@tanstack/react-router"

import { PageShell } from "@/components/shared/page-shell"
import { Button } from "@/components/ui/button"
import {
  CircleDashedIcon,
  GoogleIcon,
  LogoutIcon,
  ShieldCheckIcon,
} from "@/components/ui/icons"
import { getPortfolioOwnerAuth } from "@/features/owner-auth/application/owner-auth"
import { OWNER_OAUTH_CALLBACK_PATH } from "@/features/owner-auth/infrastructure/oauth-callback"

export const Route = createFileRoute("/root")({
  loader: async () => {
    const auth = await getPortfolioOwnerAuth()

    if (auth.status === "owner") {
      throw redirect({
        to: "/dashboard",
      })
    }

    return auth
  },
  head: () => ({
    meta: [
      { title: "Owner access | Montasim" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: OwnerRootPage,
})

function getBrowserAuthClient() {
  return createAuthClient(
    new URL("/api/auth", window.location.origin).toString()
  )
}

function OwnerRootPage() {
  const auth = Route.useLoaderData()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState("")

  async function signInWithGoogle() {
    setIsPending(true)
    setError("")

    try {
      const result = await getBrowserAuthClient().signIn.social({
        provider: "google",
        callbackURL: OWNER_OAUTH_CALLBACK_PATH,
        errorCallbackURL: "/root",
      })

      if (!result.error) return
      setError("Google sign-in could not be started. Try again.")
    } catch {
      setError("Google sign-in could not be started. Try again.")
    } finally {
      setIsPending(false)
    }
  }

  async function signOut() {
    setIsPending(true)
    setError("")

    try {
      const result = await getBrowserAuthClient().signOut()
      if (!result.error) {
        window.location.assign("/root")
        return
      }

      setError("Sign-out failed. Try again.")
    } catch {
      setError("Sign-out failed. Try again.")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <PageShell className="flex min-h-[calc(100dvh-10rem)] items-center py-12 sm:py-16">
      <section
        aria-labelledby="owner-access-heading"
        className="mx-auto w-full max-w-xl overflow-hidden rounded-2xl border bg-background"
      >
        <header className="border-b px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <ShieldCheckIcon className="text-emphasis-foreground" />
            Private owner access
          </div>
          <h1
            id="owner-access-heading"
            className="mt-3 text-xl font-semibold tracking-tight text-emphasis-foreground sm:text-2xl"
          >
            {auth.status === "unconfigured"
              ? "Owner access unavailable"
              : auth.status === "forbidden"
                ? "Access restricted"
                : "Sign in to continue"}
          </h1>
        </header>

        <div className="px-5 py-6 sm:px-7 sm:py-7">
          {auth.status === "forbidden" ? (
            <>
              <p className="text-sm leading-6 text-muted-foreground">
                <strong className="text-emphasis-foreground">
                  {auth.email}
                </strong>{" "}
                does not have access to this area. Sign out and use the
                portfolio owner account.
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-6"
                disabled={isPending}
                onClick={signOut}
              >
                <LogoutIcon />
                {isPending ? "Preparing sign-in" : "Use another account"}
              </Button>
            </>
          ) : auth.status === "unconfigured" ? (
            <p className="text-sm leading-6 text-muted-foreground">
              Owner access is not configured for this environment.
            </p>
          ) : (
            <>
              <p className="text-sm leading-6 text-muted-foreground">
                Use the authorized Google account to manage blog comments. No
                other sign-in method is available.
              </p>
              <Button
                type="button"
                className="mt-6 min-w-[11.25rem] bg-emphasis-foreground text-background hover:bg-emphasis-foreground/80"
                disabled={isPending}
                onClick={signInWithGoogle}
              >
                {isPending ? (
                  <CircleDashedIcon className="animate-spin motion-reduce:animate-none" />
                ) : (
                  <GoogleIcon />
                )}
                <span aria-live="polite">
                  {isPending ? "Opening Google" : "Continue with Google"}
                </span>
              </Button>
            </>
          )}

          {error ? (
            <p className="mt-4 text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </section>
    </PageShell>
  )
}
