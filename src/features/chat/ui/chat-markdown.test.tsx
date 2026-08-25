// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { ChatMarkdown } from "@/features/chat/ui/chat-markdown"

describe("ChatMarkdown", () => {
  afterEach(() => {
    delete (globalThis as Record<string, unknown>).__portfolioMdxProbe
    cleanup()
  })

  it("renders Markdown without evaluating MDX or raw HTML", () => {
    render(
      <ChatMarkdown
        source={[
          "export const probe = globalThis.__portfolioMdxProbe = 9",
          "",
          "**Safe prose.**",
          "",
          "<button>Unsafe action</button>",
        ].join("\n")}
      />
    )

    expect(
      (globalThis as Record<string, unknown>).__portfolioMdxProbe
    ).toBeUndefined()
    expect(screen.getByText("Safe prose.").tagName).toBe("STRONG")
    expect(screen.queryByRole("button", { name: "Unsafe action" })).toBeNull()
  })

  it("does not turn unsafe URL schemes into links", () => {
    const { container } = render(
      <ChatMarkdown
        source={[
          "[Do not run](javascript:alert(1))",
          "[Do not leave](//evil.example/phish)",
          "[Safe page](/projects)",
        ].join("\n\n")}
      />
    )

    expect(screen.queryByRole("link", { name: "Do not run" })).toBeNull()
    expect(screen.queryByRole("link", { name: "Do not leave" })).toBeNull()
    expect(
      screen.getByRole("link", { name: "Safe page" }).getAttribute("href")
    ).toBe("/projects")
    expect(screen.getByText("Do not run")).not.toBeNull()
    expect(container.querySelector("p")?.hasAttribute("node")).toBe(false)
  })
})
