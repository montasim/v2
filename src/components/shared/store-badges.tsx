import {
  ChromeIcon,
  GithubLogoIcon,
  MicrosoftStoreIcon,
  NpmIcon,
  PackageIcon,
  PlayStoreIcon,
} from "@/components/ui/icons"
import {
  ExternalAction,
  ExternalLink,
} from "@/components/shared/navigation-action"
import { Button } from "@/components/ui/button"
import { extensionReleaseUrl } from "@/lib/content/projects"
import type { Project } from "@/lib/content/projects"
import { cn } from "@/lib/utils"

/**
 * Store links drawn as the site's own outline buttons, so they follow the
 * theme instead of importing each store's badge artwork.
 */
export function StoreBadges({
  project,
  className,
}: {
  project: Pick<
    Project,
    | "type"
    | "releaseUrl"
    | "title"
    | "googlePlayUrl"
    | "microsoftStoreUrl"
    | "snapcraftUrl"
    | "chromeWebStoreUrl"
    | "npmUrl"
  >
  className?: string
}) {
  const stores = [
    {
      id: "google-play",
      href: project.googlePlayUrl,
      Icon: PlayStoreIcon,
      name: "Google Play",
      label: `Get ${project.title} for Android on Google Play`,
    },
    {
      id: "microsoft-store",
      href: project.microsoftStoreUrl,
      Icon: MicrosoftStoreIcon,
      name: "Microsoft Store",
      label: `Download ${project.title} for Windows from the Microsoft Store`,
    },
    {
      id: "snap-store",
      href: project.snapcraftUrl,
      Icon: PackageIcon,
      name: "Snap Store",
      label: `Get ${project.title} for Linux from the Snap Store`,
    },
    {
      id: "chrome-web-store",
      href: project.chromeWebStoreUrl,
      Icon: ChromeIcon,
      name: "Chrome Web Store",
      label: `Get ${project.title} from the Chrome Web Store`,
    },
    {
      id: "npm",
      href: project.npmUrl,
      Icon: NpmIcon,
      name: "npm",
      label: `Get ${project.title} on npm`,
    },
  ].filter((store): store is typeof store & { href: string } =>
    Boolean(store.href)
  )

  const releaseUrl = extensionReleaseUrl(project)
  if (!stores.length && !releaseUrl) return null

  return (
    <div
      role="group"
      aria-label={`Download ${project.title}`}
      className={cn("flex flex-wrap items-center gap-2", className)}
    >
      {stores.map(({ id, href, Icon, name, label }) => (
        <Button key={id} asChild variant="outline" size="lg">
          <ExternalLink href={href} aria-label={label} data-store={id}>
            <Icon />
            {name}
          </ExternalLink>
        </Button>
      ))}
      {releaseUrl ? (
        <ExternalAction href={releaseUrl} variant="outline" size="lg">
          <GithubLogoIcon />
          Download from GitHub
        </ExternalAction>
      ) : null}
    </div>
  )
}
