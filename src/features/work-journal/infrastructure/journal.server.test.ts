import { readFileSync } from "node:fs"
import { PGlite } from "@electric-sql/pglite"
import { drizzle } from "drizzle-orm/pglite"
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  afterEach,
} from "vitest"
import * as schema from "@/db/schema"
import { historySchema } from "../domain/journal"
import type { EntryInput } from "../domain/journal"
import {
  addPortfolioProject,
  createReview,
  loadEntry,
  loadHistory,
  loadSetup,
  reviewDetail,
  saveCompany,
  saveEntry,
  saveProject,
  saveReview,
} from "./journal.server"
import { generateEntry, generateReviewStep } from "./generation.server"
import { eq } from "drizzle-orm"

const mocks = vi.hoisted(() => ({ getDatabase: vi.fn() }))
vi.mock("@/db/client.server", () => ({ getDatabase: mocks.getDatabase }))
const pg = new PGlite()
const db = drizzle(pg, { schema })
const companyId = "11111111-1111-4111-8111-111111111111"
const otherId = "22222222-2222-4222-8222-222222222222"
const projectId = "33333333-3333-4333-8333-333333333333"
const taskId = "44444444-4444-4444-8444-444444444444"
const entryId = "55555555-5555-4555-8555-555555555555"
const reviewId = "66666666-6666-4666-8666-666666666666"
function input(): EntryInput {
  return {
    id: entryId,
    revision: 0,
    companyId,
    projectId: null,
    workDate: "2026-10-01",
    notes: "Original notes",
    reflection: "Private reflection",
    summary: "",
    summarySourceHash: null,
    contributions: [
      {
        id: taskId,
        description: "Investigated retries",
        category: "reliability",
        status: "investigated",
        contribution: "Traced the cause",
        outcome: "",
        workKey: "PAY-42",
        evidence: [
          { label: "Regression test", url: "https://internal.test/pr/42" },
        ],
        updates: [],
      },
    ],
  }
}
async function makeCompany(id = companyId) {
  return saveCompany({
    id,
    revision: 0,
    name: "Company A",
    role: "Engineer",
    startDate: "",
    endDate: "",
    archived: false,
  })
}
async function makeReview() {
  return createReview({
    id: reviewId,
    title: "Weekly review",
    from: "2026-09-28",
    to: "2026-10-04",
    companyId,
    projectId: null,
    audience: "manager",
    includeReflections: false,
    includeLinks: false,
    selected: [{ entryId, contributionIds: [taskId] }],
  })
}
beforeAll(async () => {
  await pg.exec(readFileSync("drizzle/0013_work_journal.sql", "utf8"))
  mocks.getDatabase.mockReturnValue(db)
}, 20000)
beforeEach(async () => {
  await pg.exec(
    "truncate journal_reviews, journal_entries, journal_projects, journal_companies, journal_settings, journal_generation_usage cascade"
  )
})
afterAll(() => pg.close())
describe("journal PostgreSQL storage", () => {
  it("preloads all portfolio companies and project choices without overwriting owner edits", async () => {
    const setup = await loadSetup()
    expect(
      setup.companies.some(
        (record) => record.name === "MyMedicalHub International Ltd."
      )
    ).toBe(true)
    expect(
      setup.portfolioProjects.some((record) => record.title === "PostCraft")
    ).toBe(true)
    expect(setup.projects).toHaveLength(0)
    const current = setup.companies.find(
      (record) => record.id === setup.defaultCompanyId
    )!
    await saveCompany({
      ...current,
      name: "My renamed company",
      role: "My custom role",
      startDate: current.startDate ?? "",
      endDate: current.endDate ?? "",
      archived: true,
    })
    const reloaded = await loadSetup()
    expect(reloaded.companies).toHaveLength(setup.companies.length)
    expect(
      reloaded.companies.find((record) => record.id === current.id)
    ).toMatchObject({
      name: "My renamed company",
      role: "My custom role",
      archived: true,
    })
  })
  it("links catalog projects only to the selected company and reuses repeat selections", async () => {
    await makeCompany()
    await makeCompany(otherId)
    const selected = { companyId, portfolioProjectId: "project-postcraft" }
    const first = await addPortfolioProject(selected)
    expect((await addPortfolioProject(selected)).id).toBe(first.id)
    const other = await addPortfolioProject({ ...selected, companyId: otherId })
    expect(other.id).not.toBe(first.id)
    const edited = await saveProject({
      ...first,
      name: "Custom project name",
      description: "Owner-edited description",
    })
    expect(await addPortfolioProject(selected)).toMatchObject({
      id: first.id,
      name: edited.name,
      description: edited.description,
    })
    await saveProject({ ...edited, archived: true })
    await expect(addPortfolioProject(selected)).rejects.toThrow("archived")
    await expect(
      addPortfolioProject({ ...selected, portfolioProjectId: "not-in-catalog" })
    ).rejects.toThrow("no longer exists")
  })

  it("creates idempotent entries and rejects competing edits", async () => {
    await makeCompany()
    const first = await saveEntry(input())
    expect((await saveEntry(input())).id).toBe(first.id)
    expect((await loadHistory(historySchema.parse({}))).total).toBe(1)
    const edited = await saveEntry({
      ...input(),
      revision: first.revision,
      notes: "Updated once",
    })
    expect(edited.revision).toBe(2)
    await expect(
      saveEntry({ ...input(), revision: first.revision, notes: "Stale tab" })
    ).rejects.toThrow("another tab")
    expect((await loadEntry(entryId)).notes).toBe("Updated once")
    expect(
      (
        await saveEntry({
          ...input(),
          revision: first.revision,
          notes: "Updated once",
        })
      ).revision
    ).toBe(2)
  })
  it("rejects a project belonging to another company and prevents moving project ownership", async () => {
    await makeCompany()
    await makeCompany(otherId)
    const project = await saveProject({
      id: projectId,
      revision: 0,
      companyId: otherId,
      name: "Other project",
      description: "",
      archived: false,
    })
    await expect(saveEntry({ ...input(), projectId })).rejects.toThrow(
      "does not belong"
    )
    await expect(saveProject({ ...project, companyId })).rejects.toThrow(
      "another tab"
    )
  })
  it("combines category and status on the same task and escapes wildcard search", async () => {
    await makeCompany()
    const entry = input()
    entry.notes = "Reduced 10% load"
    entry.contributions.push({
      ...entry.contributions[0],
      id: crypto.randomUUID(),
      category: "delivery",
      status: "completed",
    })
    await saveEntry(entry)
    expect(
      (
        await loadHistory(
          historySchema.parse({ category: "reliability", status: "completed" })
        )
      ).total
    ).toBe(0)
    expect(
      (await loadHistory(historySchema.parse({ query: "10%" }))).total
    ).toBe(1)
    expect(
      (await loadHistory(historySchema.parse({ query: "10_" }))).total
    ).toBe(0)
  })
  it("snapshots only selected contributions, excluding reflections and URLs by default", async () => {
    await makeCompany()
    const entry = await saveEntry(input())
    const report = await makeReview()
    expect(report.sources[0].reflection).toBe("")
    expect(report.sources[0].contributions[0].evidence[0].url).toBe("")
    expect((await reviewDetail(report.id)).stale).toBe(false)
    await saveEntry({
      ...input(),
      revision: entry.revision,
      contributions: [
        {
          ...input().contributions[0],
          updates: [
            {
              id: crypto.randomUUID(),
              date: "2026-10-15",
              text: "No recurrence in two weeks",
            },
          ],
        },
      ],
    })
    const detail = await reviewDetail(report.id)
    expect(detail.stale).toBe(true)
    expect(detail.sources[0].contributions[0].updates).toEqual([])
    const saved = await saveReview({
      id: report.id,
      revision: report.revision,
      title: report.title,
      body: "Reviewed manually",
    })
    expect(saved.body).toBe("Reviewed manually")
    await expect(
      saveReview({
        id: report.id,
        revision: report.revision,
        title: report.title,
        body: "Old tab",
      })
    ).rejects.toThrow("another tab")
  })
  it("rejects sources outside the selected company and period", async () => {
    await makeCompany()
    await saveEntry(input())
    await expect(
      createReview({
        id: reviewId,
        title: "Wrong period",
        from: "2026-09-01",
        to: "2026-09-30",
        companyId,
        projectId: null,
        audience: "hr",
        includeReflections: false,
        includeLinks: false,
        selected: [{ entryId, contributionIds: [taskId] }],
      })
    ).rejects.toThrow("period")
  })
  it("preserves history when a company is archived", async () => {
    const company = await makeCompany()
    await saveEntry(input())
    await saveCompany({
      ...company,
      startDate: "",
      endDate: "",
      archived: true,
    })
    expect((await loadHistory(historySchema.parse({ companyId }))).total).toBe(
      1
    )
    expect(
      (await loadSetup()).companies.find((record) => record.id === companyId)
        ?.archived
    ).toBe(true)
  })
  it("allows manual reviews even when an AI source is too large", async () => {
    await makeCompany()
    const entry = input()
    entry.contributions[0].updates = Array.from({ length: 10 }, () => ({
      id: crypto.randomUUID(),
      date: "2026-10-02",
      text: "x".repeat(3000),
    }))
    await saveEntry(entry)
    await makeReview()
    const review = await reviewDetail(reviewId)
    expect(review.batchCount).toBe(0)
    expect(review.generationError).toContain("manually")
  })
})

