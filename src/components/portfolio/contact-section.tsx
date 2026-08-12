import { ArrowUpRightIcon, EnvelopeSimpleIcon } from "@phosphor-icons/react"

import { PageSection } from "@/components/shared/page-section"
import { Button } from "@/components/ui/button"
import { profile } from "@/lib/content"

export function ContactSection() {
  return (
    <PageSection id="contact" headingId="contact-heading" title="Get in touch">
      <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-10">
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
          If you have a role or product challenge that could be a fit, send me
          an email.
        </p>
        <Button
          asChild
          variant="link"
          className="group h-auto w-fit max-w-full gap-3 p-0 font-semibold text-foreground hover:no-underline"
        >
          <a
            href={`mailto:${profile.email}`}
            aria-label={`Email Montasim at ${profile.email}`}
          >
            <span
              className="grid size-9 shrink-0 place-items-center rounded-md border bg-card text-base transition-colors group-hover:bg-muted"
              aria-hidden="true"
            >
              <EnvelopeSimpleIcon />
            </span>
            <span className="border-b pb-0.5 break-all transition-colors group-hover:border-foreground">
              {profile.email}
            </span>
            <ArrowUpRightIcon className="shrink-0 text-base text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </Button>
      </div>
    </PageSection>
  )
}
