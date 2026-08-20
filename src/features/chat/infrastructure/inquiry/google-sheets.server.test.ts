import { generateKeyPairSync } from "node:crypto"

import { describe, expect, it } from "vitest"

import {
  GoogleSheetsInquiryDelivery,
  inquiryToRow,
} from "@/features/chat/infrastructure/inquiry/google-sheets.server"

describe("GoogleSheetsInquiryDelivery", () => {
  it("maps role and project inquiries to the v1 sheet schema", () => {
    const timestamp = "2026-08-20T10:00:00.000Z"

    expect(
      inquiryToRow(
        {
          type: "hire",
          name: "Tanim",
          email: "tanim@example.com",
          role: "Senior Frontend Engineer",
          arrangement: "Remote",
        },
        timestamp
      )
    ).toEqual([
      timestamp,
      "hire",
      "Tanim",
      "tanim@example.com",
      "Senior Frontend Engineer",
      "Remote",
      "",
      "",
    ])

    expect(
      inquiryToRow(
        {
          type: "project",
          name: "Amina",
          email: "amina@example.com",
          projectType: "SaaS platform",
          timeline: "Within 1-3 months",
        },
        timestamp
      )
    ).toEqual([
      timestamp,
      "project",
      "Amina",
      "amina@example.com",
      "",
      "",
      "SaaS platform",
      "Within 1-3 months",
    ])
  })

  it.each([
    {
      label: "role",
      inquiry: {
        type: "hire" as const,
        name: "Tanim",
        email: "tanim@example.com",
        role: "Senior Frontend Engineer",
        arrangement: "Remote",
      },
      expectedRange: "Role%20Inquiries!A%3AH",
    },
    {
      label: "project",
      inquiry: {
        type: "project" as const,
        name: "Amina",
        email: "amina@example.com",
        projectType: "SaaS platform",
        timeline: "Flexible",
      },
      expectedRange: "Project%20Inquiries!A%3AH",
    },
  ])(
    "authenticates and appends a $label inquiry to its own tab",
    async ({ inquiry, expectedRange }) => {
      const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 })
      const requests: Array<{ url: string; init?: RequestInit }> = []
      const fetcher: typeof fetch = async (input, init) => {
        const url = input instanceof Request ? input.url : input.toString()
        requests.push({ url, init })
        return requests.length === 1
          ? Response.json({ access_token: "access-token" })
          : Response.json({ updates: { updatedRows: 1 } })
      }
      const delivery = new GoogleSheetsInquiryDelivery(
        {
          clientEmail: "portfolio@example.iam.gserviceaccount.com",
          privateKey: privateKey
            .export({ type: "pkcs8", format: "pem" })
            .toString(),
          sheetId: "sheet-id",
          roleRange: "Role Inquiries!A:H",
          projectRange: "Project Inquiries!A:H",
        },
        fetcher
      )

      await delivery.deliver(inquiry)

      expect(requests).toHaveLength(2)
      expect(requests[0]?.url).toBe("https://oauth2.googleapis.com/token")
      expect(requests[1]?.url).toContain(
        `/sheet-id/values/${expectedRange}:append?valueInputOption=USER_ENTERED`
      )
      expect(requests[1]?.init?.headers).toEqual({
        Authorization: "Bearer access-token",
        "Content-Type": "application/json",
      })
      const body: unknown = JSON.parse(String(requests[1]?.init?.body))
      expect(body).toEqual({
        values: [
          [expect.any(String), ...inquiryToRow(inquiry, "timestamp").slice(1)],
        ],
      })
    }
  )
})
