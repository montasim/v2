import * as React from "react"
import {
  BriefcaseIcon,
  CertificateIcon,
  ChatCenteredDotsIcon,
  CodeIcon,
  CoffeeIcon,
  DownloadSimpleIcon,
  EnvelopeSimpleIcon,
  FolderIcon,
  GithubLogoIcon,
  HandHeartIcon,
  LinkedinLogoIcon,
  MoonIcon,
  StudentIcon,
  SunIcon,
  UserIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react"
import type { Icon } from "@phosphor-icons/react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { usePortfolioCommands } from "@/hooks/use-portfolio-commands"
import {
  actionShortcuts,
  additionalSections,
  sectionShortcuts,
} from "@/lib/portfolio-shortcuts"
import type {
  PortfolioAction,
  PortfolioSection,
} from "@/lib/portfolio-shortcuts"

const sectionIconMap: Record<PortfolioSection["label"], Icon> = {
  About: UserIcon,
  Experience: BriefcaseIcon,
  Education: StudentIcon,
  Skills: CodeIcon,
  Projects: FolderIcon,
  Recommendations: ChatCenteredDotsIcon,
  Certifications: CertificateIcon,
  Volunteering: HandHeartIcon,
  Organizations: UsersThreeIcon,
}

const actionIconMap: Record<PortfolioAction, Icon> = {
  coffee: CoffeeIcon,
  theme: SunIcon,
  assistant: ChatCenteredDotsIcon,
  resume: DownloadSimpleIcon,
  linkedin: LinkedinLogoIcon,
  github: GithubLogoIcon,
  email: EnvelopeSimpleIcon,
}

const allSections = [...sectionShortcuts, ...additionalSections]

export function CommandMenu({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { executeAction, navigateToSection, theme } = usePortfolioCommands()

  const run = React.useCallback(
    (action: () => void) => {
      onOpenChange(false)
      action()
    },
    [onOpenChange]
  )

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          {allSections.map((section) => {
            const SectionIcon = sectionIconMap[section.label]
            return (
              <CommandItem
                key={section.label}
                value={section.label}
                onSelect={() => run(() => navigateToSection(section))}
              >
                <SectionIcon className="text-muted-foreground" />
                {section.label}
                {"key" in section && (
                  <span className="ml-auto text-sm text-muted-foreground">
                    {section.key}
                  </span>
                )}
              </CommandItem>
            )
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          {actionShortcuts.map((item) => {
            const ActionIcon =
              item.action === "theme" && theme === "dark"
                ? SunIcon
                : item.action === "theme"
                  ? MoonIcon
                  : actionIconMap[item.action]
            const label =
              item.action === "theme"
                ? theme === "dark"
                  ? "Light Mode"
                  : "Dark Mode"
                : item.label

            return (
              <CommandItem
                key={item.action}
                value={label}
                onSelect={() => run(() => executeAction(item.action))}
              >
                <ActionIcon className="text-muted-foreground" />
                {label}
                <span className="ml-auto text-sm text-muted-foreground">
                  {item.key}
                </span>
              </CommandItem>
            )
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
