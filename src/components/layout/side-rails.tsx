import {
  CoffeeIcon,
  GithubLogoIcon,
  LinkedinLogoIcon,
  WhatsappLogoIcon,
} from "@phosphor-icons/react"
import { Separator } from "@/components/ui/separator"
import { ExternalAction } from "@/components/shared/navigation-action"
import { profileCatalog } from "@/lib/content/profile"

const iconLinks = [
  {
    href: profileCatalog.socialUrl("linkedin"),
    label: "LinkedIn profile",
    icon: LinkedinLogoIcon,
  },
  {
    href: profileCatalog.socialUrl("github"),
    label: "GitHub profile",
    icon: GithubLogoIcon,
  },
  {
    href: profileCatalog.socialUrl("whatsapp"),
    label: "Chat on WhatsApp",
    icon: WhatsappLogoIcon,
  },
  {
    href: "https://www.supportkori.com/montasim",
    label: "Support Montasim on SupportKori",
    icon: CoffeeIcon,
  },
]

export function SideRails() {
  const { profile } = profileCatalog
  return (
    <>
      <nav
        className="fixed bottom-0 left-[max(1.5rem,calc(50%-46.2rem))] z-30 hidden flex-col items-center gap-2 xl:flex"
        aria-label="Social links"
      >
        {iconLinks.map(({ href, label, icon: Icon }) => (
          <ExternalAction
            key={label}
            href={href}
            variant="ghost"
            size="icon"
            className="size-10 text-2xl text-muted-foreground"
          >
            <span className="sr-only">{label}</span>
            <Icon className="size-[25.5px]" />
          </ExternalAction>
        ))}
        <Separator orientation="vertical" className="mt-2 h-20" />
      </nav>
      <div className="fixed right-[max(1.5rem,calc(50%-46.2rem))] bottom-0 z-30 hidden flex-col items-center gap-4 xl:flex">
        <a
          href={`mailto:${profile.email}`}
          className="rotate-180 rounded-sm text-sm tracking-wide text-muted-foreground transition-[color,opacity] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] [writing-mode:vertical-rl] hover:text-foreground hover:opacity-80 motion-reduce:transition-none"
        >
          {profile.email}
        </a>
        <Separator orientation="vertical" className="h-20" />
      </div>
    </>
  )
}
