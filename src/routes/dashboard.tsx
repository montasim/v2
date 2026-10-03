import { useState } from "react"
import { createAuthClient } from "@neondatabase/auth"
import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useRouterState,
  useRouter,
} from "@tanstack/react-router"
import { useServerFn } from "@tanstack/react-start"

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-state"
import {
  dashboardNavigation,
  dashboardPageFor,
} from "@/components/dashboard/dashboard-navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Pagination as PaginationRoot,
  PaginationButton,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination"
import { Switch } from "@/components/ui/switch"
import {
  ArrowLeftCompactIcon,
  ArrowLeftDoubleIcon,
  ArrowRightCompactIcon,
  ArrowRightDoubleIcon,
  ArrowUpRightIcon,
  CircleDashedIcon,
  LogoutIcon,
  MoonIcon,
  SunIcon,
} from "@/components/ui/icons"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTheme } from "@/components/theme-provider"
import { updateOwnerAvailabilitySettings } from "@/features/availability/application/settings"
import { getPortfolioOwnerAuth } from "@/features/owner-auth/application/owner-auth"
import type { OwnerDashboardData } from "@/features/owner-dashboard/infrastructure/dashboard.server"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/dashboard")({
  loader: async () => {
    const auth = await getPortfolioOwnerAuth()
    if (auth.status !== "owner") {
      throw redirect({ to: "/root" })
    }
    return auth
  },
  head: () => ({
    meta: [
      { title: "Dashboard | Montasim" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: OwnerDashboardPage,
})

function OwnerDashboardPage() {
  const auth = Route.useLoaderData()
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const [signingOut, setSigningOut] = useState(false)
  const page = dashboardPageFor(pathname)

  async function signOut() {
    setSigningOut(true)
    const client = createAuthClient(
      new URL("/api/auth", window.location.origin).toString()
    )
    await client.signOut().catch(() => undefined)
    window.location.assign("/root")
  }

  const navigationLinks = dashboardNavigation.map(
    ({ to, label, icon: Icon }) => (
      <Link
        key={to}
        to={to}
        aria-current={page.to === to ? "page" : undefined}
        onClick={(event) =>
          event.currentTarget.closest("details")?.removeAttribute("open")
        }
        className={cn(
          "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2",
          page.to === to && "bg-muted font-semibold text-foreground"
        )}
      >
        <Icon className="size-4 shrink-0" />
        {label}
      </Link>
    )
  )
  const signOutButton = (
    <Button
      variant="outline"
      className="h-10 rounded-lg px-3 text-foreground"
      onClick={signOut}
      disabled={signingOut}
    >
      {signingOut ? (
        <CircleDashedIcon className="size-4 animate-spin motion-reduce:animate-none" />
      ) : null}
      Sign out
    </Button>
  )

  return (
    <div className="dashboard-shell min-h-dvh bg-background text-foreground">
      <a
        href="#dashboard-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-card focus:p-3"
      >
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 flex-col border-r bg-card lg:flex">
        <Link
          to="/"
          className="flex h-20 shrink-0 items-center gap-3 px-5 focus-visible:outline-2 focus-visible:outline-offset-[-4px]"
          aria-label="Montasim — visit portfolio"
        >
          <img
            src="/images/logo.webp"
            alt=""
            className="size-9 rounded-sm object-contain"
          />
          <span className="font-semibold">
            Montasim
            <span className="block text-xs font-normal text-muted-foreground">
              Portfolio control room
            </span>
          </span>
        </Link>
        <nav
          aria-label="Dashboard"
          className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-4"
        >
          {navigationLinks}
        </nav>
        <div className="border-t p-3">
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
            <Avatar className="size-8 shrink-0">
              <AvatarImage
                src={auth.user.image ?? undefined}
                alt=""
                referrerPolicy="no-referrer"
              />
              <AvatarFallback className="text-xs font-semibold">
                {initials(auth.user.name || "Owner")}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm leading-5 font-medium">
                {auth.user.name}
              </p>
              <p
                className="truncate text-xs text-muted-foreground"
                title={auth.user.email}
              >
                {auth.user.email}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={signOut}
              disabled={signingOut}
              aria-label="Sign out"
              title="Sign out"
            >
              {signingOut ? (
                <CircleDashedIcon className="size-4 animate-spin motion-reduce:animate-none" />
              ) : (
                <LogoutIcon className="size-4" />
              )}
            </Button>
          </div>
        </div>
      </aside>
      <div className="min-w-0 lg:ml-56">
        <DashboardPageHeader
          key={page.to}
          title={page.label}
          description={page.description}
          onRefresh={page.refresh ? () => router.invalidate() : undefined}
          leadingActions={
            <Button
              variant="outline"
              className="h-10 rounded-lg px-3 text-foreground"
              asChild
            >
              <Link to="/" aria-label="View portfolio">
                <ArrowUpRightIcon className="size-4" />
                <span className="hidden sm:inline">View portfolio</span>
              </Link>
            </Button>
          }
          actions={
            <Button
              variant="outline"
              className="h-10 rounded-lg px-3 text-foreground"
              onClick={toggleTheme}
              aria-label={`Use ${theme === "dark" ? "light" : "dark"} theme`}
            >
              {theme === "dark" ? (
                <SunIcon className="size-4" />
              ) : (
                <MoonIcon className="size-4" />
              )}
              <span className="hidden sm:inline">
                {theme === "dark" ? "Light" : "Dark"}
              </span>
            </Button>
          }
        />
        <details className="border-b bg-card px-4 lg:hidden">
          <summary className="cursor-pointer py-3 text-sm font-medium focus-visible:outline-2">
            Dashboard navigation
          </summary>
          <nav
            aria-label="Mobile dashboard"
            className="grid gap-1 pb-3 sm:grid-cols-2"
          >
            {navigationLinks}
          </nav>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-t pt-3">
            {signOutButton}
          </div>
        </details>
        <main
          id="dashboard-main"
          className="mx-auto max-w-[1440px] min-w-0 p-4 sm:p-6"
        >
          <div className="mb-5 flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <nav
              aria-label="Breadcrumb"
              className="flex min-w-0 items-center gap-2"
            >
              <Link to="/dashboard" className="hover:underline">
                Dashboard
              </Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page" className="truncate">
                {page.label}
              </span>
            </nav>
            <span className="shrink-0">Private workspace</span>
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export { Overview } from "@/components/dashboard/dashboard-overview"

type DashboardData = OwnerDashboardData

export {
  Inquiries,
  Conversations,
  Comments,
} from "@/components/dashboard/dashboard-records"

type PaginationProps = {
  label: string
  onPageChange: (page: number) => void
  page: number
  pageCount: number
  pageSize: number
  total: number
}

export function Pagination({
  label,
  onPageChange,
  page,
  pageCount,
  pageSize,
  total,
}: PaginationProps) {
  if (!total) return null

  const first = (page - 1) * pageSize + 1
  const last = Math.min(page * pageSize, total)
  const pages = paginationItems(page, pageCount)

  return (
    <PaginationRoot
      className="mt-6 flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center"
      aria-label={`${label} pagination`}
    >
      <p className="text-xs text-muted-foreground" aria-live="polite">
        Showing{" "}
        <span className="font-medium text-strong-foreground">
          {first}–{last}
        </span>{" "}
        of <span className="font-medium text-strong-foreground">{total}</span>{" "}
        {label}
      </p>

      {pageCount > 1 ? (
        <PaginationContent className="sm:ml-auto">
          <PaginationItem>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={page === 1}
              onClick={() => onPageChange(1)}
              aria-label={`First ${label} page`}
            >
              <ArrowLeftDoubleIcon />
            </Button>
          </PaginationItem>

          <PaginationItem>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={page === 1}
              onClick={() => onPageChange(page - 1)}
              aria-label={`Previous ${label} page`}
            >
              <ArrowLeftCompactIcon />
            </Button>
          </PaginationItem>

          {pages.map((item, index) =>
            item === "ellipsis" ? (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={item}>
                <PaginationButton
                  key={item}
                  isActive={item === page}
                  className={cn(
                    "text-xs",
                    item === page &&
                      "bg-emphasis-foreground text-background hover:bg-emphasis-foreground/85"
                  )}
                  onClick={() => onPageChange(item)}
                  aria-label={`Page ${item}`}
                >
                  {item}
                </PaginationButton>
              </PaginationItem>
            )
          )}

          <PaginationItem>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={page === pageCount}
              onClick={() => onPageChange(page + 1)}
              aria-label={`Next ${label} page`}
            >
              <ArrowRightCompactIcon />
            </Button>
          </PaginationItem>

          <PaginationItem>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={page === pageCount}
              onClick={() => onPageChange(pageCount)}
              aria-label={`Last ${label} page`}
            >
              <ArrowRightDoubleIcon />
            </Button>
          </PaginationItem>
        </PaginationContent>
      ) : null}
    </PaginationRoot>
  )
}

export function AvailabilityForm({
  settings,
  refresh,
}: {
  settings: DashboardData["availability"]
  refresh: () => Promise<unknown>
}) {
  const update = useServerFn(updateOwnerAvailabilitySettings)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle")
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setStatus("idle")
    const form = new FormData(event.currentTarget)
    try {
      await update({
        data: {
          enabled: form.get("enabled") === "on",
          sectionTitle: String(form.get("sectionTitle")),
          cardTitle: String(form.get("cardTitle")),
          description: String(form.get("description")),
          ctaLabel: String(form.get("ctaLabel")),
          availability: String(form.get("availability")),
          workSetup: String(form.get("workSetup")),
          location: String(form.get("location")),
          timeZone: String(form.get("timeZone")),
          timeZoneDetail: String(form.get("timeZoneDetail")),
          relocationVisa: String(form.get("relocationVisa")),
        },
      })
      await refresh()
      setStatus("saved")
    } catch {
      setStatus("error")
    } finally {
      setSaving(false)
    }
  }
  const fields = [
    ["sectionTitle", "Section heading"],
    ["cardTitle", "Card title"],
    ["ctaLabel", "Button label"],
    ["availability", "Availability"],
    ["workSetup", "Work setup"],
    ["location", "Location"],
    ["timeZone", "Timezone"],
    ["timeZoneDetail", "Timezone detail"],
    ["relocationVisa", "Relocation and visa"],
    ["description", "Description"],
  ] as const
  return (
    <Card asChild className="max-w-4xl bg-card">
      <form onSubmit={submit}>
        <div className="flex items-center gap-4 border-b p-5">
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold">Public availability section</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Control whether the section is visible and edit its public copy.
            </p>
          </div>
          <Label
            htmlFor="availability-enabled"
            className="flex cursor-pointer items-center gap-2 text-sm font-medium"
          >
            <Switch
              id="availability-enabled"
              name="enabled"
              defaultChecked={settings.enabled}
              aria-label="Enable public availability section"
            />
            Enabled
          </Label>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          {fields.map(([name, label]) => (
            <Label
              key={name}
              className={cn(
                "grid gap-2 text-xs font-medium",
                name === "description" && "sm:col-span-2"
              )}
            >
              {label}
              {name === "description" ? (
                <Textarea
                  name={name}
                  defaultValue={settings[name]}
                  maxLength={240}
                  required
                  rows={3}
                  className="bg-card font-normal"
                />
              ) : (
                <Input
                  name={name}
                  defaultValue={settings[name]}
                  maxLength={160}
                  required
                  className="bg-card font-normal"
                />
              )}
            </Label>
          ))}
        </div>
        <div className="flex items-center gap-3 border-t px-5 py-4">
          <Button
            disabled={saving}
            className="h-10 bg-primary px-4 text-primary-foreground hover:bg-primary/80"
          >
            {saving ? <CircleDashedIcon className="animate-spin" /> : null}
            {saving ? "Saving" : "Save changes"}
          </Button>
          {status === "saved" ? (
            <span className="text-xs text-emerald-700 dark:text-emerald-400">
              Changes saved
            </span>
          ) : null}
          {status === "error" ? (
            <span className="text-xs text-destructive" role="alert">
              Changes could not be saved. Check the fields and try again.
            </span>
          ) : null}
        </div>
      </form>
    </Card>
  )
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("")
}
function paginationItems(page: number, pageCount: number) {
  if (pageCount <= 5) {
    return Array.from({ length: pageCount }, (_, index) => index + 1)
  }

  const items: Array<number | "ellipsis"> = [1]
  const start = Math.max(2, page - 1)
  const end = Math.min(pageCount - 1, page + 1)
  if (start > 2) items.push("ellipsis")
  for (let value = start; value <= end; value += 1) items.push(value)
  if (end < pageCount - 1) items.push("ellipsis")
  items.push(pageCount)
  return items
}