// Exercise provider failures and optimistic draft writes against real SQL as well.
const ai = vi.hoisted(() => ({ generateText: vi.fn() }))
vi.mock("ai", () => ({
  generateText: ai.generateText,
  Output: { object: vi.fn() },
}))
afterEach(() => vi.unstubAllEnvs())
function configureAi() {
  vi.stubEnv("JOURNAL_AI_PROVIDER", "google")
  vi.stubEnv("JOURNAL_AI_MODEL", "test-model")
  vi.stubEnv("JOURNAL_AI_API_KEY", "test-only")
  ai.generateText.mockResolvedValue({
    output: {
      sections: [
        {
          heading: "Progress",
          points: [
            {
              text: "Investigated retry failures; resolution is still unknown.",
              sourceIds: [`${entryId}/${taskId}`],
            },
          ],
        },
      ],
    },
    usage: { inputTokens: 100, outputTokens: 30 },
  })
}
describe("journal generation persistence", () => {
  it("leaves notes and accepted summaries intact on provider failure", async () => {
    configureAi()
    await makeCompany()
    const entry = await saveEntry({ ...input(), summary: "My own summary" })
    ai.generateText.mockRejectedValueOnce(
      new Error("secret provider request body")
    )
    await expect(
      generateEntry({ id: entry.id, revision: entry.revision })
    ).rejects.toThrow("saved notes")
    const unchanged = await loadEntry(entry.id)
    expect(unchanged.notes).toBe("Original notes")
    expect(unchanged.summary).toBe("My own summary")
    expect(unchanged.draft).toBeNull()
    const usage = await db.select().from(schema.journalGenerationUsage)
    expect(usage[0].state).toBe("failed")
  })
  it("saves a separate draft, omits private reflections and rate-limits competing calls", async () => {
    configureAi()
    await makeCompany()
    const entry = await saveEntry({ ...input(), summary: "My own summary" })
    const generated = await generateEntry({
      id: entry.id,
      revision: entry.revision,
    })
    expect(generated.draft).toContain("Investigated retry failures")
    expect(generated.summary).toBe("My own summary")
    expect(generated.draftSourceHash).toBe(entry.sourceHash)
    expect(ai.generateText.mock.lastCall?.[0].prompt).not.toContain(
      "Private reflection"
    )
    await expect(
      generateEntry({ id: entry.id, revision: generated.revision })
    ).rejects.toThrow("five seconds")
  })
  it("does not overwrite an entry changed while the model was running", async () => {
    configureAi()
    await makeCompany()
    const entry = await saveEntry(input())
    ai.generateText.mockImplementationOnce(async () => {
      await saveEntry({
        ...input(),
        revision: entry.revision,
        notes: "A newer tab saved this",
      })
      return {
        output: {
          sections: [
            {
              heading: "Progress",
              points: [
                { text: "Investigated", sourceIds: [`${entryId}/${taskId}`] },
              ],
            },
          ],
        },
        usage: {},
      }
    })
    await expect(
      generateEntry({ id: entry.id, revision: entry.revision })
    ).rejects.toThrow("changed during generation")
    expect((await loadEntry(entry.id)).notes).toBe("A newer tab saved this")
    expect((await loadEntry(entry.id)).draft).toBeNull()
  })
  it("generates a review draft without replacing the saved report and allows resumable restart", async () => {
    configureAi()
    await makeCompany()
    await saveEntry(input())
    const report = await makeReview()
    const edited = await saveReview({
      id: report.id,
      revision: report.revision,
      title: report.title,
      body: "Already reviewed",
    })
    const generated = await generateReviewStep({
      id: report.id,
      revision: edited.revision,
    })
    expect(generated.body).toBe("Already reviewed")
    expect(generated.draft).toContain("Investigated")
    const restart = await generateReviewStep({
      id: report.id,
      revision: generated.revision,
      restart: true,
    })
    expect(restart.generatedCount).toBe(0)
    expect(restart.draft).toBe(generated.draft)
    await db
      .update(schema.journalSettings)
      .set({ nextAiAt: null })
      .where(eq(schema.journalSettings.id, "owner"))
    expect(
      (await generateReviewStep({ id: report.id, revision: restart.revision }))
        .generatedCount
    ).toBe(1)
  })
  it("rejects invented source references without saving a draft", async () => {
    configureAi()
    await makeCompany()
    const entry = await saveEntry(input())
    ai.generateText.mockResolvedValueOnce({
      output: {
        sections: [
          {
            heading: "Wins",
            points: [{ text: "Invented", sourceIds: ["unknown"] }],
          },
        ],
      },
      usage: {},
    })
    await expect(
      generateEntry({ id: entry.id, revision: entry.revision })
    ).rejects.toThrow("unknown contributions")
    expect((await loadEntry(entry.id)).draft).toBeNull()
  })
})
