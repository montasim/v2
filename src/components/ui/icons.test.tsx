// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { ArrowRightIcon } from "@/components/ui/icons"

afterEach(cleanup)

describe("Hugeicons wrapper", () => {
  it("applies the shared visual and accessibility defaults", () => {
    render(<ArrowRightIcon className="size-5" data-testid="icon" />)

    const icon = screen.getByTestId("icon")
    expect(icon.tagName).toBe("svg")
    expect(icon.getAttribute("stroke-width")).toBe("1.5")
    expect(icon.getAttribute("aria-hidden")).toBe("true")
    expect(icon.getAttribute("focusable")).toBe("false")
    expect(icon.classList.contains("size-5")).toBe(true)
  })

  it("allows a standalone icon to expose an accessible label", () => {
    render(<ArrowRightIcon aria-label="Continue" />)

    expect(screen.getByLabelText("Continue").hasAttribute("aria-hidden")).toBe(
      false
    )
  })
})
