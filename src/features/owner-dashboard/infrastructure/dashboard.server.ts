import { count, desc, eq } from "drizzle-orm"

import { getDatabase } from "@/db/client.server"
import {
  assistantExchanges,
  blogComments,
  portfolioInquiries,
} from "@/db/schema"
import { loadAvailabilitySettings } from "@/features/availability/infrastructure/settings.server"
import {
  arrangementInquiryOptions,
  roleInquiryOptions,
} from "@/features/chat/domain/inquiry"

export const OWNER_DASHBOARD_PAGE_SIZE = 6

export type InquiryStat = {
  label: string
  count: number
}

type SerializableJson =
  | null
  | boolean
  | number
  | string
  | SerializableJson[]
  | { [key: string]: SerializableJson }

function serializeJson(value: unknown): SerializableJson | null {
  if (value === undefined || value === null) return null
  return JSON.parse(JSON.stringify(value)) as SerializableJson
}

function serializeExchange(exchange: typeof assistantExchanges.$inferSelect) {
  return {
    ...exchange,
    citations: serializeJson(exchange.citations),
    evidenceIds: serializeJson(exchange.evidenceIds),
    retrievalMetadata: serializeJson(exchange.retrievalMetadata),
    providerAttempts: serializeJson(exchange.providerAttempts),
    createdAt: exchange.createdAt.toISOString(),
  }
}

function normalizeInquiryStats(
  rows: Array<{ label: string | null; count: number }>,
  expectedLabels: readonly string[]
): InquiryStat[] {
  const counts = new Map(
    rows.map((row) => [row.label ?? "Not specified", row.count])
  )
  const labels = [...expectedLabels]
  for (const label of counts.keys()) {
    if (!labels.includes(label)) labels.push(label)
  }

  return labels
    .map((label) => ({ label, count: counts.get(label) ?? 0 }))
    .sort((left, right) => right.count - left.count)
}

async function loadPage<T>(
  requestedPage: number,
  table:
    typeof portfolioInquiries | typeof assistantExchanges | typeof blogComments,
  createdAt:
    | typeof portfolioInquiries.createdAt
    | typeof assistantExchanges.createdAt
    | typeof blogComments.createdAt
) {
  const database = getDatabase()
  const [{ total }] = await database.select({ total: count() }).from(table)
  const pageCount = Math.max(1, Math.ceil(total / OWNER_DASHBOARD_PAGE_SIZE))
  const page = Math.min(Math.max(1, requestedPage), pageCount)
  const items = (await database
    .select()
    .from(table)
    .orderBy(desc(createdAt))
    .limit(OWNER_DASHBOARD_PAGE_SIZE)
    .offset((page - 1) * OWNER_DASHBOARD_PAGE_SIZE)) as T[]

  return {
    items,
    page,
    pageCount,
    pageSize: OWNER_DASHBOARD_PAGE_SIZE,
    total,
  }
}

export async function loadOwnerDashboard() {
  const database = getDatabase()
  const [comments, conversations, inquiries, availability] = await Promise.all([
    database.select().from(blogComments).orderBy(desc(blogComments.createdAt)),
    database
      .select()
      .from(assistantExchanges)
      .orderBy(desc(assistantExchanges.createdAt)),
    database
      .select()
      .from(portfolioInquiries)
      .orderBy(desc(portfolioInquiries.createdAt)),
    loadAvailabilitySettings(),
  ])

  return {
    availability,
    comments: comments.map((comment) => ({
      ...comment,
      createdAt: comment.createdAt.toISOString(),
    })),
    conversations: conversations.map(serializeExchange),
    inquiries: inquiries.map((inquiry) => ({
      ...inquiry,
      createdAt: inquiry.createdAt.toISOString(),
    })),
  }
}

export async function loadOwnerInquiries(page: number) {
  const database = getDatabase()
  const [result, roles, arrangements] = await Promise.all([
    loadPage<typeof portfolioInquiries.$inferSelect>(
      page,
      portfolioInquiries,
      portfolioInquiries.createdAt
    ),
    database
      .select({ label: portfolioInquiries.role, count: count() })
      .from(portfolioInquiries)
      .where(eq(portfolioInquiries.type, "hire"))
      .groupBy(portfolioInquiries.role),
    database
      .select({ label: portfolioInquiries.arrangement, count: count() })
      .from(portfolioInquiries)
      .where(eq(portfolioInquiries.type, "hire"))
      .groupBy(portfolioInquiries.arrangement),
  ])

  return {
    ...result,
    stats: {
      roles: normalizeInquiryStats(roles, roleInquiryOptions),
      arrangements: normalizeInquiryStats(
        arrangements,
        arrangementInquiryOptions
      ),
    },
    items: result.items.map((inquiry) => ({
      ...inquiry,
      createdAt: inquiry.createdAt.toISOString(),
    })),
  }
}

export async function loadOwnerConversations(page: number) {
  const result = await loadPage<typeof assistantExchanges.$inferSelect>(
    page,
    assistantExchanges,
    assistantExchanges.createdAt
  )
  return {
    ...result,
    items: result.items.map(serializeExchange),
  }
}

export async function loadOwnerComments(page: number) {
  const result = await loadPage<typeof blogComments.$inferSelect>(
    page,
    blogComments,
    blogComments.createdAt
  )
  return {
    ...result,
    items: result.items.map((comment) => ({
      ...comment,
      createdAt: comment.createdAt.toISOString(),
    })),
  }
}

export type OwnerDashboardData = Awaited<ReturnType<typeof loadOwnerDashboard>>
