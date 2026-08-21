import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  CalendarBlankIcon,
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
        <div className="flex items-center gap-2 text-sm font-semibold text-emphasis-foreground">
          <GraduationCapIcon className="size-5" aria-hidden="true" />
          <h3>Education</h3>
        </div>

        <div className="mt-6 flex flex-1 flex-col sm:flex-row sm:items-start sm:gap-6">
          <EntityAvatar
            src={summaryEducation.logoUrl}
            fallback={summaryEducation.logo}
            className="size-16 shrink-0 rounded-lg bg-card sm:size-20"
            imageClassName="p-1.5"
          />
          <div className="mt-5 min-w-0 sm:mt-0">
            <p className="max-w-lg text-xl leading-snug font-semibold tracking-tight text-emphasis-foreground sm:text-2xl">
              {summaryEducation.degree.replace("Bachelor of Science", "BSc")}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {summaryEducation.institution.replace(" (BAUST)", "")}
            </p>
            <p className="mt-4 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CalendarBlankIcon className="size-4" aria-hidden="true" />
              {yearRange(summaryEducation.period)}
            </p>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {summaryEducation.details}
            </p>
          </div>
        </div>

        <InternalAction
          to="/education"
          variant="link"
          className="group mt-6 h-auto w-fit p-0 font-medium text-foreground"
        >
          View all education
          <ArrowRightIcon className="group-hover:translate-x-1" />
        </InternalAction>
      </CardContent>

      <CardContent className="flex flex-col border-t p-0 md:col-span-5 md:border-t-0 md:border-l">
        <div className="flex items-center gap-2 px-5 py-5 text-sm font-semibold text-emphasis-foreground sm:px-6">
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
                  <span className="font-semibold text-emphasis-foreground">
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
            className="group h-auto p-0 font-medium text-foreground"
          >
            View all certifications
            <ArrowRightIcon className="group-hover:translate-x-1" />
          </InternalAction>
        </div>
      </CardContent>
    </Card>
  )
}
