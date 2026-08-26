import type { ReactNode } from "react"
import { Link } from "@tanstack/react-router"
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
import { requestPortfolioInquiry } from "@/features/chat/ui/assistant-request"
import { profileCatalog } from "@/lib/content/profile"

export function DetailPage({
  title,
  description,
  introAction,
  children,
}: {
  title: string
  description: string
  introAction?: ReactNode
  children: ReactNode
}) {
  const actionClassName =
    "group/action h-auto gap-2 rounded-md bg-background px-4 py-2.5 font-medium text-emphasis-foreground"

  return (
    <PageShell padded>
      <header className="max-w-2xl">
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
        <h1 className="mt-4 text-xl font-bold tracking-tight text-emphasis-foreground sm:text-3xl">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
        {introAction}
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
          onClick={() => requestPortfolioInquiry({ inquiryType: "general" })}
        >
          <EnvelopeSimpleIcon />
          Contact me
        </Button>
      </footer>
    </PageShell>
  )
}
