import crypto from "node:crypto"

import type { InquiryDestination } from "@/features/chat/application/ports/portfolio-inquiry"
import type { InquirySubmission } from "@/features/chat/domain/inquiry"
import { logger } from "@/lib/logger.server"

const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets"
const TOKEN_URL = "https://oauth2.googleapis.com/token"
const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets"
const DEFAULT_ROLE_RANGE = "'Role Inquiries'!A:J"
const DEFAULT_PROJECT_RANGE = "'Project Inquiries'!A:J"
export const GOOGLE_SHEETS_REQUEST_TIMEOUT_MS = 3_500
const GOOGLE_TOKEN_REFRESH_MARGIN_MS = 60_000

const inFlightDeliveries = new Map<string, Promise<void>>()
const accessTokenCache = new Map<
  string,
  { accessToken: string; expiresAt: number }
>()
const accessTokenRequests = new Map<string, Promise<string>>()

interface GoogleSheetsConfig {
  clientEmail: string
  privateKey: string
  sheetId: string
  roleRange: string
  projectRange: string
}

type Fetcher = typeof fetch

export class GoogleSheetsInquiryDelivery implements InquiryDestination {
  readonly channel = "google-sheets" as const

  constructor(
    private readonly config?: GoogleSheetsConfig,
    private readonly fetcher: Fetcher = fetch,
    private readonly requestTimeoutMs = GOOGLE_SHEETS_REQUEST_TIMEOUT_MS
  ) {}

  async deliver(input: Parameters<InquiryDestination["deliver"]>[0]) {
    const config = this.config ?? readGoogleSheetsConfig()
    const configuredRange =
      input.inquiry.type === "hire" ? config.roleRange : config.projectRange
    const deliveryKey = `${config.sheetId}:${configuredRange}:${input.inquiry.id}`
    const inFlight = inFlightDeliveries.get(deliveryKey)
    if (inFlight) return inFlight

    const delivery = this.deliverOnce(input, config, configuredRange)
    inFlightDeliveries.set(deliveryKey, delivery)
    try {
      await delivery
    } finally {
      if (inFlightDeliveries.get(deliveryKey) === delivery) {
        inFlightDeliveries.delete(deliveryKey)
      }
    }
  }

  private async deliverOnce(
    { inquiry, signal }: Parameters<InquiryDestination["deliver"]>[0],
    config: GoogleSheetsConfig,
    configuredRange: string
  ) {
    const accessToken = await getGoogleAccessToken(
      config,
      this.fetcher,
      signal,
      this.requestTimeoutMs
    )
    const range = encodeURIComponent(configuredRange)
    const idRange = encodeURIComponent(inquiryIdRange(configuredRange))
    const lookupResponse = await fetchWithDeadline(
      this.fetcher,
      `${SHEETS_API}/${config.sheetId}/values/${idRange}?majorDimension=COLUMNS`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
      signal,
      this.requestTimeoutMs
    )

    if (!lookupResponse.ok) {
      throw new Error(`Google Sheets lookup failed (${lookupResponse.status}).`)
    }

    const lookup: unknown = await lookupResponse.json()
    const acceptedIds = new Set([inquiry.id, safeSheetValue(inquiry.id)])
    if (sheetValues(lookup).some((value) => acceptedIds.has(value))) {
      logger.info(
        { inquiryId: inquiry.id, inquiryType: inquiry.type },
        "Portfolio inquiry already stored"
      )
      return
    }

    const response = await fetchWithDeadline(
      this.fetcher,
      `${SHEETS_API}/${config.sheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ values: [inquiryToRow(inquiry)] }),
      },
      signal,
      this.requestTimeoutMs
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
        safeSheetValue(inquiry.id),
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
        safeSheetValue(inquiry.id),
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
  fetcher: Fetcher,
  signal: AbortSignal | undefined,
  timeoutMs: number
) {
  const cacheKey = googleTokenCacheKey(config)
  const cached = accessTokenCache.get(cacheKey)
  if (
    cached &&
    cached.expiresAt - GOOGLE_TOKEN_REFRESH_MARGIN_MS > Date.now()
  ) {
    return cached.accessToken
  }

  const inFlight = accessTokenRequests.get(cacheKey)
  if (inFlight) return inFlight

  const request = requestGoogleAccessToken(
    config,
    fetcher,
    signal,
    timeoutMs
  ).then(({ accessToken, expiresInSeconds }) => {
    accessTokenCache.set(cacheKey, {
      accessToken,
      expiresAt: Date.now() + expiresInSeconds * 1_000,
    })
    return accessToken
  })
  accessTokenRequests.set(cacheKey, request)
  try {
    return await request
  } finally {
    if (accessTokenRequests.get(cacheKey) === request) {
      accessTokenRequests.delete(cacheKey)
    }
  }
}

async function requestGoogleAccessToken(
  config: Pick<GoogleSheetsConfig, "clientEmail" | "privateKey">,
  fetcher: Fetcher,
  signal: AbortSignal | undefined,
  timeoutMs: number
) {
  const assertion = createServiceAccountJwt(config)
  const response = await fetchWithDeadline(
    fetcher,
    TOKEN_URL,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }),
    },
    signal,
    timeoutMs
  )
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

  const expiresInSeconds =
    "expires_in" in data &&
    typeof data.expires_in === "number" &&
    Number.isFinite(data.expires_in)
      ? Math.max(60, data.expires_in)
      : 3_600

  return { accessToken: data.access_token, expiresInSeconds }
}

function googleTokenCacheKey({
  clientEmail,
  privateKey,
}: Pick<GoogleSheetsConfig, "clientEmail" | "privateKey">) {
  const keyFingerprint = crypto
    .createHash("sha256")
    .update(privateKey)
    .digest("hex")
  return `${clientEmail}:${keyFingerprint}`
}

async function fetchWithDeadline(
  fetcher: Fetcher,
  input: Parameters<Fetcher>[0],
  init: RequestInit,
  parentSignal: AbortSignal | undefined,
  timeoutMs: number
) {
  const controller = new AbortController()
  const timeoutError = new Error(
    `Google Sheets request timed out after ${timeoutMs}ms.`
  )
  const timeout = setTimeout(() => controller.abort(timeoutError), timeoutMs)
  const signal = parentSignal
    ? AbortSignal.any([parentSignal, controller.signal])
    : controller.signal

  try {
    return await fetcher(input, { ...init, signal })
  } finally {
    clearTimeout(timeout)
  }
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
