import crypto from "node:crypto"

import type { InquiryDelivery } from "@/features/chat/application/ports/inquiry-delivery"
import type { InquirySubmission } from "@/features/chat/domain/inquiry"
import { logger } from "@/lib/logger.server"

const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets"
const TOKEN_URL = "https://oauth2.googleapis.com/token"
const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets"
const DEFAULT_ROLE_RANGE = "'Role Inquiries'!A:J"
const DEFAULT_PROJECT_RANGE = "'Project Inquiries'!A:J"

interface GoogleSheetsConfig {
  clientEmail: string
  privateKey: string
  sheetId: string
  roleRange: string
  projectRange: string
}

type Fetcher = typeof fetch

export class GoogleSheetsInquiryDelivery implements InquiryDelivery {
  constructor(
    private readonly config: GoogleSheetsConfig = readGoogleSheetsConfig(),
    private readonly fetcher: Fetcher = fetch
  ) {}

  async deliver(inquiry: InquirySubmission) {
    const accessToken = await getGoogleAccessToken(this.config, this.fetcher)
    const configuredRange =
      inquiry.type === "hire" ? this.config.roleRange : this.config.projectRange
    const range = encodeURIComponent(configuredRange)
    const idRange = encodeURIComponent(inquiryIdRange(configuredRange))
    const lookupResponse = await this.fetcher(
      `${SHEETS_API}/${this.config.sheetId}/values/${idRange}?majorDimension=COLUMNS`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )

    if (!lookupResponse.ok) {
      throw new Error(`Google Sheets lookup failed (${lookupResponse.status}).`)
    }

    const lookup: unknown = await lookupResponse.json()
    if (sheetValues(lookup).some((value) => value === inquiry.id)) {
      logger.info(
        { inquiryId: inquiry.id, inquiryType: inquiry.type },
        "Portfolio inquiry already stored"
      )
      return
    }

    const response = await this.fetcher(
      `${SHEETS_API}/${this.config.sheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ values: [inquiryToRow(inquiry)] }),
      }
    )

    if (!response.ok) {
      throw new Error(`Google Sheets append failed (${response.status}).`)
    }

    logger.info(
      { inquiryId: inquiry.id, inquiryType: inquiry.type },
      "Portfolio inquiry stored"
    )
  }
}

export function inquiryToRow(
  inquiry: InquirySubmission,
  timestamp = new Date().toISOString()
) {
  return inquiry.type === "hire"
    ? [
        timestamp,
        inquiry.id,
        "hire",
        safeSheetValue(inquiry.name),
        safeSheetValue(inquiry.email),
        safeSheetValue(inquiry.role),
        safeSheetValue(inquiry.arrangement),
        "",
        "",
        safeSheetValue(inquiry.context ?? ""),
      ]
    : [
        timestamp,
        inquiry.id,
        "project",
        safeSheetValue(inquiry.name),
        safeSheetValue(inquiry.email),
        "",
        "",
        safeSheetValue(inquiry.projectType),
        safeSheetValue(inquiry.timeline),
        safeSheetValue(inquiry.context ?? ""),
      ]
}

export function inquiryIdRange(range: string) {
  const separator = range.lastIndexOf("!")
  return separator >= 0 ? `${range.slice(0, separator + 1)}B:B` : "B:B"
}

function sheetValues(value: unknown): string[] {
  if (!value || typeof value !== "object" || !("values" in value)) return []
  const columns = value.values
  if (!Array.isArray(columns) || !Array.isArray(columns[0])) return []
  return columns[0].filter((cell): cell is string => typeof cell === "string")
}

function safeSheetValue(value: string) {
  return /^[=+\-@]/.test(value) ? `'${value}` : value
}

function readGoogleSheetsConfig(): GoogleSheetsConfig {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n")
  const sheetId = process.env.GOOGLE_SHEET_ID

  if (!clientEmail || !privateKey || !sheetId) {
    throw new Error("Google Sheets inquiry storage is not configured.")
  }

  return {
    clientEmail,
    privateKey,
    sheetId,
    roleRange: process.env.GOOGLE_ROLE_INQUIRIES_RANGE || DEFAULT_ROLE_RANGE,
    projectRange:
      process.env.GOOGLE_PROJECT_INQUIRIES_RANGE || DEFAULT_PROJECT_RANGE,
  }
}

async function getGoogleAccessToken(
  config: Pick<GoogleSheetsConfig, "clientEmail" | "privateKey">,
  fetcher: Fetcher
) {
  const assertion = createServiceAccountJwt(config)
  const response = await fetcher(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  })
  const data: unknown = await response.json()

  if (
    !response.ok ||
    !data ||
    typeof data !== "object" ||
    !("access_token" in data) ||
    typeof data.access_token !== "string"
  ) {
    throw new Error(`Google authentication failed (${response.status}).`)
  }

  return data.access_token
}

function createServiceAccountJwt({
  clientEmail,
  privateKey,
}: Pick<GoogleSheetsConfig, "clientEmail" | "privateKey">) {
  const now = Math.floor(Date.now() / 1_000)
  const header = Buffer.from(
    JSON.stringify({ alg: "RS256", typ: "JWT" })
  ).toString("base64url")
  const payload = Buffer.from(
    JSON.stringify({
      iss: clientEmail,
      scope: SHEETS_SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3_600,
    })
  ).toString("base64url")
  const unsignedToken = `${header}.${payload}`
  const signature = crypto
    .createSign("RSA-SHA256")
    .update(unsignedToken)
    .sign(privateKey, "base64url")

  return `${unsignedToken}.${signature}`
}
