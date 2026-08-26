import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"

import {
  loadOwnerComments,
  loadOwnerConversations,
  loadOwnerDashboard,
  loadOwnerInquiries,
  loadOwnerSubscribers,
} from "@/features/owner-dashboard/infrastructure/dashboard.server"
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

function ownerPageQuery<T>(load: (page: number) => Promise<T>) {
  return async ({ data }: { data: z.infer<typeof ownerPageSchema> }) => {
    await requirePortfolioOwner()
    return load(data.page)
  }
}

export const getOwnerInquiries = createServerFn({ method: "GET" })
  .validator((input: unknown) => ownerPageSchema.parse(input))
  .handler(ownerPageQuery(loadOwnerInquiries))

export const getOwnerConversations = createServerFn({ method: "GET" })
  .validator((input: unknown) => ownerPageSchema.parse(input))
  .handler(ownerPageQuery(loadOwnerConversations))

export const getOwnerComments = createServerFn({ method: "GET" })
  .validator((input: unknown) => ownerPageSchema.parse(input))
  .handler(ownerPageQuery(loadOwnerComments))

export const getOwnerSubscribers = createServerFn({ method: "GET" })
  .validator((input: unknown) => ownerPageSchema.parse(input))
  .handler(ownerPageQuery(loadOwnerSubscribers))

export const getOwnerAvailability = createServerFn({ method: "GET" }).handler(
  async () => {
    await requirePortfolioOwner()
    return loadAvailabilitySettings()
  }
)
