import { Link } from "@tanstack/react-router"
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  DownloadSimpleIcon,
} from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export function PageIntro({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
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
      <h1 className="mt-4 text-3xl font-bold tracking-tight">{title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </header>
  )
}

export function FooterActions() {
  const actionClassName =
    "group/action h-auto gap-2 rounded-md bg-background px-4 py-2.5 font-medium text-foreground"

  return (
    <div className="mt-12 flex flex-wrap gap-3">
      <Button asChild variant="outline" size="lg" className={actionClassName}>
        <Link to="/">
          <ArrowLeftIcon className="group-hover/action:-translate-x-0.5" />
          Back to overview
        </Link>
      </Button>
      <Button asChild variant="outline" size="lg" className={actionClassName}>
        <a href="/documents/resume.pdf" download>
          <DownloadSimpleIcon />
          Download resume
        </a>
      </Button>
      <Button
        asChild
        variant="outline"
        size="lg"
        className={`${actionClassName} sm:ml-auto`}
      >
        <Link to="/resume">
          View resume
          <ArrowRightIcon className="group-hover/action:translate-x-0.5" />
        </Link>
      </Button>
    </div>
  )
}
