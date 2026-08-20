import * as React from "react"

import { usePortfolioCommands } from "@/hooks/use-portfolio-commands"
import { actionShortcuts, sectionShortcuts } from "@/lib/portfolio-shortcuts"

function isEditableTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      target.isContentEditable)
  )
}

export function PortfolioKeyboardShortcuts() {
  const { executeAction, navigateToSection } = usePortfolioCommands()

  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat) return

      const key = event.key.toLowerCase()
      const usesCommandModifier = event.metaKey || event.ctrlKey

      if (key === "b" && usesCommandModifier && !event.altKey) {
        event.preventDefault()
        executeAction("coffee")
        return
      }

      if (
        usesCommandModifier ||
        event.altKey ||
        isEditableTarget(event.target)
      ) {
        return
      }

      const action = actionShortcuts.find(
        (item) => item.key.toLowerCase() === key
      )
      if (action) {
        event.preventDefault()
        executeAction(action.action)
        return
      }

      const section = sectionShortcuts.find((item) => item.key === event.key)
      if (section) {
        event.preventDefault()
        navigateToSection(section)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [executeAction, navigateToSection])

  return null
}
