import { describe, expect, it } from "vitest"
import {
  dateSchema,
  evidenceSchema,
  periodRange,
  reportMarkdown,
  sourceBatches,
  sourceReference,
  todayIn,
} from "./journal"
import type { ReviewSource } from "./journal"

const source: ReviewSource = {
  entryId: "entry",
  sourceHash: "hash",
  workDate: "2026-10-01",
  company: "Company A",
  project: null,
  reflection: "",
  contributions: [
    {
      id: "task",
      description: "Investigated retry failures",
      category: "reliability",
      status: "investigated",
      contribution: "",
      outcome: "",
      workKey: "PAY-42",
      evidence: [],
      updates: [],
    },
  ],
}
describe("journal dates and evidence", () => {
  it("uses the owner's calendar day across UTC boundaries", () => {
    expect(todayIn("Asia/Dhaka", new Date("2026-09-30T19:00:00Z"))).toBe(
      "2026-10-01"
    )
    expect(
      todayIn("America/Los_Angeles", new Date("2026-10-01T01:00:00Z"))
    ).toBe("2026-09-30")
  })
  it("handles week boundaries across years and leap months", () => {
    expect(periodRange("week", "2027-01-01", 1)).toEqual({
      from: "2026-12-28",
      to: "2027-01-03",
    })
    expect(periodRange("week", "2026-10-01", 0)).toEqual({
      from: "2026-09-27",
      to: "2026-10-03",
    })
    expect(periodRange("month", "2024-02-20")).toEqual({
      from: "2024-02-01",
      to: "2024-02-29",
    })
    expect(periodRange("year", "2026-10-01")).toEqual({
      from: "2026-01-01",
      to: "2026-12-31",
    })
    expect(dateSchema.safeParse("2026-02-30").success).toBe(false)
  })
  it("rejects executable evidence links", () => {
    expect(
      evidenceSchema.safeParse({ label: "PR", url: "javascript:alert(1)" })
        .success
    ).toBe(false)
    expect(
      evidenceSchema.safeParse({
        label: "PR",
        url: "https://example.test/pr/1",
      }).success
    ).toBe(true)
  })
})
describe("grounded generation", () => {
  it("rejects citations that are not in the selected snapshot", () => {
    expect(() =>
      reportMarkdown(
        {
          sections: [
            {
              heading: "Progress",
              points: [{ text: "Fixed issue", sourceIds: ["invented"] }],
            },
          ],
        },
        [source]
      )
    ).toThrow("unknown contributions")
    expect(
      reportMarkdown(
        {
          sections: [
            {
              heading: "Progress",
              points: [
                {
                  text: "Investigated issue",
                  sourceIds: [sourceReference("entry", "task")],
                },
              ],
            },
          ],
        },
        [source]
      )
    ).toContain("entry/task")
  })
  it("bounds requests and keeps every contribution exactly once", () => {
    const sources = Array.from({ length: 50 }, (_, index) => ({
      ...source,
      entryId: `entry-${index}`,
    }))
    const batches = sourceBatches(sources, 1000)
    expect(batches.length).toBeGreaterThan(1)
    expect(batches.flat().map((item) => item.entryId)).toEqual(
      sources.map((item) => item.entryId)
    )
    expect(
      batches.every(
        (batch) =>
          batch.reduce((sum, item) => sum + JSON.stringify(item).length, 0) <=
          1000
      )
    ).toBe(true)
  })
})
