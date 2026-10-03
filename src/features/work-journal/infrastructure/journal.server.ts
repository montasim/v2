import { createHash } from "node:crypto"
import {
  and,
  count,
  desc,
  eq,
  getTableColumns,
  gte,
  ilike,
  inArray,
  lte,
  or,
  sql,
} from "drizzle-orm"
import { getDatabase } from "@/db/client.server"
import {
  journalCompanies as companies,
  journalProjects as projects,
  journalEntries as entries,
  journalReviews as reviews,
  journalSettings as settings,
} from "@/db/schema"
import { JournalError, historySchema, sourceBatches } from "../domain/journal"
import type {
  EntryInput,
  HistoryFilter,
  ReviewSource,
  companySchema,
  projectSchema,
  reviewCreateSchema,
  settingsSchema,
} from "../domain/journal"
import type { z } from "zod"

import {
  portfolioCompanies,
  portfolioProjects,
  portfolioJournalId,
  currentPortfolioCompany,
} from "./portfolio-catalog.server"

const conflict = () =>
  new JournalError(
    "This record changed in another tab. Reload it before saving; your unsaved text is still here."
  )
export function entrySourceHash(
  input: Pick<
    EntryInput,
    | "companyId"
    | "projectId"
    | "workDate"
    | "notes"
    | "reflection"
    | "contributions"
  >
) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        companyId: input.companyId,
        projectId: input.projectId,
        workDate: input.workDate,
        notes: input.notes,
        reflection: input.reflection,
        contributions: input.contributions,
      })
    )
    .digest("hex")
}
export async function loadSetup() {
  const db = getDatabase()
  await db.insert(settings).values({ id: "owner" }).onConflictDoNothing()
  const [companyRows, projectRows, preferences] = await Promise.all([
    db.select().from(companies).orderBy(companies.name),
    db.select().from(projects).orderBy(projects.name),
    db
      .select({
        timezone: settings.timezone,
        weekStartsOn: settings.weekStartsOn,
      })
      .from(settings)
      .where(eq(settings.id, "owner")),
  ])
  const missing = portfolioCompanies.filter(
    (company) =>
      !companyRows.some(
        (existing) =>
          existing.id === company.id ||
          existing.name.trim().toLowerCase() === company.name.toLowerCase()
      )
  )
  if (missing.length) {
    await db.insert(companies).values(missing).onConflictDoNothing()
    // Read back concurrent inserts too, so every request gets a complete picker.
    companyRows.splice(
      0,
      companyRows.length,
      ...(await db.select().from(companies).orderBy(companies.name))
    )
  }
  const currentId = portfolioJournalId(`company:${currentPortfolioCompany}`)
  return {
    companies: companyRows,
    projects: projectRows,
    portfolioProjects,
    defaultCompanyId:
      companyRows.find(
        (company) =>
          !company.archived &&
          (company.id === currentId || company.name === currentPortfolioCompany)
      )?.id ??
      companyRows.find((company) => !company.archived)?.id ??
      "",
    settings: preferences[0],
  }
}
export async function addPortfolioProject(input: {
  companyId: string
  portfolioProjectId: string
}) {
  const db = getDatabase()
  const catalogProject = portfolioProjects.find(
    (project) => project.id === input.portfolioProjectId
  )
  if (!catalogProject)
    throw new JournalError(
      "This portfolio project no longer exists. Choose another project or add a new one."
    )
  const company = (
    await db.select().from(companies).where(eq(companies.id, input.companyId))
  ).at(0)
  if (!company || company.archived)
    throw new JournalError("Choose an active company before adding a project.")
  const id = portfolioJournalId(
    `project:${input.companyId}:${catalogProject.id}`
  )
  const existing = (
    await db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.companyId, input.companyId),
          or(
            eq(projects.id, id),
            sql`lower(trim(${projects.name})) = ${catalogProject.title.toLowerCase()}`
          )
        )
      )
  ).at(0)
  if (existing?.archived)
    throw new JournalError(
      "This project is archived. Restore it in Companies & projects first."
    )
  if (existing) return existing
  await db
    .insert(projects)
    .values({
      id,
      companyId: input.companyId,
      name: catalogProject.title,
      description: catalogProject.description,
    })
    .onConflictDoNothing()
  const saved = (
    await db.select().from(projects).where(eq(projects.id, id))
  ).at(0)
  if (!saved)
    throw new JournalError("The project could not be added. Please retry.")
  return saved
}
export async function saveSettings(input: z.infer<typeof settingsSchema>) {
  await getDatabase()
    .insert(settings)
    .values({ id: "owner", ...input })
    .onConflictDoUpdate({ target: settings.id, set: input })
  return input
}
export async function saveCompany(input: z.infer<typeof companySchema>) {
  const db = getDatabase()
  const { revision, ...fields } = input
  const values = {
    ...fields,
    startDate: input.startDate || null,
    endDate: input.endDate || null,
  }
  if (!revision) {
    const saved = (
      await db
        .insert(companies)
        .values(values)
        .onConflictDoNothing()
        .returning()
    ).at(0)
    if (saved) return saved
    const existing = (
      await db.select().from(companies).where(eq(companies.id, input.id))
    ).at(0)
    if (
      existing &&
      Object.entries(values).every(
        ([key, value]) => existing[key as keyof typeof existing] === value
      )
    )
      return existing
  } else {
    const saved = (
      await db
        .update(companies)
        .set({ ...values, revision: revision + 1 })
        .where(
          and(eq(companies.id, input.id), eq(companies.revision, revision))
        )
        .returning()
    ).at(0)
    if (saved) return saved
  }
  throw conflict()
}
export async function saveProject(input: z.infer<typeof projectSchema>) {
  const db = getDatabase()
  const company = (
    await db.select().from(companies).where(eq(companies.id, input.companyId))
  ).at(0)
  if (!company) throw new JournalError("Choose an existing company.")
  const { revision, ...values } = input
  if (!revision) {
    if (company.archived)
      throw new JournalError("Restore the company before adding a project.")
    const saved = (
      await db.insert(projects).values(values).onConflictDoNothing().returning()
    ).at(0)
    if (saved) return saved
    const existing = (
      await db.select().from(projects).where(eq(projects.id, input.id))
    ).at(0)
    if (
      existing &&
      Object.entries(values).every(
        ([key, value]) => existing[key as keyof typeof existing] === value
      )
    )
      return existing
  } else {
    // Keep project ownership stable so historical entries cannot become inconsistent.
    const saved = (
      await db
        .update(projects)
        .set({
          name: input.name,
          description: input.description,
          archived: input.archived,
          revision: revision + 1,
        })
        .where(
          and(
            eq(projects.id, input.id),
            eq(projects.companyId, input.companyId),
            eq(projects.revision, revision)
          )
        )
        .returning()
    ).at(0)
    if (saved) return saved
  }
  throw conflict()
}
export async function loadEntry(id: string) {
  const entry = (
    await getDatabase().select().from(entries).where(eq(entries.id, id))
  ).at(0)
  if (!entry) throw new JournalError("This journal entry no longer exists.")
  return entry
}
export async function saveEntry(input: EntryInput) {
  const db = getDatabase()
  const company = (
    await db.select().from(companies).where(eq(companies.id, input.companyId))
  ).at(0)
  if (!company) throw new JournalError("Choose an existing company.")
  if (input.projectId) {
    const project = (
      await db
        .select()
        .from(projects)
        .where(
          and(
            eq(projects.id, input.projectId),
            eq(projects.companyId, input.companyId)
          )
        )
    ).at(0)
    if (!project)
      throw new JournalError(
        "The selected project does not belong to this company."
      )
  }
  const { revision, ...values } = input
  const sourceHash = entrySourceHash(input)
  const saveValues = { ...values, sourceHash, updatedAt: new Date() }
  if (!revision) {
    const saved = (
      await db
        .insert(entries)
        .values(saveValues)
        .onConflictDoNothing()
        .returning()
    ).at(0)
    if (saved) return saved
  } else {
    const saved = (
      await db
        .update(entries)
        .set({ ...saveValues, revision: revision + 1 })
        .where(and(eq(entries.id, input.id), eq(entries.revision, revision)))
        .returning()
    ).at(0)
    if (saved) return saved
  }
  // Retrying a response-lost save returns the already-saved record, never duplicates it.
  const existing = await loadEntry(input.id)
  if (
    existing.sourceHash === sourceHash &&
    existing.summary === input.summary &&
    existing.summarySourceHash === input.summarySourceHash
  )
    return existing
  throw conflict()
}
function filterWhere(filter: HistoryFilter) {
  const pattern = `%${filter.query.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_")}%`
  return and(
    filter.from ? gte(entries.workDate, filter.from) : undefined,
    filter.to ? lte(entries.workDate, filter.to) : undefined,
    filter.companyId ? eq(entries.companyId, filter.companyId) : undefined,
    filter.projectId ? eq(entries.projectId, filter.projectId) : undefined,
    filter.query
      ? or(
          ilike(entries.notes, pattern),
          ilike(entries.summary, pattern),
          sql`${entries.contributions}::text ilike ${pattern}`
        )
      : undefined,
    filter.category || filter.status
      ? sql`exists (select 1 from jsonb_array_elements(${entries.contributions}) as task where ${filter.category ? sql`task->>'category' = ${filter.category}` : sql`true`} and ${filter.status ? sql`task->>'status' = ${filter.status}` : sql`true`})`
      : undefined
  )
}
export async function loadHistory(filter: HistoryFilter) {
  const db = getDatabase()
  const where = filterWhere(filter)
  const [{ total }] = await db
    .select({ total: count() })
    .from(entries)
    .where(where)
  const pageCount = Math.max(1, Math.ceil(total / 20))
  const page = Math.min(filter.page, pageCount)
  // Names come from the join so the list never depends on a possibly stale
  // client-side companies/projects list.
  const items = await db
    .select({
      ...getTableColumns(entries),
      companyName: companies.name,
      projectName: projects.name,
    })
    .from(entries)
    .innerJoin(companies, eq(companies.id, entries.companyId))
    .leftJoin(projects, eq(projects.id, entries.projectId))
    .where(where)
    .orderBy(desc(entries.workDate), desc(entries.id))
    .limit(20)
    .offset((page - 1) * 20)
  return { items, total, page, pageCount }
}
export async function loadReviewCandidates(input: {
  from: string
  to: string
  companyId: string
  projectId: string | null
}) {
  const filter = historySchema.parse({
    ...input,
    projectId: input.projectId ?? "",
  })
  const items = await getDatabase()
    .select()
    .from(entries)
    .where(filterWhere(filter))
    .orderBy(entries.workDate, entries.id)
    .limit(1001)
  if (items.length > 1000)
    throw new JournalError(
      "This period contains over 1,000 entries. Choose a project or a shorter period."
    )
  return items
}
export async function createReview(input: z.infer<typeof reviewCreateSchema>) {
  const db = getDatabase()
  const existing = await db
    .select()
    .from(reviews)
    .where(eq(reviews.id, input.id))
  if (existing[0]) return existing[0]
  const setup = await loadSetup()
  const candidates = await loadReviewCandidates(input)
  if (
    new Set(input.selected.map((selection) => selection.entryId)).size !==
    input.selected.length
  )
    throw new JournalError("Select each entry only once.")
  const sources: ReviewSource[] = input.selected.map((selection) => {
    const entry = candidates.find((item) => item.id === selection.entryId)
    if (!entry)
      throw new JournalError(
        "Selected entries must belong to this company, project and period."
      )
    const tasks = entry.contributions.filter((task) =>
      selection.contributionIds.includes(task.id)
    )
    if (tasks.length !== new Set(selection.contributionIds).size)
      throw new JournalError(
        "A selected contribution changed. Reload the source list."
      )
    return {
      entryId: entry.id,
      sourceHash: entry.sourceHash,
      workDate: entry.workDate,
      company: setup.companies.find(
        (company) => company.id === entry.companyId
      )!.name,
      project:
        setup.projects.find((project) => project.id === entry.projectId)
          ?.name ?? null,
      reflection: input.includeReflections ? entry.reflection : "",
      contributions: tasks.map((task) => ({
        ...task,
        evidence: task.evidence.map((evidence) => ({
          ...evidence,
          url: input.includeLinks ? evidence.url : "",
        })),
      })),
    }
  })
  if (JSON.stringify(sources).length > 2_000_000)
    throw new JournalError(
      "This review is too large. Choose fewer contributions."
    )
  const saved = (
    await db
      .insert(reviews)
      .values({
        id: input.id,
        title: input.title,
        from: input.from,
        to: input.to,
        companyId: input.companyId,
        audience: input.audience,
        sources,
      })
      .onConflictDoNothing()
      .returning()
  ).at(0)
  return saved ?? loadReview(input.id)
}
export async function loadReviews(page = 1) {
  const db = getDatabase()
  const [{ total }] = await db.select({ total: count() }).from(reviews)
  return {
    total,
    items: await db
      .select({
        id: reviews.id,
        title: reviews.title,
        from: reviews.from,
        to: reviews.to,
        audience: reviews.audience,
      })
      .from(reviews)
      .orderBy(desc(reviews.createdAt))
      .limit(20)
      .offset((page - 1) * 20),
  }
}
export async function loadReview(id: string) {
  const review = (
    await getDatabase().select().from(reviews).where(eq(reviews.id, id))
  ).at(0)
  if (!review) throw new JournalError("This review no longer exists.")
  return review
}
export async function reviewDetail(id: string) {
  const review = await loadReview(id)
  const current = await getDatabase()
    .select({ id: entries.id, sourceHash: entries.sourceHash })
    .from(entries)
    .where(
      inArray(
        entries.id,
        review.sources.map((source) => source.entryId)
      )
    )
  let batchCount = 0
  let generationError = ""
  try {
    batchCount = sourceBatches(review.sources).length
  } catch {
    generationError =
      "One contribution is too large for AI generation. You can still write and export this review manually."
  }
  return {
    ...review,
    generationError,
    stale: review.sources.some(
      (source) =>
        !current.some(
          (entry) =>
            entry.id === source.entryId &&
            entry.sourceHash === source.sourceHash
        )
    ),
    batchCount,
  }
}
export async function saveReview(input: {
  id: string
  revision: number
  title: string
  body: string
}) {
  const saved = (
    await getDatabase()
      .update(reviews)
      .set({
        title: input.title,
        body: input.body,
        revision: input.revision + 1,
        updatedAt: new Date(),
      })
      .where(
        and(eq(reviews.id, input.id), eq(reviews.revision, input.revision))
      )
      .returning()
  ).at(0)
  if (!saved) throw conflict()
  return reviewDetail(saved.id)
}
export async function exportJournal() {
  const db = getDatabase()
  // A consistent snapshot using the driver's HTTP batch transaction.
  const rows = await db.batch([
    db.select().from(companies),
    db.select().from(projects),
    db.select().from(entries),
    db.select().from(reviews),
    db
      .select({
        timezone: settings.timezone,
        weekStartsOn: settings.weekStartsOn,
      })
      .from(settings),
  ])
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    companies: rows[0],
    projects: rows[1],
    entries: rows[2],
    reviews: rows[3],
    settings: rows[4],
  }
}
export type JournalSetup = Awaited<ReturnType<typeof loadSetup>>
export type JournalEntry = Awaited<ReturnType<typeof loadEntry>>
export type JournalReview = Awaited<ReturnType<typeof reviewDetail>>
