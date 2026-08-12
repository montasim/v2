import {
  CoffeeIcon,
  GithubLogoIcon,
  LinkedinLogoIcon,
} from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { profile, socialUrl } from "@/lib/content"

const iconLinks = [
  {
    href: socialUrl("linkedin"),
    label: "LinkedIn profile",
    title: "LinkedIn",
    icon: LinkedinLogoIcon,
  },
  {
    href: socialUrl("github"),
    label: "GitHub profile",
    title: "GitHub",
    icon: GithubLogoIcon,
  },
  {
    href: "https://www.supportkori.com/montasim",
    label: "Support Montasim on SupportKori",
    title: "SupportKori",
    icon: CoffeeIcon,
  },
]

export function SideRails() {
  return (
    <>
      <nav
        className="fixed bottom-0 left-[max(1.5rem,calc(50%-46.2rem))] z-30 hidden flex-col items-center gap-2 xl:flex"
        aria-label="Social links"
      >
        {iconLinks.map(({ href, label, title, icon: Icon }) => (
          <Button
            key={label}
            asChild
            variant="ghost"
            size="icon"
            className="size-10 text-2xl text-muted-foreground"
          >
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              aria-label={label}
              title={title}
            >
              <Icon className="size-[25.5px]" />
            </a>
          </Button>
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
