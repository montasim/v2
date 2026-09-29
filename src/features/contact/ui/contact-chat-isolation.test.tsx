// @vitest-environment jsdom
import { useState } from "react"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { ApplicationFrame } from "@/routes/__root"

const route = vi.hoisted(() => ({ pathname: "/" }))
vi.mock("@tanstack/react-router", () => ({
  createRootRoute: (options: unknown) => options,
  useRouterState: ({
    select,
  }: {
    select: (state: { location: { pathname: string } }) => unknown
  }) => select({ location: route }),
}))
vi.mock("@/components/layout/site-footer", () => ({ SiteFooter: () => null }))
vi.mock("@/components/layout/site-header", () => ({ SiteHeader: () => null }))
vi.mock("@/components/layout/side-rails", () => ({ SideRails: () => null }))
vi.mock("@/components/portfolio/konami-command-center", () => ({
  KonamiCommandCenter: () => null,
}))
vi.mock("@/components/shared/app-context-menu", () => ({
  AppContextMenu: ({ children }: { children: React.ReactNode }) => children,
}))
vi.mock("@/components/shared/command-palette", () => ({
  CommandPalette: () => null,
}))
vi.mock("@/components/shared/console-banner", () => ({
  ConsoleBanner: () => null,
}))
vi.mock("@/components/shared/error-page", () => ({ ErrorPage: () => null }))
vi.mock("@/components/shared/portfolio-keyboard-shortcuts", () => ({
  PortfolioKeyboardShortcuts: () => null,
}))
vi.mock("@/features/chat/ui/portfolio-assistant", () => ({
  PortfolioAssistant: function Assistant() {
    const [open, setOpen] = useState(false)
    return (
      <>
        <button onClick={() => setOpen(true)}>Open test assistant</button>
        {open && <div role="dialog">Chat</div>}
      </>
    )
  },
}))
afterEach(() => {
  cleanup()
  route.pathname = "/"
})
describe("contact route chat isolation", () => {
  it.each(["/contact", "/contact/"])(
    "leaves contact-specific assistant visibility to the page on %s",
    (pathname) => {
      route.pathname = pathname
      render(
        <ApplicationFrame>
          <main>Contact form</main>
        </ApplicationFrame>
      )
      expect(
        screen.queryByRole("button", { name: "Open test assistant" })
      ).toBeNull()
      expect(screen.queryByRole("dialog")).toBeNull()
      expect(screen.getByText("Contact form")).toBeTruthy()
    }
  )
  it("unmounts an open assistant on entry and restores a closed assistant after leaving", () => {
    const view = render(
      <ApplicationFrame>
        <main>Page</main>
      </ApplicationFrame>
    )
    fireEvent.click(screen.getByRole("button", { name: "Open test assistant" }))
    expect(screen.getByRole("dialog")).toBeTruthy()
    route.pathname = "/contact"
    view.rerender(
      <ApplicationFrame>
        <main>Contact form</main>
      </ApplicationFrame>
    )
    expect(screen.queryByRole("dialog")).toBeNull()
    expect(
      screen.queryByRole("button", { name: "Open test assistant" })
    ).toBeNull()
    route.pathname = "/experience"
    view.rerender(
      <ApplicationFrame>
        <main>Experience</main>
      </ApplicationFrame>
    )
    expect(
      screen.getByRole("button", { name: "Open test assistant" })
    ).toBeTruthy()
    expect(screen.queryByRole("dialog")).toBeNull()
  })
})
