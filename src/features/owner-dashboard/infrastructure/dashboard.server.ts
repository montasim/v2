import { and, count, desc, eq, ilike, inArray, or, sql } from "drizzle-orm"

import { getDatabase } from "@/db/client.server"
import {
  assistantExchanges,
  blogComments,
  newsletterSubscribers,
  portfolioInquiries,
} from "@/db/schema"
import { loadAvailabilitySettings } from "@/features/availability/infrastructure/settings.server"
import {
  arrangementInquiryOptions,
  roleInquiryOptions,
} from "@/features/chat/domain/inquiry"
import {
  CONVERSATION_MODEL_ALL,
  CONVERSATION_MODEL_NON_MODEL,
  CONVERSATION_MODEL_UNKNOWN,
} from "@/features/owner-dashboard/domain/conversation-filters"
import type { OwnerConversationFilters } from "@/features/owner-dashboard/domain/conversation-filters"
import {
  EMAIL_DOMAIN_ALL,
  EMAIL_DOMAIN_UNKNOWN,
} from "@/features/owner-dashboard/domain/email-domain-filters"
import type { OwnerEmailDomainFilters } from "@/features/owner-dashboard/domain/email-domain-filters"
import type { OwnerInquiryFilters } from "@/features/owner-dashboard/domain/inquiry-filters"
import { blogCatalog } from "@/lib/content/blog"

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

function dashboardSearchPattern(query: string) {
  const escaped = query
    .replaceAll("\\", "\\\\")
    .replaceAll("%", "\\%")
    .replaceAll("_", "\\_")
  return `%${escaped}%`
}

function inquiryFilters({ query, type }: OwnerInquiryFilters) {
  const trimmedQuery = query.trim()
  const pattern = trimmedQuery ? dashboardSearchPattern(trimmedQuery) : null
  const search = pattern
    ? or(
        ilike(portfolioInquiries.name, pattern),
        ilike(portfolioInquiries.email, pattern),
        ilike(portfolioInquiries.context, pattern),
        ilike(portfolioInquiries.role, pattern),
        ilike(portfolioInquiries.arrangement, pattern),
        ilike(portfolioInquiries.projectType, pattern),
        ilike(portfolioInquiries.timeline, pattern)
      )
    : undefined
  const inquiryType =
    type === "all" ? undefined : eq(portfolioInquiries.type, type)

  return and(inquiryType, search)
}

const conversationModelKey = sql<string>`
  case
    when ${assistantExchanges.responseKind} <> 'generated'
      then '__non_model__'
    when nullif(trim(${assistantExchanges.servedModel}), '') is not null
      then ${assistantExchanges.servedModel}
    when nullif(trim(${assistantExchanges.model}), '') is not null
      then ${assistantExchanges.model}
    else '__unknown_model__'
  end
`

function conversationModelLabel(key: string) {
  if (key === CONVERSATION_MODEL_NON_MODEL) return "Non-model responses"
  if (key === CONVERSATION_MODEL_UNKNOWN) return "Unknown model"
  return key
}

function conversationFilters({ model, query }: OwnerConversationFilters) {
  const trimmedQuery = query.trim()
  const pattern = trimmedQuery ? dashboardSearchPattern(trimmedQuery) : null
  const search = pattern
    ? or(
        ilike(assistantExchanges.question, pattern),
        ilike(assistantExchanges.answer, pattern),
        ilike(assistantExchanges.source, pattern),
        ilike(assistantExchanges.conversationId, pattern),
        ilike(assistantExchanges.provider, pattern),
        ilike(assistantExchanges.model, pattern),
        ilike(assistantExchanges.servedModel, pattern),
        ilike(assistantExchanges.responseKind, pattern)
      )
    : undefined
  const modelFilter =
    model === CONVERSATION_MODEL_ALL
      ? undefined
      : eq(conversationModelKey, model)

  return and(modelFilter, search)
}

const commentEmailDomainKey = sql<string>`
  coalesce(
    nullif(lower(split_part(${blogComments.email}, '@', 2)), ''),
    '__unknown_domain__'
  )
`
const subscriberEmailDomainKey = sql<string>`
  coalesce(
    nullif(lower(split_part(${newsletterSubscribers.email}, '@', 2)), ''),
    '__unknown_domain__'
  )
`
const subscriberConfirmationLabel = sql<string>`
  case ${newsletterSubscribers.confirmationState}
    when 'sent' then 'Email sent'
    when 'failed' then 'Email failed'
    when 'sending' then 'Sending'
    else 'Pending'
  end
`

