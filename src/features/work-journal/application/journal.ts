import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import { requirePortfolioOwner } from "@/features/owner-auth/infrastructure/neon-auth.server"
import {
  JournalError,
  companySchema,
  projectSchema,
  entrySchema,
  historySchema,
  settingsSchema,
  reviewCreateSchema,
  dateSchema,
} from "../domain/journal"
import * as store from "../infrastructure/journal.server"
import {
  generateEntry,
  generateReviewStep,
  generationAvailability,
} from "../infrastructure/generation.server"

// Every read, write, generation and export checks the owner on the server.
async function authorized<T>(action: () => Promise<T>): Promise<T> {
  await requirePortfolioOwner()
  try {
    return await action()
  } catch (error) {
    if (error instanceof JournalError) throw error
    throw new Error(
      "The work journal could not complete this request. Your edits are still on screen. Try again, or check that journal migrations have been applied."
    )
  }
}
const idSchema = z.object({ id: z.uuid() })
const revisionSchema = idSchema.extend({
  revision: z.number().int().positive(),
})
export const getJournalSetup = createServerFn({ method: "GET" }).handler(() =>
  authorized(async () => ({
    ...(await store.loadSetup()),
    ai: generationAvailability(),
  }))
)
export const saveJournalSettings = createServerFn({ method: "POST" })
  .validator((input: unknown) => settingsSchema.parse(input))
  .handler(({ data }) => authorized(() => store.saveSettings(data)))
export const saveJournalCompany = createServerFn({ method: "POST" })
  .validator((input: unknown) => companySchema.parse(input))
  .handler(({ data }) => authorized(() => store.saveCompany(data)))
export const saveJournalProject = createServerFn({ method: "POST" })
  .validator((input: unknown) => projectSchema.parse(input))
  .handler(({ data }) => authorized(() => store.saveProject(data)))
export const getJournalEntry = createServerFn({ method: "GET" })
  .validator((input: unknown) => idSchema.parse(input))
  .handler(({ data }) => authorized(() => store.loadEntry(data.id)))
export const saveJournalEntry = createServerFn({ method: "POST" })
  .validator((input: unknown) => entrySchema.parse(input))
  .handler(({ data }) => authorized(() => store.saveEntry(data)))
export const getJournalHistory = createServerFn({ method: "GET" })
  .validator((input: unknown) => historySchema.parse(input))
  .handler(({ data }) => authorized(() => store.loadHistory(data)))
export const getReviewCandidates = createServerFn({ method: "GET" })
  .validator((input: unknown) =>
    z
      .object({
        from: dateSchema,
        to: dateSchema,
        companyId: z.uuid(),
        projectId: z.uuid().nullable(),
      })
      .refine(
        (filter) => filter.from <= filter.to,
        "End date must follow start date."
      )
      .parse(input)
  )
  .handler(({ data }) => authorized(() => store.loadReviewCandidates(data)))
export const createJournalReview = createServerFn({ method: "POST" })
  .validator((input: unknown) => reviewCreateSchema.parse(input))
  .handler(({ data }) => authorized(() => store.createReview(data)))
export const getJournalReviews = createServerFn({ method: "GET" })
  .validator((input: unknown) =>
    z.object({ page: z.number().int().positive() }).parse(input)
  )
  .handler(({ data }) => authorized(() => store.loadReviews(data.page)))
export const getJournalReview = createServerFn({ method: "GET" })
  .validator((input: unknown) => idSchema.parse(input))
  .handler(({ data }) => authorized(() => store.reviewDetail(data.id)))
export const saveJournalReview = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    revisionSchema
      .extend({
        title: z.string().trim().min(1).max(200),
        body: z.string().max(100000),
      })
      .parse(input)
  )
  .handler(({ data }) => authorized(() => store.saveReview(data)))
export const generateJournalEntry = createServerFn({ method: "POST" })
  .validator((input: unknown) => revisionSchema.parse(input))
  .handler(({ data }) => authorized(() => generateEntry(data)))
export const generateJournalReview = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    revisionSchema.extend({ restart: z.boolean().optional() }).parse(input)
  )
  .handler(({ data }) => authorized(() => generateReviewStep(data)))
export const exportWorkJournal = createServerFn({ method: "POST" }).handler(
  () => authorized(() => store.exportJournal())
)

export const addJournalPortfolioProject = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        companyId: z.uuid(),
        portfolioProjectId: z.string().min(1).max(200),
      })
      .parse(input)
  )
  .handler(({ data }) => authorized(() => store.addPortfolioProject(data)))
