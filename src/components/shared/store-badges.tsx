import { ExternalLink } from "@/components/shared/navigation-action"
import type { Project } from "@/lib/content/projects"
import { cn } from "@/lib/utils"

export function StoreBadges({
  project,
  className,
}: {
  project: Pick<
    Project,
    | "title"
    | "microsoftStoreUrl"
    | "snapcraftUrl"
    | "chromeWebStoreUrl"
    | "npmUrl"
  >
  className?: string
}) {
  const stores = [
    {
      href: project.microsoftStoreUrl,
      image: "microsoft-store.svg",
      label: `Download ${project.title} for Windows from the Microsoft Store`,
      width: 161,
      height: 44,
    },
    {
      href: project.snapcraftUrl,
      image: "snap-store.svg",
      label: `Get ${project.title} for Linux from the Snap Store`,
      width: 182,
      height: 56,
    },
    {
      href: project.chromeWebStoreUrl,
      image: "chrome-web-store.png",
      label: `Get ${project.title} from the Chrome Web Store`,
      width: 206,
      height: 58,
    },
    {
      href: project.npmUrl,
      image: "npm.svg",
      label: `Get ${project.title} on npm`,
      width: 150,
      height: 44,
    },
  ].filter((store) => store.href)

  if (!stores.length) return null

  return (
    <div
      role="group"
      aria-label={`Download ${project.title}`}
      className={cn("flex flex-wrap items-center gap-3", className)}
    >
      {stores.map((store) => (
        <ExternalLink
          key={store.image}
          href={store.href}
          className="shrink-0 rounded-sm outline-offset-4 hover:opacity-85 focus-visible:outline-2 focus-visible:outline-ring"
        >
          <img
            src={`/images/store-badges/${store.image}`}
            alt={store.label}
            width={store.width}
            height={store.height}
            className="h-11 w-auto"
          />
        </ExternalLink>
      ))}
    </div>
  )
}
