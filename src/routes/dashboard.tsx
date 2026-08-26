import { lazy, Suspense, useEffect, useRef, useState } from "react"
import { createAuthClient } from "@neondatabase/auth"
import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useRouterState,
} from "@tanstack/react-router"
import { useServerFn } from "@tanstack/react-start"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  ArrowLeftCompactIcon,
  ArrowLeftDoubleIcon,
  ArrowRightCompactIcon,
  ArrowRightDoubleIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  BookOpenTextIcon,
  BriefcaseIcon,
  CalendarCheckIcon,
  ChatCenteredDotsIcon,
  ChatCircleDotsIcon,
  CircleDashedIcon,
  DatabaseIcon,
  EnvelopeSimpleIcon,
  MoonIcon,
  SquaresFourIcon,
  SunIcon,
  TrashIcon,
  UsersThreeIcon,
} from "@/components/ui/icons"
import { useTheme } from "@/components/theme-provider"
import { updateOwnerAvailabilitySettings } from "@/features/availability/application/settings"
import { deleteBlogComment } from "@/features/blog-comments/application/comments"
import { getPortfolioOwnerAuth } from "@/features/owner-auth/application/owner-auth"
import {
  formatConversationProviderRoute,
  formatConversationResponseMetadata,
} from "@/features/owner-dashboard/domain/conversation-metadata"
import type { OwnerDashboardData } from "@/features/owner-dashboard/infrastructure/dashboard.server"
import { blogCatalog } from "@/lib/content/blog"
import { cn } from "@/lib/utils"

const LazyChatMarkdown = lazy(async () => {
  const module = await import("@/features/chat/ui/chat-markdown")
  return { default: module.ChatMarkdown }
})

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

const navigation = [
  { to: "/dashboard", label: "Overview", icon: SquaresFourIcon },
  { to: "/dashboard/inquiries", label: "Inquiries", icon: BriefcaseIcon },
  {
    to: "/dashboard/conversations",
    label: "Chat history",
    icon: ChatCenteredDotsIcon,
  },
  {
    to: "/dashboard/static-answers",
    label: "Static answers",
    icon: BookOpenTextIcon,
  },
  {
    to: "/dashboard/comments",
    label: "Blog comments",
    icon: ChatCircleDotsIcon,
  },
  {
    to: "/dashboard/subscribers",
    label: "Subscribers",
    icon: UsersThreeIcon,
  },
  {
    to: "/dashboard/availability",
    label: "Availability",
    icon: CalendarCheckIcon,
  },
] as const

