import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"

import {
  loadOwnerComments,
  loadOwnerConversations,
  loadOwnerDashboard,
  loadOwnerInquiries,
  loadOwnerSubscribers,
} from "@/features/owner-dashboard/infrastructure/dashboard.server"
import { CONVERSATION_MODEL_ALL } from "@/features/owner-dashboard/domain/conversation-filters"
import { EMAIL_DOMAIN_ALL } from "@/features/owner-dashboard/domain/email-domain-filters"
import { inquiryTypeFilters } from "@/features/owner-dashboard/domain/inquiry-filters"
import { loadOwnerStaticAnswers } from "@/features/owner-dashboard/infrastructure/static-answers.server"
import { loadAvailabilitySettings } from "@/features/availability/infrastructure/settings.server"
import { requirePortfolioOwner } from "@/features/owner-auth/infrastructure/neon-auth.server"

export const getOwnerDashboard = createServerFn({ method: "GET" }).handler(
  async () => {
    await requirePortfolioOwner()
    return loadOwnerDashboard()
  }
)

const ownerPageSchema = z.object({
  page: z.coerce.number().int().positive().catch(1),
})

const ownerInquiryQuerySchema = ownerPageSchema.extend({
  query: z.string().trim().max(120).catch(""),
  type: z.enum(inquiryTypeFilters).catch("all"),
})

const ownerConversationQuerySchema = ownerPageSchema.extend({
  query: z.string().trim().max(120).catch(""),
  model: z.string().trim().max(160).catch(CONVERSATION_MODEL_ALL),
})

const ownerEmailDomainQuerySchema = ownerPageSchema.extend({
  query: z.string().trim().max(120).catch(""),
  domain: z.string().trim().max(253).catch(EMAIL_DOMAIN_ALL),
})

export const getOwnerInquiries = createServerFn({ method: "GET" })
  .validator((input: unknown) => ownerInquiryQuerySchema.parse(input))
  .handler(async ({ data }) => {
    await requirePortfolioOwner()
    return loadOwnerInquiries(data)
  })

export const getOwnerConversations = createServerFn({ method: "GET" })
  .validator((input: unknown) => ownerConversationQuerySchema.parse(input))
  .handler(async ({ data }) => {
    await requirePortfolioOwner()
    return loadOwnerConversations(data)
  })

export const getOwnerComments = createServerFn({ method: "GET" })
  .validator((input: unknown) => ownerEmailDomainQuerySchema.parse(input))
  .handler(async ({ data }) => {
    await requirePortfolioOwner()
    return loadOwnerComments(data)
  })

export const getOwnerSubscribers = createServerFn({ method: "GET" })
  .validator((input: unknown) => ownerEmailDomainQuerySchema.parse(input))
  .handler(async ({ data }) => {
    await requirePortfolioOwner()
    return loadOwnerSubscribers(data)
  })

export const getOwnerAvailability = createServerFn({ method: "GET" }).handler(
  async () => {
    await requirePortfolioOwner()
    return loadAvailabilitySettings()
  }
)

export const getOwnerStaticAnswers = createServerFn({ method: "GET" }).handler(
  async () => {
    await requirePortfolioOwner()
    return loadOwnerStaticAnswers()
  }
)
