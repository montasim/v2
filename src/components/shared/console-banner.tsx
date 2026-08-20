import { useEffect } from "react"

import { profileCatalog } from "@/lib/content/profile"
import { site } from "@/lib/site"

const loggedWindows = new WeakSet<Window>()

const ascii = [
  "",
  "    __  ___            __            _",
  "   /  |/  /___  ____  / /_____ _____(_)___ ___",
  "  / /|_/ / __ \\/ __ \\/ __/ __ `/ ___/ / __ `__ \\",
  " / /  / / /_/ / / / / /_/ /_/ (__  ) / / / / / /",
  "/_/  /_/\\____/_/ /_/\\__/\\__,_/____/_/_/ /_/ /_/",
  "",
].join("\n")

export function ConsoleBanner() {
  useEffect(() => {
    if (loggedWindows.has(window)) return
    loggedWindows.add(window)

    const bannerStyle = [
      "color: #3b82f6",
      "font-size: 12px",
      "font-weight: bold",
      "line-height: 1.3",
    ].join(";")
    const labelStyle = "color: #8b5cf6; font-size: 13px;"
    const valueStyle = "color: #10b981; font-size: 13px;"
    const log = console.log.bind(console)

    log(`%c${ascii}`, bannerStyle)
    log(
      "%cThanks for stopping by!",
      "color: #3b82f6; font-size: 16px; font-weight: bold;"
    )
    log(
      `%c- LinkedIn    %c${profileCatalog.socialUrl("linkedin")}`,
      labelStyle,
      valueStyle
    )
    log(
      `%c- GitHub      %c${profileCatalog.socialUrl("github")}`,
      labelStyle,
      valueStyle
    )
    log(
      `%c- Email       %c${profileCatalog.profile.email}`,
      labelStyle,
      valueStyle
    )
    log(
      `%c- WhatsApp    %c${profileCatalog.socialUrl("whatsapp")}`,
      labelStyle,
      valueStyle
    )
    log(
      `%c- SupportKori %c${profileCatalog.profile.supportUrl}`,
      labelStyle,
      valueStyle
    )
    log(`%c- Portfolio   %c${site.url}`, labelStyle, valueStyle)
  }, [])

  return null
}