function OwnerDashboardPage() {
  const auth = Route.useLoaderData()
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const { theme, toggleTheme } = useTheme()
  const [signingOut, setSigningOut] = useState(false)
  const navigationRef = useRef<HTMLDivElement>(null)
  const activeNavigation =
    navigation.find(({ to }) => pathname === to)?.label ?? "Dashboard"

  useEffect(() => {
    function revealActiveNavigation() {
      const activeLink = navigationRef.current?.querySelector<HTMLElement>(
        '[data-active-navigation="true"]'
      )
      if (activeLink && typeof activeLink.scrollIntoView === "function") {
        activeLink.scrollIntoView({ block: "nearest", inline: "center" })
      }
    }

    const frame = window.requestAnimationFrame(revealActiveNavigation)
    return () => window.cancelAnimationFrame(frame)
  }, [pathname])

  async function signOut() {
    setSigningOut(true)
    const client = createAuthClient(
      new URL("/api/auth", window.location.origin).toString()
    )
    await client.signOut().catch(() => undefined)
    window.location.assign("/root")
  }

  return (
    <div className="min-h-dvh bg-muted/25 lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)]">
      <aside className="border-b bg-background lg:sticky lg:top-0 lg:h-dvh lg:border-r lg:border-b-0">
        <div className="flex h-16 items-center border-b px-4 lg:px-5">
          <Link
            to="/"
            className="flex items-center gap-2 font-semibold tracking-tight text-strong-foreground"
          >
            <span className="relative">
              <img
                src="/images/logo.webp"
                alt=""
                className="size-7 rounded-sm"
              />
              <span className="absolute right-0 bottom-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
            </span>
            Montasim
          </Link>
          <div className="ml-auto flex items-center lg:hidden">
            <Button
              variant="ghost"
              size="icon-lg"
              onClick={toggleTheme}
              aria-label={`Use ${theme === "dark" ? "light" : "dark"} theme`}
            >
              {theme === "dark" ? (
                <SunIcon className="size-4" />
              ) : (
                <MoonIcon className="size-4" />
              )}
            </Button>
            <Button
              variant="outline"
              className="ml-1 h-9 font-medium text-strong-foreground"
              onClick={signOut}
              disabled={signingOut}
              aria-label="Sign out"
            >
              <span>Sign out</span>
              {signingOut ? (
                <CircleDashedIcon className="size-3.5 animate-spin" />
              ) : null}
            </Button>
          </div>
        </div>
        <div
          ref={navigationRef}
          className="flex items-center gap-2 overflow-x-auto p-3 lg:block lg:space-y-1 lg:p-4"
        >
          {navigation.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              data-active-navigation={pathname === to ? "true" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:w-full",
                pathname === to &&
                  "bg-emphasis-foreground text-background hover:bg-emphasis-foreground/85 hover:text-background"
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </div>
        <div className="hidden border-t p-4 lg:absolute lg:inset-x-0 lg:bottom-0 lg:block">
          <p className="truncate text-xs font-medium">{auth.user.name}</p>
          <p className="mt-0.5 truncate text-[0.6875rem] text-muted-foreground">
            {auth.user.email}
          </p>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 hidden h-16 items-center border-b bg-background/95 px-10 backdrop-blur-sm lg:flex">
          <div className="mx-auto flex w-full max-w-6xl items-center gap-4">
            <div
              className="flex min-w-0 items-center gap-2 text-xs text-strong-foreground"
              aria-label="Dashboard location"
            >
              <DatabaseIcon className="size-3.5 shrink-0" />
              <span className="hidden sm:inline">Portfolio control room</span>
              <span className="hidden text-border sm:inline" aria-hidden="true">
                /
              </span>
              <span className="truncate font-medium">{activeNavigation}</span>
            </div>

            <div className="ml-auto flex items-center">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={toggleTheme}
                aria-label={`Use ${theme === "dark" ? "light" : "dark"} theme`}
              >
                {theme === "dark" ? (
                  <SunIcon className="size-3.5" />
                ) : (
                  <MoonIcon className="size-3.5" />
                )}
              </Button>
              <span
                className="mr-[0.9375rem] ml-2 h-4 border-l border-border"
                aria-hidden="true"
              />
              <Button
                variant="outline"
                className="font-medium text-strong-foreground"
                onClick={signOut}
                disabled={signingOut}
                aria-label="Sign out"
              >
                <span>Sign out</span>
                {signingOut ? (
                  <CircleDashedIcon className="size-3.5 animate-spin" />
                ) : null}
              </Button>
            </div>
          </div>
        </header>

        <main className="min-w-0 px-4 py-7 sm:px-6 lg:px-10 lg:py-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export function DashboardHeader({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <header className="mb-7 border-b pb-5">
      <h1 className="text-xl font-semibold tracking-tight text-strong-foreground sm:text-2xl">
        {title}
      </h1>
      {description ? (
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      ) : null}
    </header>
  )
}

type DashboardData = OwnerDashboardData

export function Overview({ data }: { data: DashboardData }) {
  const stats = [
    {
      label: "Role & project inquiries",
      value: data.inquiries.length,
      detail: "Review opportunities",
      to: "/dashboard/inquiries" as const,
      icon: BriefcaseIcon,
    },
    {
      label: "Saved AI exchanges",
      value: data.conversations.length,
      detail: "Review visitor questions",
      to: "/dashboard/conversations" as const,
      icon: ChatCenteredDotsIcon,
    },
    {
      label: "Blog comments",
      value: data.comments.length,
      detail: "Moderate discussion",
      to: "/dashboard/comments" as const,
      icon: ChatCircleDotsIcon,
    },
    {
      label: "Availability",
      value: data.availability.enabled ? "Live" : "Hidden",
      detail: "Manage public status",
      to: "/dashboard/availability" as const,
      icon: CalendarCheckIcon,
    },
  ]

  return (
    <div className="space-y-7">
      <section aria-labelledby="activity-heading">
        <div className="mb-3">
          <h2
            id="activity-heading"
            className="text-sm font-semibold text-strong-foreground"
          >
            Portfolio activity
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            A direct path to each area that may need your attention.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(({ label, value, detail, to, icon: Icon }) => (
            <Link
              key={label}
              to={to}
              className="group flex min-h-40 flex-col rounded-xl border bg-background p-5 transition-colors hover:border-emphasis-foreground/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-9 place-items-center rounded-lg border bg-muted/35 text-strong-foreground">
                  <Icon className="size-4" />
                </span>
                <ArrowUpRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none" />
              </div>
              <p className="mt-5 text-xl font-semibold tracking-tight text-strong-foreground sm:text-2xl">
                {value}
              </p>
              <p className="mt-1 text-xs font-medium text-strong-foreground">
                {label}
              </p>
              <p className="mt-auto pt-3 text-[0.6875rem] text-muted-foreground">
                {detail}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(17rem,1fr)]">
        <section className="overflow-hidden rounded-xl border bg-background">
          <div className="flex items-center gap-4 border-b px-5 py-4">
            <div>
              <h2 className="font-semibold text-strong-foreground">
                Recent inquiries
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Latest messages, role inquiries, and project requests.
              </p>
            </div>
            <Button variant="ghost" size="sm" className="ml-auto" asChild>
              <Link to="/dashboard/inquiries">
                View all
                <ArrowRightIcon />
              </Link>
            </Button>
          </div>

          <div className="divide-y">
            {data.inquiries.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-5 py-4"
              >
                <Avatar className="size-9 ring-1 ring-border">
                  <AvatarFallback>{initials(item.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-strong-foreground">
                    {item.name}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {item.type === "hire"
                      ? item.role
                      : item.type === "project"
                        ? item.projectType
                        : item.context}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="secondary" className="capitalize">
                    {inquiryTypeLabel(item.type)}
                  </Badge>
                  <time className="mt-1.5 block text-[0.6875rem] text-muted-foreground">
                    {formatDate(item.createdAt)}
                  </time>
                </div>
              </div>
            ))}
            {!data.inquiries.length ? (
              <Empty label="No inquiries yet. New requests will appear here." />
            ) : null}
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border bg-background">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold text-strong-foreground">
              Public availability
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              What visitors currently see.
            </p>
          </div>
          <div className="p-5">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "size-2.5 rounded-full",
                  data.availability.enabled
                    ? "bg-emerald-500"
                    : "bg-muted-foreground/45"
                )}
                aria-hidden="true"
              />
              <p className="text-lg font-semibold text-strong-foreground">
                {data.availability.enabled ? "Visible to visitors" : "Hidden"}
              </p>
            </div>
            <dl className="mt-5 divide-y overflow-hidden rounded-lg border">
              <Detail
                label="Availability"
                value={data.availability.availability}
              />
              <Detail label="Work setup" value={data.availability.workSetup} />
              <Detail label="Location" value={data.availability.location} />
            </dl>
            <Button variant="outline" className="mt-4 w-full" asChild>
              <Link to="/dashboard/availability">
                Edit availability
                <ArrowRightIcon />
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}

export function Inquiries({ data }: { data: DashboardData["inquiries"] }) {
  return (
    <div className="grid gap-4">
      {data.map((item) => (
        <article
          key={item.id}
          className="overflow-hidden rounded-xl border bg-background"
          aria-labelledby={`inquiry-${item.id}`}
        >
          <header className="flex items-center gap-3 border-b bg-muted/20 px-5 py-4 sm:px-6">
            <Avatar className="size-10 ring-1 ring-border">
              <AvatarFallback>{initials(item.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h2
                id={`inquiry-${item.id}`}
                className="truncate text-sm font-semibold text-strong-foreground"
              >
                {item.name}
              </h2>
              <a
                href={`mailto:${item.email}`}
                className="mt-0.5 block w-fit truncate text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                {item.email}
              </a>
            </div>
            <Badge variant="secondary" className="shrink-0 capitalize">
              {inquiryTypeLabel(item.type)}
            </Badge>
          </header>

          <div className="p-5 sm:p-6">
            {item.type !== "general" ? (
              <dl className="grid divide-y overflow-hidden rounded-lg border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                <Detail
                  label={item.type === "hire" ? "Role" : "Project type"}
                  value={item.role ?? item.projectType ?? "—"}
                />
                <Detail
                  label={item.type === "hire" ? "Arrangement" : "Timeline"}
                  value={item.arrangement ?? item.timeline ?? "—"}
                />
              </dl>
            ) : null}

            {item.context ? (
              <section className="mt-4 rounded-lg bg-muted/45 p-4">
                <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <ChatCenteredDotsIcon className="size-3.5" />
                  Message
                </p>
                <p className="mt-2 text-sm leading-6 text-strong-foreground">
                  {item.context}
                </p>
              </section>
            ) : null}

            <footer className="mt-5 flex flex-wrap items-center gap-3 border-t pt-4">
              <time
                dateTime={item.createdAt}
                className="text-xs text-muted-foreground"
              >
                Received {formatDate(item.createdAt)}
              </time>
              <Button variant="outline" size="sm" className="ml-auto" asChild>
                <a href={`mailto:${item.email}`}>
                  <EnvelopeSimpleIcon />
                  Reply
                </a>
              </Button>
            </footer>
          </div>
        </article>
      ))}
      {!data.length ? <Empty label="No inquiries yet." /> : null}
    </div>
  )
}

function inquiryTypeLabel(type: string) {
  if (type === "hire") return "Role"
  if (type === "project") return "Project"
  return "General"
}

export function Conversations({
  data,
}: {
  data: DashboardData["conversations"]
}) {
  return (
    <div className="grid gap-4">
      {data.map((item) => (
        <article
          key={item.id}
          className="overflow-hidden rounded-xl border bg-background"
        >
          <div className="border-b bg-muted/35 px-5 py-4">
            <p className="text-xs text-muted-foreground">
              Visitor question · {formatDate(item.createdAt)}
            </p>
            <h2 className="mt-2 text-sm leading-6 font-semibold">
              {item.question}
            </h2>
          </div>
          <div className="px-5 py-4">
            <div className="text-sm leading-6 text-muted-foreground">
              <Suspense
                fallback={<p className="whitespace-pre-wrap">{item.answer}</p>}
              >
                <LazyChatMarkdown source={item.answer} />
              </Suspense>
            </div>
            <ConversationResponseProvenance item={item} />
          </div>
        </article>
      ))}
      {!data.length ? <Empty label="No generated chat exchanges yet." /> : null}
    </div>
  )
}

function ConversationResponseProvenance({
  item,
}: {
  item: DashboardData["conversations"][number]
}) {
  const providerRoute = formatConversationProviderRoute(item.providerAttempts)

  return (
    <div className="mt-4 border-t pt-3 text-[0.6875rem] text-muted-foreground">
      <p>{formatConversationResponseMetadata(item)}</p>
      {providerRoute ? (
        <p className="mt-1 break-words">{providerRoute}</p>
      ) : null}
    </div>
  )
}

export function Comments({
  data,
  refresh,
}: {
  data: DashboardData["comments"]
  refresh: () => Promise<unknown>
}) {
  const remove = useServerFn(deleteBlogComment)
  const [pending, setPending] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [error, setError] = useState("")
  async function deleteComment(id: string, postSlug: string) {
    setPending(id)
    setError("")
    try {
      await remove({ data: { id, postSlug } })
      await refresh()
    } catch {
      setError("The comment could not be deleted. Try again.")
    } finally {
      setPending(null)
      setConfirming(null)
    }
  }
  return (
    <div className="grid gap-4">
      {data.map((item) => {
        const postTitle =
          blogCatalog.find(item.postSlug)?.title ?? item.postSlug

        return (
          <article
            key={item.id}
            className="overflow-hidden rounded-xl border bg-background"
            aria-labelledby={`comment-${item.id}`}
          >
            <header className="flex items-center gap-3 border-b bg-muted/20 px-5 py-4 sm:px-6">
              <Avatar className="size-10 ring-1 ring-border">
                <AvatarFallback>{initials(item.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h2
                  id={`comment-${item.id}`}
                  className="truncate text-sm font-semibold text-strong-foreground"
                >
                  {item.name}
                </h2>
                <a
                  href={`mailto:${item.email}`}
                  className="mt-0.5 block w-fit truncate text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  {item.email}
                </a>
              </div>

              {confirming === item.id ? (
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending === item.id}
                    onClick={() => setConfirming(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={pending === item.id}
                    onClick={() => deleteComment(item.id, item.postSlug)}
                  >
                    {pending === item.id ? (
                      <CircleDashedIcon className="animate-spin" />
                    ) : (
                      <TrashIcon />
                    )}
                    Delete
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => setConfirming(item.id)}
                  aria-label={`Delete comment by ${item.name}`}
                >
                  <TrashIcon />
                </Button>
              )}
            </header>

            <div className="p-5 sm:p-6">
              <section className="rounded-lg bg-muted/45 p-4">
                <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <ChatCircleDotsIcon className="size-3.5" />
                  Comment
                </p>
                <p className="mt-2 text-sm leading-6 whitespace-pre-wrap text-strong-foreground">
                  {item.message}
                </p>
              </section>

              <footer className="mt-5 grid gap-3 border-t pt-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Article</p>
                  <Link
                    to="/blog/$slug"
                    params={{ slug: item.postSlug }}
                    className="mt-1 flex w-fit max-w-full items-center gap-2 text-sm font-medium text-strong-foreground underline-offset-4 hover:underline"
                  >
                    <BookOpenTextIcon className="size-4 shrink-0" />
                    <span className="truncate">{postTitle}</span>
                  </Link>
                </div>
                <time
                  dateTime={item.createdAt}
                  className="text-xs text-muted-foreground"
                >
                  {formatDate(item.createdAt)}
                </time>
              </footer>
            </div>
          </article>
        )
      })}
      {!data.length ? <Empty label="No blog comments yet." /> : null}
      {error ? (
        <p
          className="rounded-lg border border-destructive/25 bg-destructive/5 px-4 py-3 text-xs text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  )
}

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
    <nav
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
        <div className="flex items-center gap-1 sm:ml-auto">
          <Button
            variant="outline"
            size="icon-sm"
            disabled={page === 1}
            onClick={() => onPageChange(1)}
            aria-label={`First ${label} page`}
          >
            <ArrowLeftDoubleIcon />
          </Button>

          <Button
            variant="outline"
            size="icon-sm"
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
            aria-label={`Previous ${label} page`}
          >
            <ArrowLeftCompactIcon />
          </Button>

          <div className="flex items-center gap-1" aria-label="Page selection">
            {pages.map((item, index) =>
              item === "ellipsis" ? (
                <span
                  key={`ellipsis-${index}`}
                  className="flex size-7 items-center justify-center text-xs text-muted-foreground"
                  aria-hidden="true"
                >
                  …
                </span>
              ) : (
                <Button
                  key={item}
                  variant={item === page ? "default" : "ghost"}
                  size="icon-sm"
                  className={cn(
                    "text-xs",
                    item === page &&
                      "bg-emphasis-foreground text-background hover:bg-emphasis-foreground/85"
                  )}
                  onClick={() => onPageChange(item)}
                  aria-label={`Page ${item}`}
                  aria-current={item === page ? "page" : undefined}
                >
                  {item}
                </Button>
              )
            )}
          </div>

          <Button
            variant="outline"
            size="icon-sm"
            disabled={page === pageCount}
            onClick={() => onPageChange(page + 1)}
            aria-label={`Next ${label} page`}
          >
            <ArrowRightCompactIcon />
          </Button>

          <Button
            variant="outline"
            size="icon-sm"
            disabled={page === pageCount}
            onClick={() => onPageChange(pageCount)}
            aria-label={`Last ${label} page`}
          >
            <ArrowRightDoubleIcon />
          </Button>
        </div>
      ) : null}
    </nav>
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
    ["description", "Description"],
    ["ctaLabel", "Button label"],
    ["availability", "Availability"],
    ["workSetup", "Work setup"],
    ["location", "Location"],
    ["timeZone", "Timezone"],
    ["timeZoneDetail", "Timezone detail"],
    ["relocationVisa", "Relocation and visa"],
  ] as const
  return (
    <form onSubmit={submit} className="rounded-xl border bg-background">
      <div className="flex items-center gap-4 border-b p-5">
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">Public availability section</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Control whether the section is visible and edit its public copy.
          </p>
        </div>
        <label
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
        </label>
      </div>
      <div className="grid gap-5 p-5 sm:grid-cols-2">
        {fields.map(([name, label]) => (
          <label
            key={name}
            className={cn(
              "grid gap-2 text-xs font-medium",
              name === "description" && "sm:col-span-2"
            )}
          >
            {label}
            <input
              name={name}
              defaultValue={settings[name]}
              maxLength={name === "description" ? 240 : 160}
              required
              className="h-10 rounded-lg border bg-background px-3 text-sm font-normal outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
        ))}
      </div>
      <div className="flex items-center gap-3 border-t px-5 py-4">
        <Button
          disabled={saving}
          className="bg-emphasis-foreground text-background hover:bg-emphasis-foreground/80"
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
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background p-4">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1.5 text-sm font-semibold text-strong-foreground">
        {value}
      </dd>
    </div>
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
function Empty({ label }: { label: string }) {
  return (
    <p className="p-6 text-center text-sm text-muted-foreground">{label}</p>
  )
}
function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}
