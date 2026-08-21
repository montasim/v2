import {
  AirplaneTiltIcon,
  BriefcaseIcon,
  CalendarCheckIcon,
  ClockIcon,
  EnvelopeSimpleIcon,
  HouseLineIcon,
} from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { requestPortfolioInquiry } from "@/features/chat/ui/assistant-request"
import { profileCatalog } from "@/lib/content/profile"

const undisclosed = "Ask me"

export function AvailabilityCard() {
  const { location, workPreferences } = profileCatalog.profile
  const rows = [
    {
      label: "Availability",
      value: workPreferences.availability ?? undisclosed,
      icon: CalendarCheckIcon,
    },
    {
      label: "Role",
      value: workPreferences.preferredRoles.length
        ? workPreferences.preferredRoles.join(", ")
        : undisclosed,
      icon: BriefcaseIcon,
    },
    {
      label: "Work setup",
      value: workPreferences.workArrangement ?? undisclosed,
      icon: HouseLineIcon,
    },
    {
      label: "Location and timezone",
      value: `${location} (${workPreferences.timeZone})`,
      detail: workPreferences.timeZoneOverlap
        ? `${workPreferences.timeZoneOverlap} overlap`
        : "Share team hours to confirm overlap",
      icon: ClockIcon,
    },
    {
      label: "Relocation and visa",
      value:
        [workPreferences.relocation, workPreferences.visaStatus]
          .filter(Boolean)
          .join("; ") || undisclosed,
      icon: AirplaneTiltIcon,
    },
    {
      label: "Start date",
      value: workPreferences.earliestStartDate ?? undisclosed,
      icon: CalendarCheckIcon,
    },
  ]

  return (
    <Card className="overflow-hidden">
      <div className="grid md:grid-cols-12">
        <div className="flex flex-col bg-muted/35 p-5 sm:p-6 md:col-span-4">
          <h3 className="text-lg font-semibold tracking-tight text-emphasis-foreground">
            Working preferences
          </h3>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Current preferences for new opportunities.
          </p>
          <Button
            className="mt-6 w-fit bg-emphasis-foreground px-[0.65625rem] text-background hover:bg-emphasis-foreground/80 active:scale-[0.98] md:mt-auto"
            onClick={() => requestPortfolioInquiry({ inquiryType: "hire" })}
          >
            <EnvelopeSimpleIcon aria-hidden="true" />
            Discuss a role
          </Button>
        </div>

        <dl className="grid sm:grid-cols-2 md:col-span-8 md:border-l">
          {rows.map(({ detail, icon: Icon, label, value }) => (
            <div
              key={label}
              className="border-t p-5 first:border-t-0 sm:p-6 md:first:border-t-0 sm:[&:nth-child(2)]:border-t-0 md:[&:nth-child(2)]:border-t-0 sm:[&:nth-child(even)]:border-l"
            >
              <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </dt>
              <dd className="mt-2 text-sm font-semibold text-emphasis-foreground">
                {value}
              </dd>
              {detail ? (
                <dd className="mt-1 text-xs leading-5 text-muted-foreground">
                  {detail}
                </dd>
              ) : null}
            </div>
          ))}
        </dl>
      </div>
    </Card>
  )
}