function emailDomainLabel(key: string) {
  return key === EMAIL_DOMAIN_UNKNOWN ? "Unknown domain" : key
}

function emailDomainFacets(rows: Array<{ key: string; count: number }>) {
  return rows
    .map((item) => ({
      key: item.key,
      label: emailDomainLabel(item.key),
      count: item.count,
    }))
    .sort(
      (left, right) =>
        right.count - left.count || left.label.localeCompare(right.label)
    )
}

function commentFilters({ domain, query }: OwnerEmailDomainFilters) {
  const trimmedQuery = query.trim()
  const pattern = trimmedQuery ? dashboardSearchPattern(trimmedQuery) : null
  const normalizedQuery = trimmedQuery.toLocaleLowerCase()
  const matchingPostSlugs = normalizedQuery
    ? blogCatalog.posts
        .filter((post) =>
          [post.title, post.category].some((value) =>
            value.toLocaleLowerCase().includes(normalizedQuery)
          )
        )
        .map((post) => post.slug)
    : []
  const search = pattern
    ? matchingPostSlugs.length
      ? or(
          ilike(blogComments.name, pattern),
          ilike(blogComments.email, pattern),
          ilike(blogComments.message, pattern),
          ilike(blogComments.postSlug, pattern),
          inArray(blogComments.postSlug, matchingPostSlugs)
        )
      : or(
          ilike(blogComments.name, pattern),
          ilike(blogComments.email, pattern),
          ilike(blogComments.message, pattern),
          ilike(blogComments.postSlug, pattern)
        )
    : undefined
  const domainFilter =
    domain === EMAIL_DOMAIN_ALL ? undefined : eq(commentEmailDomainKey, domain)

  return and(domainFilter, search)
}

function subscriberFilters({ domain, query }: OwnerEmailDomainFilters) {
  const trimmedQuery = query.trim()
  const pattern = trimmedQuery ? dashboardSearchPattern(trimmedQuery) : null
  const search = pattern
    ? or(
        ilike(newsletterSubscribers.email, pattern),
        ilike(subscriberConfirmationLabel, pattern),
        ilike(newsletterSubscribers.confirmationLastError, pattern)
      )
    : undefined
  const domainFilter =
    domain === EMAIL_DOMAIN_ALL
      ? undefined
      : eq(subscriberEmailDomainKey, domain)

  return and(domainFilter, search)
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

export async function loadOwnerInquiries(filters: OwnerInquiryFilters) {
  const database = getDatabase()
  const where = inquiryFilters(filters)
  const [filteredCount, roles, arrangements, inquiryTypes] = await Promise.all([
    database.select({ total: count() }).from(portfolioInquiries).where(where),
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
    database
      .select({ label: portfolioInquiries.type, count: count() })
      .from(portfolioInquiries)
      .groupBy(portfolioInquiries.type),
  ])

  const total = filteredCount[0]?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / OWNER_DASHBOARD_PAGE_SIZE))
  const page = Math.min(Math.max(1, filters.page), pageCount)
  const items = await database
    .select()
    .from(portfolioInquiries)
    .where(where)
    .orderBy(desc(portfolioInquiries.createdAt))
    .limit(OWNER_DASHBOARD_PAGE_SIZE)
    .offset((page - 1) * OWNER_DASHBOARD_PAGE_SIZE)
  const inquiryTypeCounts = new Map(
    inquiryTypes.map((item) => [item.label, item.count])
  )

  return {
    allTotal: inquiryTypes.reduce((sum, item) => sum + item.count, 0),
    facets: {
      types: ["hire", "project", "general"].map((label) => ({
        label,
        count: inquiryTypeCounts.get(label) ?? 0,
      })),
    },
    page,
    pageCount,
    pageSize: OWNER_DASHBOARD_PAGE_SIZE,
    total,
    stats: {
      roles: normalizeInquiryStats(roles, roleInquiryOptions),
      arrangements: normalizeInquiryStats(
        arrangements,
        arrangementInquiryOptions
      ),
    },
    items: items.map((inquiry) => ({
      ...inquiry,
      createdAt: inquiry.createdAt.toISOString(),
    })),
  }
}

