import { Link } from "@tanstack/react-router"
import { ArrowRightIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"

export function SectionHeading({
  id,
  title,
  to,
  label,
}: {
  id?: string
  title: string
  to?: string
  label?: string
}) {
  return (
    <div className="mb-6 border-b pb-4 sm:flex sm:items-center sm:justify-between sm:gap-6">
      <h2
        id={id}
        className="text-2xl font-semibold tracking-tight text-emphasis-foreground"
      >
        {title}
      </h2>
      {to && label ? (
        <Button
          asChild
          variant="link"
          className="group/action mt-4 h-auto p-0 font-medium text-emphasis-foreground sm:mt-0 sm:shrink-0"
        >
          <Link to={to}>
            {label}
            <ArrowRightIcon className="group-hover/action:translate-x-0.5" />
          </Link>
        </Button>
      ) : null}
    </div>
  )
}
