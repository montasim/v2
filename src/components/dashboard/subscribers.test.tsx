// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { Subscribers } from "@/components/dashboard/subscribers"

afterEach(cleanup)

describe("Subscribers", () => {
  it("shows subscriber contact, join time, and confirmation state", () => {
    render(
      <Subscribers
        data={[
          {
            id: "subscriber-1",
            email: "reader@example.com",
            confirmationState: "sent",
            confirmationLastError: null,
            confirmationSentAt: "2026-08-26T06:00:00.000Z",
            createdAt: "2026-08-26T05:59:00.000Z",
            updatedAt: "2026-08-26T06:00:00.000Z",
          },
        ]}
      />
    )

    expect(
      screen
        .getByRole("link", { name: "reader@example.com" })
        .getAttribute("href")
    ).toBe("mailto:reader@example.com")
    expect(screen.getByText("Email sent")).not.toBeNull()
    expect(screen.getByText(/Subscribed Aug 26, 2026/)).not.toBeNull()
  })

  it("makes failed confirmation delivery visible", () => {
    render(
      <Subscribers
        data={[
          {
            id: "subscriber-2",
            email: "retry@example.com",
            confirmationState: "failed",
            confirmationLastError: "provider unavailable",
            confirmationSentAt: null,
            createdAt: "2026-08-26T05:59:00.000Z",
            updatedAt: "2026-08-26T06:00:00.000Z",
          },
        ]}
      />
    )

    expect(screen.getByText("Email failed")).not.toBeNull()
  })
})
