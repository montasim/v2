import {
  AirplaneTiltIcon,
  CalendarCheckIcon,
  ClockIcon,
  EnvelopeSimpleIcon,
  HouseLineIcon,
} from "@/components/ui/icons"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { requestPortfolioInquiry } from "@/features/chat/ui/assistant-request"
import { defaultAvailabilitySettings } from "@/features/availability/domain/settings"
import type { AvailabilitySettings } from "@/features/availability/domain/settings"

export function AvailabilityCard({
  settings = defaultAvailabilitySettings,
}: {
  settings?: AvailabilitySettings
}) {
  const rows = [
    {
      label: "Availability",
      value: settings.availability,
      icon: CalendarCheckIcon,
    },
    {
      label: "Work",
      value: settings.workSetup,
      icon: HouseLineIcon,
    },
    {
      label: "Location",
      value: `${settings.location} (${settings.timeZone})`,
      icon: ClockIcon,
    },
    {
      label: "Relocation",
      value: settings.relocationVisa,
      icon: AirplaneTiltIcon,
    },
  ]

  return (
    <Card className="overflow-hidden">
      <div className="grid md:grid-cols-12">
        <div className="flex flex-col bg-muted/35 p-5 sm:p-6 md:col-span-4">
          <h3 className="text-lg font-semibold tracking-tight text-strong-foreground">
            {settings.cardTitle}
          </h3>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {settings.description}
          </p>
          <Button
            className="mt-6 w-fit bg-emphasis-foreground px-[0.65625rem] text-background hover:bg-emphasis-foreground/80 active:scale-[0.98] md:mt-auto"
            type="button"
            aria-haspopup="dialog"
            onClick={() => requestPortfolioInquiry({ inquiryType: "hire" })}
          >
            <EnvelopeSimpleIcon aria-hidden="true" />
            {settings.ctaLabel}
          </Button>
        </div>

        <dl className="grid sm:grid-cols-2 md:col-span-8 md:border-l">
          {rows.map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t p-5 first:border-t-0 sm:p-6 md:first:border-t-0 sm:[&:nth-child(2)]:border-t-0 md:[&:nth-child(2)]:border-t-0 sm:[&:nth-child(even)]:border-l"
            >
              <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </dt>
              <dd className="ml-auto text-right text-sm font-semibold text-strong-foreground">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </Card>
  )
}
