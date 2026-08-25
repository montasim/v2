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

      await delivery.deliver({
        inquiry,
        idempotencyKey: `portfolio-inquiry-${inquiry.id}-google-sheets-v1`,
      })

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
      inquiry: {
        id: "inquiry-role-existing",
        type: "hire",
        name: "Tanim",
        email: "tanim@example.com",
        role: "Technical Lead",
        arrangement: "Remote",
      },
      idempotencyKey:
        "portfolio-inquiry-inquiry-role-existing-google-sheets-v1",
    })

    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it("serializes concurrent lookup-and-append work for the same inquiry ID", async () => {
    const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 })
    const config = {
      clientEmail: "portfolio@example.iam.gserviceaccount.com",
      privateKey: privateKey
        .export({ type: "pkcs8", format: "pem" })
        .toString(),
      sheetId: "sheet-id",
      roleRange: "Role Inquiries!A:J",
      projectRange: "Project Inquiries!A:J",
    }
    const requests: string[] = []
    const fetcher: typeof fetch = async (input) => {
      const url = input instanceof Request ? input.url : input.toString()
      requests.push(url)
      if (url.includes("oauth2.googleapis.com")) {
        return Response.json({ access_token: "access-token" })
      }
      if (url.includes("majorDimension=COLUMNS")) {
        return Response.json({ values: [] })
      }
      return Response.json({ updates: { updatedRows: 1 } })
    }
    const inquiry = {
      id: "inquiry-project-concurrent",
      type: "project" as const,
      name: "Amina",
      email: "amina@example.com",
      projectType: "SaaS platform",
      timeline: "Flexible",
    }
    const deliveryInput = {
      inquiry,
      idempotencyKey:
        "portfolio-inquiry-inquiry-project-concurrent-google-sheets-v1",
    }

    await Promise.all([
      new GoogleSheetsInquiryDelivery(config, fetcher).deliver(deliveryInput),
      new GoogleSheetsInquiryDelivery(config, fetcher).deliver(deliveryInput),
    ])

    expect(requests).toHaveLength(3)
    expect(requests.filter((url) => url.includes(":append"))).toHaveLength(1)
  })

  it("reuses a healthy OAuth token across sequential deliveries", async () => {
    const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 })
    const requests: string[] = []
    const fetcher: typeof fetch = async (input) => {
      const url = input instanceof Request ? input.url : input.toString()
      requests.push(url)
      if (url.includes("oauth2.googleapis.com")) {
        return Response.json({ access_token: "cached-token", expires_in: 3600 })
      }
      if (url.includes("majorDimension=COLUMNS")) {
        return Response.json({ values: [] })
      }
      return Response.json({ updates: { updatedRows: 1 } })
    }
    const delivery = new GoogleSheetsInquiryDelivery(
      {
        clientEmail: "token-cache@example.iam.gserviceaccount.com",
        privateKey: privateKey
          .export({ type: "pkcs8", format: "pem" })
          .toString(),
        sheetId: "sheet-id",
        roleRange: "Role Inquiries!A:J",
        projectRange: "Project Inquiries!A:J",
      },
      fetcher
    )

    for (const id of ["inquiry-project-cache-1", "inquiry-project-cache-2"]) {
      await delivery.deliver({
        inquiry: {
          id,
          type: "project",
          name: "Amina",
          email: "amina@example.com",
          projectType: "SaaS platform",
          timeline: "Flexible",
        },
        idempotencyKey: `portfolio-inquiry-${id}-google-sheets-v1`,
      })
    }

    expect(
      requests.filter((url) => url.includes("oauth2.googleapis.com"))
    ).toHaveLength(1)
    expect(requests.filter((url) => url.includes(":append"))).toHaveLength(2)
  })

  it("aborts an individual Google request at its adapter deadline", async () => {
    vi.useFakeTimers()
    try {
      const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 })
      const observedSignals: AbortSignal[] = []
      const fetcher: typeof fetch = async (_input, init) => {
        const observedSignal = init?.signal
        if (observedSignal) observedSignals.push(observedSignal)
        return new Promise<Response>((_resolve, reject) => {
          observedSignal?.addEventListener(
            "abort",
            () => reject(observedSignal.reason),
            { once: true }
          )
        })
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
        fetcher,
        25
      )
      const result = delivery.deliver({
        inquiry: {
          id: "inquiry-role-timeout",
          type: "hire",
          name: "Tanim",
          email: "tanim@example.com",
          role: "Technical Lead",
          arrangement: "Remote",
        },
        idempotencyKey:
          "portfolio-inquiry-inquiry-role-timeout-google-sheets-v1",
      })
      const rejection = expect(result).rejects.toThrow("timed out after 25ms")

      await vi.advanceTimersByTimeAsync(30)

      await rejection
      expect(observedSignals.at(0)?.aborted).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })

  it("neutralizes spreadsheet formulas in every visitor-controlled cell", () => {
    const row = inquiryToRow({
      id: "=inquiry-formula-1",
      type: "project",
      name: '=IMPORTXML("https://example.com")',
      email: "safe@example.com",
      projectType: "+SUM(1, 1)",
      timeline: "-1+1",
      context: "@malicious-formula",
    })

    expect(row[1]).toBe("'=inquiry-formula-1")
    expect(row[3]).toBe('\'=IMPORTXML("https://example.com")')
    expect(row[7]).toBe("'+SUM(1, 1)")
    expect(row[8]).toBe("'-1+1")
    expect(row[9]).toBe("'@malicious-formula")
  })
})