export async function loadOwnerConversations(
  filters: OwnerConversationFilters
) {
  const database = getDatabase()
  const where = conversationFilters(filters)
  const [filteredCount, modelCounts] = await Promise.all([
    database.select({ total: count() }).from(assistantExchanges).where(where),
    database
      .select({ key: conversationModelKey, count: count() })
      .from(assistantExchanges)
      .groupBy(conversationModelKey),
  ])

  const total = filteredCount[0]?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / OWNER_DASHBOARD_PAGE_SIZE))
  const page = Math.min(Math.max(1, filters.page), pageCount)
  const items = await database
    .select()
    .from(assistantExchanges)
    .where(where)
    .orderBy(desc(assistantExchanges.createdAt))
    .limit(OWNER_DASHBOARD_PAGE_SIZE)
    .offset((page - 1) * OWNER_DASHBOARD_PAGE_SIZE)
  const models = modelCounts
    .map((item) => ({
      key: item.key,
      label: conversationModelLabel(item.key),
      count: item.count,
    }))
    .sort(
      (left, right) =>
        right.count - left.count || left.label.localeCompare(right.label)
    )

  return {
    allTotal: modelCounts.reduce((sum, item) => sum + item.count, 0),
    facets: { models },
    page,
    pageCount,
    pageSize: OWNER_DASHBOARD_PAGE_SIZE,
    total,
    items: items.map(serializeExchange),
  }
}

export async function loadOwnerComments(filters: OwnerEmailDomainFilters) {
  const database = getDatabase()
  const where = commentFilters(filters)
  const [filteredCount, domainCounts] = await Promise.all([
    database.select({ total: count() }).from(blogComments).where(where),
    database
      .select({ key: commentEmailDomainKey, count: count() })
      .from(blogComments)
      .groupBy(commentEmailDomainKey),
  ])

  const total = filteredCount[0]?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / OWNER_DASHBOARD_PAGE_SIZE))
  const page = Math.min(Math.max(1, filters.page), pageCount)
  const items = await database
    .select()
    .from(blogComments)
    .where(where)
    .orderBy(desc(blogComments.createdAt))
    .limit(OWNER_DASHBOARD_PAGE_SIZE)
    .offset((page - 1) * OWNER_DASHBOARD_PAGE_SIZE)

  return {
    allTotal: domainCounts.reduce((sum, item) => sum + item.count, 0),
    facets: { domains: emailDomainFacets(domainCounts) },
    page,
    pageCount,
    pageSize: OWNER_DASHBOARD_PAGE_SIZE,
    total,
    items: items.map((comment) => ({
      ...comment,
      createdAt: comment.createdAt.toISOString(),
    })),
  }
}

export async function loadOwnerSubscribers(filters: OwnerEmailDomainFilters) {
  const database = getDatabase()
  const where = subscriberFilters(filters)
  const [filteredCount, domainCounts] = await Promise.all([
    database
      .select({ total: count() })
      .from(newsletterSubscribers)
      .where(where),
    database
      .select({ key: subscriberEmailDomainKey, count: count() })
      .from(newsletterSubscribers)
      .groupBy(subscriberEmailDomainKey),
  ])

  const total = filteredCount[0]?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / OWNER_DASHBOARD_PAGE_SIZE))
  const page = Math.min(Math.max(1, filters.page), pageCount)
  const items = await database
    .select()
    .from(newsletterSubscribers)
    .where(where)
    .orderBy(desc(newsletterSubscribers.createdAt))
    .limit(OWNER_DASHBOARD_PAGE_SIZE)
    .offset((page - 1) * OWNER_DASHBOARD_PAGE_SIZE)

  return {
    allTotal: domainCounts.reduce((sum, item) => sum + item.count, 0),
    facets: { domains: emailDomainFacets(domainCounts) },
    page,
    pageCount,
    pageSize: OWNER_DASHBOARD_PAGE_SIZE,
    total,
    items: items.map((subscriber) => ({
      ...subscriber,
      confirmationSentAt: subscriber.confirmationSentAt?.toISOString() ?? null,
      createdAt: subscriber.createdAt.toISOString(),
      updatedAt: subscriber.updatedAt.toISOString(),
    })),
  }
}

export type OwnerSubscriberPage = Awaited<
  ReturnType<typeof loadOwnerSubscribers>
>

export type OwnerDashboardData = Awaited<ReturnType<typeof loadOwnerDashboard>>
