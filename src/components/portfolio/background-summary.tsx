import {
  ArrowRightCompactIcon,
  ArrowUpRightIcon,
  CertificateIcon,
  GraduationCapIcon,
} from "@/components/ui/icons"

import { Card, CardContent } from "@/components/ui/card"
import { EntityAvatar } from "@/components/shared/entity-avatar"
import {
  ExternalLink,
  InternalAction,
} from "@/components/shared/navigation-action"
import { educationCatalog } from "@/lib/content/education"
import { certificationCatalog } from "@/lib/content/certifications"

const summaryEducation = educationCatalog.featured

function yearRange(period: string) {
  const years = period.match(/\d{4}/g)
  return years?.length === 2 ? `${years[0]} - ${years[1]}` : period
}

export function BackgroundSummary() {
  return (
    <Card className="grid overflow-hidden md:grid-cols-12">
      <CardContent className="flex flex-col bg-muted/35 p-5 sm:p-6 md:col-span-7">
        <div className="flex items-center gap-2 text-sm font-semibold text-strong-foreground">
          <GraduationCapIcon className="size-5" aria-hidden="true" />
          <h3>Education</h3>
        </div>

        <div className="mt-6 flex-1">
          <div className="flex items-start gap-3">
            <EntityAvatar
              src={summaryEducation.logoUrl}
              fallback={summaryEducation.logo}
              className="mt-0.5 size-9 shrink-0 border-0"
              imageClassName="object-contain"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-strong-foreground">
                {summaryEducation.degree.replace("Bachelor of Science", "BSc")}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {summaryEducation.institution.replace(" (BAUST)", "")} ·{" "}
                {yearRange(summaryEducation.period)}
              </p>
            </div>
          </div>
          <p className="mt-4 ml-12 max-w-xl text-sm leading-relaxed text-muted-foreground">
            {summaryEducation.details}
          </p>
        </div>

        <InternalAction
          to="/education"
          variant="link"
          className="group mt-6 h-auto w-fit p-0 font-medium text-strong-foreground"
        >
          View all education
          <ArrowRightCompactIcon className="group-hover:translate-x-0.5" />
        </InternalAction>
      </CardContent>

      <CardContent className="flex flex-col border-t p-0 md:col-span-5 md:border-t-0 md:border-l">
        <div className="flex items-center gap-2 px-5 py-5 text-sm font-semibold text-strong-foreground sm:px-6">
          <CertificateIcon className="size-5" aria-hidden="true" />
          <h3>Selected credentials</h3>
        </div>
        <ul className="border-t text-sm">
          {certificationCatalog.featured.map((item) => (
            <li key={item.id} className="border-b last:border-b-0">
              <ExternalLink
                href={item.url}
                className="group flex min-h-20 items-center justify-between gap-5 px-5 py-4 transition-[color,background-color,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:translate-x-0.5 hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none active:translate-x-0 motion-reduce:transition-none sm:px-6"
              >
                <span className="min-w-0">
                  <span className="font-semibold text-strong-foreground">
                    {item.title}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {item.year}
                  </span>
                </span>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-card text-muted-foreground transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:text-foreground motion-reduce:transition-none">
                  <ArrowUpRightIcon className="size-4 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none" />
                </span>
              </ExternalLink>
            </li>
          ))}
        </ul>
        <div className="mt-auto border-t px-5 py-5 sm:px-6">
          <InternalAction
            to="/certifications"
            variant="link"
            className="group h-auto p-0 font-medium text-strong-foreground"
          >
            View all certifications
            <ArrowRightCompactIcon className="group-hover:translate-x-0.5" />
          </InternalAction>
        </div>
      </CardContent>
    </Card>
  )
}
