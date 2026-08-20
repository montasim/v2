// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { BadgeList } from "@/components/shared/badge-list"

describe("BadgeList disclosure", () => {
  afterEach(cleanup)

  it("reveals every hidden badge when the remaining-count control is clicked", () => {
    render(
      <BadgeList
        items={["React", "TypeScript", "Node.js", "PostgreSQL"]}
        label="Technologies"
        limit={2}
      />
    )

    expect(screen.queryByText("Node.js")).toBeNull()
    expect(screen.queryByText("PostgreSQL")).toBeNull()

    fireEvent.click(
      screen.getByRole("button", { name: "Show 2 more Technologies" })
    )

    expect(screen.getByText("Node.js")).toBeTruthy()
    expect(screen.getByText("PostgreSQL")).toBeTruthy()
  })
})
