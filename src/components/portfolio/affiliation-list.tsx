import { EntityAvatar } from "@/components/shared/entity-avatar"
import type { Organization, Volunteering } from "@/lib/content/affiliations"

type Affiliation = Organization | Volunteering

function isVolunteering(item: Affiliation): item is Volunteering {
  return "organization" in item
}

function AffiliationItem({ item }: { item: Affiliation }) {
  const volunteeringItem = isVolunteering(item)
  const title = volunteeringItem ? item.role : item.name

  return (
    <article className="flex items-start gap-6">
      <EntityAvatar
        src={item.logoUrl}
        fallback={item.logo}
        className="size-11 border-0"
      />
      <div className="min-w-0">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {volunteeringItem
            ? `${item.organization} · ${item.period} · ${item.location}`
            : `${item.role}${item.period ? ` · ${item.period}` : ""}`}
        </p>
        {!volunteeringItem ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Associated with {item.associatedWith}
          </p>
        ) : null}
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {item.description}
        </p>
      </div>
    </article>
  )
}

export function AffiliationList({ items }: { items: Affiliation[] }) {
  return (
    <div className="grid gap-5">
      {items.map((item) => (
        <AffiliationItem key={item.id} item={item} />
      ))}
    </div>
  )
}
