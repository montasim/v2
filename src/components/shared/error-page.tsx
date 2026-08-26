import { Button } from "@/components/ui/button"
import {
  ArrowClockwiseIcon,
  ArrowLeftCompactIcon,
  ArrowRightCompactIcon,
} from "@/components/ui/icons"
import { InternalAction } from "@/components/shared/navigation-action"
import { PageShell } from "@/components/shared/page-shell"

type ErrorPageProps =
  | {
      status: "404"
      onRetry?: never
    }
  | {
      status: "500"
      onRetry: () => void
    }

const errorContent = {
  "404": {
    label: "Page unavailable",
    title: "This route does not exist.",
    description:
      "The address may be outdated, or the page may have moved. Return to the overview or continue with selected projects.",
  },
  "500": {
    label: "Application error",
    title: "Something failed unexpectedly.",
    description:
      "The page could not be rendered. Try again, or return to the overview while the application recovers.",
  },
} as const

const actionClassName = "h-9 gap-2 px-3 font-medium"

export function ErrorPage({ status, onRetry }: ErrorPageProps) {
  const content = errorContent[status]

  return (
    <PageShell className="flex min-h-[calc(100dvh-10rem)] items-center py-12 sm:py-16">
      <section
        className="grid w-full items-center gap-12 sm:grid-cols-[minmax(0,1fr)_12.5rem] sm:gap-14 lg:grid-cols-[minmax(0,1fr)_14rem] lg:gap-20"
        aria-labelledby="error-heading"
      >
        <div className="min-w-0 text-center sm:text-left">
          <p className="flex items-center justify-center gap-2 text-sm font-medium text-strong-foreground sm:justify-start">
            <span>Error {status}</span>
            <span className="text-border" aria-hidden="true">
              /
            </span>
            <span className="font-normal text-muted-foreground">
              {content.label}
            </span>
          </p>
          <h1
            id="error-heading"
            className="mt-3 text-xl font-bold tracking-tight text-strong-foreground sm:text-3xl"
          >
            {content.title}
          </h1>
          <p className="mx-auto mt-5 max-w-[56ch] text-base leading-7 text-muted-foreground sm:mx-0">
            {content.description}
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            {status === "500" ? (
              <Button size="lg" className={actionClassName} onClick={onRetry}>
                <ArrowClockwiseIcon />
                Try again
              </Button>
            ) : (
              <InternalAction
                to="/"
                size="lg"
                className={`${actionClassName} bg-emphasis-foreground text-background hover:bg-emphasis-foreground/80`}
              >
                <ArrowLeftCompactIcon />
                Back to overview
              </InternalAction>
            )}
            {status === "404" ? (
              <InternalAction
                to="/projects"
                variant="outline"
                size="lg"
                className={actionClassName}
              >
                View projects
                <ArrowRightCompactIcon />
              </InternalAction>
            ) : (
              <InternalAction
                to="/"
                variant="outline"
                size="lg"
                className={actionClassName}
              >
                <ArrowLeftCompactIcon />
                Back to overview
              </InternalAction>
            )}
          </div>
        </div>

        <div
          className="relative mx-auto aspect-[10/11] w-[10.45rem] sm:w-[95%]"
          aria-hidden="true"
        >
          <span className="absolute inset-0 translate-x-3 translate-y-3 rounded-xl border-2 border-muted-foreground/80" />
          <div className="relative grid h-full w-full place-items-center rounded-xl border bg-card ring-2 ring-foreground/10">
            <span className="text-5xl font-bold tracking-[-0.08em] text-strong-foreground sm:text-6xl">
              {status}
            </span>
          </div>
        </div>
      </section>
    </PageShell>
  )
}
