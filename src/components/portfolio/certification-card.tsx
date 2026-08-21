import {
  ArrowUpRightIcon,
  CertificateIcon,
  DownloadSimpleIcon,
} from "@/components/ui/icons"

import {
  DownloadAction,
  ExternalAction,
  ExternalLink,
} from "@/components/shared/navigation-action"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EntityAvatar } from "@/components/shared/entity-avatar"
import type { Certification } from "@/lib/content/certifications"

const actionClassName =
  "h-auto whitespace-nowrap p-0 font-medium text-foreground"

const completionDateFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
  year: "numeric",
})

export function CertificationCard({
  item,
  featured = false,
}: {
  item: Certification
  featured?: boolean
}) {
  return (
    <Card
      asChild
      className="interactive-surface group grid min-w-0 overflow-hidden sm:grid-cols-[1.15fr_0.85fr]"
    >
      <article>
        {item.image ? (
          <ExternalLink
            href={item.url}
            className="block aspect-[13/10] bg-muted p-3 sm:aspect-auto sm:p-5"
            aria-label={`View ${item.title} credential`}
          >
            <img
              src={item.image}
              width="520"
              height="420"
              alt={`${item.title} certificate preview`}
              className="h-full w-full object-contain transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.015] motion-reduce:transition-none"
            />
          </ExternalLink>
        ) : (
          <div className="grid aspect-[13/10] place-items-center bg-muted p-8 text-center sm:aspect-auto sm:min-h-80">
            <div>
              <span className="mx-auto grid size-14 place-items-center rounded-xl border bg-card">
                <CertificateIcon className="size-8 text-muted-foreground" />
              </span>
              <p className="mt-4 text-sm font-medium">
                Certificate preview not added
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Add the file when it is available.
              </p>
            </div>
          </div>
        )}

        <CardContent className="flex min-w-0 flex-col p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4 text-muted-foreground">
            <span className="inline-flex items-center gap-2 text-sm">
              <EntityAvatar
                src={item.platformIcon}
                fallback={item.platform.slice(0, 1)}
                className="size-8 bg-card"
                imageClassName="p-2"
              />
              {item.platform}
            </span>
            <span className="flex items-center gap-2">
              {featured && (
                <Badge variant="secondary" className="font-medium">
                  Career highlight
                </Badge>
              )}
              <time
                dateTime={item.completedAt ?? item.year}
                className="text-xs tabular-nums"
              >
                {item.completedAt
                  ? completionDateFormatter.format(
                      new Date(`${item.completedAt}T00:00:00Z`)
                    )
                  : item.year}
              </time>
            </span>
          </div>
          <h2 className="mt-5 text-lg leading-snug font-semibold tracking-tight text-foreground">
            {item.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {item.issuer} · {item.description}
          </p>

          {item.url ? (
            <div className="mt-auto flex flex-wrap gap-x-5 gap-y-2 pt-7">
              <ExternalAction
                href={item.url}
                variant="link"
                className={`${actionClassName} group/action`}
              >
                View credential
                <ArrowUpRightIcon className="group-hover/action:translate-x-0.5 group-hover/action:-translate-y-0.5" />
              </ExternalAction>
              {item.download && (
                <DownloadAction
                  href={item.download}
                  variant="link"
                  className={actionClassName}
                >
                  <DownloadSimpleIcon />
                  Download
                </DownloadAction>
              )}
            </div>
          ) : (
            <p className="mt-auto pt-6 text-xs text-muted-foreground">
              Credential link and download will appear when added.
            </p>
          )}
        </CardContent>
      </article>
    </Card>
  )
}
