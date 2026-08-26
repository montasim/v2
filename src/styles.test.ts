import { readFileSync } from "node:fs"

import { describe, expect, it } from "vitest"

const styles = readFileSync(new URL("./styles.css", import.meta.url), "utf8")
const darkTheme = styles.match(/\.dark\s*\{(?<tokens>[\s\S]*?)\n\}/)?.groups
  ?.tokens

function token(name: string) {
  const value = darkTheme?.match(
    new RegExp(`--${name}:\\s*(#[\\da-f]{6})`, "i")
  )?.[1]

  if (!value) throw new Error(`Missing dark theme token: ${name}`)
  return value
}

function luminance(hex: string) {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)!
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) =>
      channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
    )

  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
}

function contrast(foreground: string, background: string) {
  const lighter = Math.max(luminance(foreground), luminance(background))
  const darker = Math.min(luminance(foreground), luminance(background))
  return (lighter + 0.05) / (darker + 0.05)
}

describe("dark theme text hierarchy", () => {
  it("keeps strong, body, and supporting text visually distinct", () => {
    const strong = luminance(token("strong-foreground"))
    const body = luminance(token("foreground"))
    const supporting = luminance(token("muted-foreground"))

    expect(strong).toBeGreaterThan(body)
    expect(body).toBeGreaterThan(supporting)
  })

  it.each([
    ["strong-foreground", "background"],
    ["strong-foreground", "card"],
    ["foreground", "background"],
    ["foreground", "card"],
    ["muted-foreground", "background"],
    ["muted-foreground", "card"],
  ])("keeps %s readable on %s", (foreground, background) => {
    expect(
      contrast(token(foreground), token(background))
    ).toBeGreaterThanOrEqual(4.5)
  })
})
