import {
  BookOpenTextIcon,
  BriefcaseIcon,
  CalendarCheckIcon,
  ChatCenteredDotsIcon,
  ChatCircleDotsIcon,
  SquaresFourIcon,
  UsersThreeIcon,
} from "@/components/ui/icons"

export const dashboardNavigation = [
  {
    to: "/dashboard",
    label: "Overview",
    description: "Your portfolio activity, ready to review.",
    icon: SquaresFourIcon,
    refresh: true,
  },
  {
    to: "/dashboard/work-journal",
    label: "Work Journal",
    description: "A private record of your work and the difference it made.",
    icon: BookOpenTextIcon,
    refresh: false,
  },
  {
    to: "/dashboard/inquiries",
    label: "Inquiries",
    description: "Review opportunities and start the right conversations.",
    icon: BriefcaseIcon,
    refresh: true,
  },
  {
    to: "/dashboard/conversations",
    label: "Chat history",
    description: "Inspect visitor questions and the answers they received.",
    icon: ChatCenteredDotsIcon,
    refresh: true,
  },
  {
    to: "/dashboard/static-answers",
    label: "Static answers",
    description: "Inspect the read-only answer catalog.",
    icon: BookOpenTextIcon,
    refresh: false,
  },
  {
    to: "/dashboard/comments",
    label: "Blog comments",
    description: "Read feedback and moderate your article discussions.",
    icon: ChatCircleDotsIcon,
    refresh: true,
  },
  {
    to: "/dashboard/subscribers",
    label: "Subscribers",
    description: "People who asked to hear about your next article.",
    icon: UsersThreeIcon,
    refresh: true,
  },
  {
    to: "/dashboard/availability",
    label: "Availability",
    description: "Manage your public availability and contact invitation.",
    icon: CalendarCheckIcon,
    refresh: false,
  },
] as const

export function dashboardPageFor(pathname: string) {
  const path = pathname.replace(/\/$/, "")
  return (
    dashboardNavigation.find((page) => page.to === path) ??
    dashboardNavigation[0]
  )
}
