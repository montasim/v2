import * as React from "react"

import { CommandMenu } from "@/components/shared/command-menu"

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (typeof event.key !== "string") return

      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen((current) => !current)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  return <CommandMenu open={open} onOpenChange={setOpen} />
}
