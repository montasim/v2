import type { ReactNode } from "react"
import { Link, useRouterState } from "@tanstack/react-router"
import {
  ArrowLeftCompactIcon,
  DownloadSimpleIcon,
  EnvelopeSimpleIcon,
} from "@/components/ui/icons"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  DownloadAction,
  InternalAction,
} from "@/components/shared/navigation-action"
import { PageShell } from "@/components/shared/page-shell"
import { contactHref } from "@/features/contact/domain/contact"
import { profileCatalog } from "@/lib/content/profile"

export function DetailPage({
  title,
  description,
  introAction,
  headerAction,
  children,
}: {
  title: string
  description: string
  introAction?: ReactNode
  headerAction?: ReactNode
  children: ReactNode
}) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const actionClassName =
    "group/action h-auto gap-2 rounded-md bg-background px-4 py-2.5 font-medium text-strong-foreground"

  return (
    <PageShell padded>
      <header>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Overview</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div
          className={
            headerAction
              ? "mt-8 grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-14"
              : "max-w-2xl"
          }
        >
          <div>
            <h1
              className={
                headerAction
                  ? "text-2xl font-bold tracking-tight text-strong-foreground sm:text-4xl"
                  : "mt-4 text-xl font-bold tracking-tight text-strong-foreground sm:text-3xl"
              }
            >
              {title}
            </h1>
            <p
              className={
                headerAction
                  ? "mt-5 max-w-[65ch] text-base leading-7 text-muted-foreground sm:text-lg"
                  : "mt-3 text-sm leading-relaxed text-muted-foreground"
              }
            >
              {description}
            </p>
            {introAction}
          </div>
          {headerAction ? (
            <div className="flex items-center lg:justify-end">
              {headerAction}
            </div>
          ) : null}
        </div>
      </header>
      {children}
      <footer className="mt-12 flex flex-wrap gap-3">
        <InternalAction
          to="/"
          variant="outline"
          size="lg"
          className={actionClassName}
        >
          <ArrowLeftCompactIcon className="group-hover/action:-translate-x-0.5" />
          Back to overview
        </InternalAction>
        <DownloadAction
          href={profileCatalog.profile.resumeDownloadUrl}
          variant="outline"
          size="lg"
          className={`${actionClassName} sm:ml-auto`}
        >
          <DownloadSimpleIcon />
          Download resume
        </DownloadAction>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className={actionClassName}
          asChild
        >
          <a href={contactHref({ topic: "question", from: pathname })}>
            <EnvelopeSimpleIcon />
            Contact me
          </a>
        </Button>
      </footer>
    </PageShell>
  )
}
