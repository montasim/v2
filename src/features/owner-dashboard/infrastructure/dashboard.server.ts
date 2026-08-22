import { count, desc } from "drizzle-orm"

import { getDatabase } from "@/db/client.server"
import {
  assistantExchanges,
  blogComments,
  portfolioInquiries,
} from "@/db/schema"
import { loadAvailabilitySettings } from "@/features/availability/infrastructure/settings.server"

export const OWNER_DASHBOARD_PAGE_SIZE = 6

export type OwnerPagination = {
  page: number
  pageCount: number
  pageSize: number
  total: number
}

export type OwnerPaginatedResult<T> = OwnerPagination & {
  items: T[]
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
    conversations: conversations.map((exchange) => ({
      ...exchange,
      createdAt: exchange.createdAt.toISOString(),
    })),
    inquiries: inquiries.map((inquiry) => ({
      ...inquiry,
      createdAt: inquiry.createdAt.toISOString(),
    })),
  }
}

export async function loadOwnerInquiries(page: number) {
  const result = await loadPage<typeof portfolioInquiries.$inferSelect>(
    page,
    portfolioInquiries,
    portfolioInquiries.createdAt
  )
  return {
    ...result,
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
    items: result.items.map((exchange) => ({
      ...exchange,
      createdAt: exchange.createdAt.toISOString(),
    })),
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
