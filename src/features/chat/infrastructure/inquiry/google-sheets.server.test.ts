import { generateKeyPairSync } from "node:crypto"

import { describe, expect, it, vi } from "vitest"

import {
  GoogleSheetsInquiryDelivery,
  inquiryToRow,
} from "@/features/chat/infrastructure/inquiry/google-sheets.server"

describe("GoogleSheetsInquiryDelivery", () => {
  it("maps role and project inquiries to the v2 sheet schema", () => {
    const timestamp = "2026-08-20T10:00:00.000Z"

    expect(
      inquiryToRow(
        {
          id: "inquiry-role-1",
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
      "inquiry-role-1",
      "hire",
      "Tanim",
      "tanim@example.com",
      "Senior Frontend Engineer",
      "Remote",
      "",
      "",
      "",
    ])

    expect(
      inquiryToRow(
        {
          id: "inquiry-project-1",
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
      "inquiry-project-1",
      "project",
      "Amina",
      "amina@example.com",
      "",
      "",
      "SaaS platform",
      "Within 1-3 months",
      "",
    ])
  })

  it.each([
    {
      label: "role",
      inquiry: {
        id: "inquiry-role-2",
        type: "hire" as const,
        name: "Tanim",
        email: "tanim@example.com",
        role: "Senior Frontend Engineer",
        arrangement: "Remote",
      },
      expectedRange: "Role%20Inquiries!A%3AJ",
    },
    {
      label: "project",
      inquiry: {
        id: "inquiry-project-2",
        type: "project" as const,
        name: "Amina",
        email: "amina@example.com",
        projectType: "SaaS platform",
        timeline: "Flexible",
      },
      expectedRange: "Project%20Inquiries!A%3AJ",
    },
  ])(
    "authenticates and appends a $label inquiry to its own tab",
    async ({ inquiry, expectedRange }) => {
      const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 })
      const requests: Array<{ url: string; init?: RequestInit }> = []
      const fetcher: typeof fetch = async (input, init) => {
        const url = input instanceof Request ? input.url : input.toString()
        requests.push({ url, init })
        if (requests.length === 1) {
          return Response.json({ access_token: "access-token" })
        }
        if (requests.length === 2) return Response.json({ values: [] })
        return Response.json({ updates: { updatedRows: 1 } })
      }
      const delivery = new GoogleSheetsInquiryDelivery(
        {
          clientEmail: "portfolio@example.iam.gserviceaccount.com",
          privateKey: privateKey
            .export({ type: "pkcs8", format: "pem" })
            .toString(),
          sheetId: "sheet-id",
          roleRange: "Role Inquiries!A:J",
          projectRange: "Project Inquiries!A:J",
        },
        fetcher
      )

      await delivery.deliver(inquiry)

      expect(requests).toHaveLength(3)
      expect(requests[0]?.url).toBe("https://oauth2.googleapis.com/token")
      expect(requests[1]?.url).toContain("!B%3AB?majorDimension=COLUMNS")
      expect(requests[2]?.url).toContain(
        `/sheet-id/values/${expectedRange}:append?valueInputOption=USER_ENTERED`
      )
      expect(requests[2]?.init?.headers).toEqual({
        Authorization: "Bearer access-token",
        "Content-Type": "application/json",
      })
      const body: unknown = JSON.parse(String(requests[2]?.init?.body))
      expect(body).toEqual({
        values: [
          [expect.any(String), ...inquiryToRow(inquiry, "timestamp").slice(1)],
        ],
      })
    }
  )

  it("does not append an inquiry whose ID is already stored", async () => {
    const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 })
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ access_token: "access-token" }))
      .mockResolvedValueOnce(
        Response.json({ values: [["inquiry ID", "inquiry-role-existing"]] })
      )
    const delivery = new GoogleSheetsInquiryDelivery(
      {
        clientEmail: "portfolio@example.iam.gserviceaccount.com",
        privateKey: privateKey
          .export({ type: "pkcs8", format: "pem" })
          .toString(),
        sheetId: "sheet-id",
        roleRange: "Role Inquiries!A:J",
        projectRange: "Project Inquiries!A:J",
      },
      fetcher
    )

    await delivery.deliver({
      id: "inquiry-role-existing",
      type: "hire",
      name: "Tanim",
      email: "tanim@example.com",
      role: "Technical Lead",
      arrangement: "Remote",
    })

    expect(fetcher).toHaveBeenCalledTimes(2)
  })
})
