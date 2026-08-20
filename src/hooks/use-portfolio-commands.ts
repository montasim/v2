import * as React from "react"
import { useNavigate } from "@tanstack/react-router"

import { useTheme } from "@/components/theme-provider"
import { profileCatalog } from "@/lib/content/profile"
import type {
  PortfolioAction,
  PortfolioSection,
} from "@/lib/portfolio-shortcuts"

export function usePortfolioCommands() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const { profile } = profileCatalog

  const navigateToSection = React.useCallback(
    (section: PortfolioSection) => {
      void navigate({
        to: section.to,
        hash: "hash" in section ? section.hash : undefined,
      })
    },
    [navigate]
  )

  const executeAction = React.useCallback(
    (action: PortfolioAction) => {
      function openExternal(url: string) {
        window.open(url, "_blank", "noopener,noreferrer")
      }

      switch (action) {
        case "theme":
          toggleTheme()
          break
        case "assistant": {
          const assistantToggle =
            document.querySelector<HTMLElement>(
              '[aria-label="Close assistant"]'
            ) ??
            document.querySelector<HTMLElement>(
              '[aria-label="Ask about Montasim"]'
            )
          assistantToggle?.click()
          break
        }
        case "resume":
          openExternal(profile.resumeUrl)
          break
        case "linkedin":
          openExternal(profileCatalog.socialUrl("linkedin"))
          break
        case "github":
          openExternal(profileCatalog.socialUrl("github"))
          break
        case "email":
          window.open(`mailto:${profile.email}`)
          break
        case "coffee": {
          const widgetButton =
            document.querySelector<HTMLElement>(".sk-widget-btn")
          if (widgetButton) widgetButton.click()
          else openExternal(profile.supportUrl)
          break
        }
      }
    },
    [profile, toggleTheme]
  )

  return { executeAction, navigateToSection, theme }
}
