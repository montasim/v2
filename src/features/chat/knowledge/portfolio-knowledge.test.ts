import { decode } from "@toon-format/toon"
import { describe, expect, it } from "vitest"

import {
  compilePortfolioKnowledge,
  getCompiledPortfolioKnowledge,
} from "@/features/chat/knowledge/portfolio-knowledge.server"

describe("PortfolioKnowledge", () => {
  it("compiles every authoritative portfolio catalog into deterministic citation-ready knowledge", () => {
    const first = compilePortfolioKnowledge()
    const second = compilePortfolioKnowledge()

    expect(first.sourceManifest.sources).toEqual([
      expect.objectContaining({ id: "profile", recordCount: 1 }),
      expect.objectContaining({ id: "experience", recordCount: 7 }),
      expect.objectContaining({ id: "projects", recordCount: 33 }),
      expect.objectContaining({ id: "casestudy", recordCount: 33 }),
      expect.objectContaining({ id: "blog", recordCount: 34 }),
      expect.objectContaining({ id: "certifications", recordCount: 47 }),
      expect.objectContaining({ id: "contributions", recordCount: 1 }),
      expect.objectContaining({ id: "education", recordCount: 3 }),
      expect.objectContaining({ id: "organizations", recordCount: 3 }),
      expect.objectContaining({ id: "recommendations", recordCount: 16 }),
      expect.objectContaining({ id: "skills", recordCount: 11 }),
      expect.objectContaining({ id: "volunteering", recordCount: 2 }),
    ])
    expect(
      first.sourceManifest.sources.every((source) =>
        /^[a-f0-9]{64}$/.test(source.hash)
      )
    ).toBe(true)
    expect(first.hash).toMatch(/^[a-f0-9]{64}$/)
    expect(first.hash).toBe(second.hash)
    expect(first.toon).toBe(second.toon)

    const decoded = decode(first.toon) as {
      evidence: unknown[]
      citationTargets: unknown[]
      relationships: unknown[]
    }
    expect(decoded.evidence).toHaveLength(first.facts.length)
    expect(decoded.citationTargets).toHaveLength(first.citations.length)
    expect(decoded.relationships).toHaveLength(first.relationships.length)
  })

  it("keeps source records tied to stable evidence IDs and direct citations", () => {
    const knowledge = compilePortfolioKnowledge()

    const experience = knowledge.findFact(
      "experience:experience-mymedicalhub-senior-software-engineer"
    )
    expect(experience).toMatchObject({
      source: "experience",
      recordId: "experience-mymedicalhub-senior-software-engineer",
      evidenceRole: "first-party-portfolio",
      citationId: "experience:experience-mymedicalhub-senior-software-engineer",
    })
    expect(
      knowledge.textForFact(
        "experience:experience-mymedicalhub-senior-software-engineer"
      )
    ).toContain("99.9% reliability")
    expect(knowledge.findCitation(experience?.citationId ?? "")).toEqual({
      id: "experience:experience-mymedicalhub-senior-software-engineer",
      source: "experience",
      recordId: "experience-mymedicalhub-senior-software-engineer",
      label: "Senior Software Engineer at MyMedicalHub International Ltd.",
      href: "/experience#experience-mymedicalhub-senior-software-engineer",
    })

    const architecture = knowledge.findFact("case-study:postcraft:architecture")
    expect(architecture?.citationId).toBe("case-study:postcraft:architecture")
    expect(knowledge.findCitation(architecture?.citationId ?? "")?.href).toBe(
      "/projects/postcraft#architecture"
    )

    const recommendation = knowledge.findFact("recommendation:0:shoriful-islam")
    expect(recommendation?.evidenceRole).toBe("professional-observation")
    expect(knowledge.findCitation(recommendation?.citationId ?? "")?.href).toBe(
      "https://www.linkedin.com/in/montasim/details/recommendations/"
    )
  })

  it("connects BugReceipt project, case-study, and article evidence to citations", () => {
    const knowledge = compilePortfolioKnowledge()
    const project = knowledge.findFact("project:project-bugreceipt")

    expect(project).toMatchObject({
      source: "projects",
      recordId: "project-bugreceipt",
      evidenceRole: "first-party-portfolio",
      citationId: "project:project-bugreceipt",
    })
    expect(knowledge.textForFact(project?.id ?? "")).toContain(
      "privacy-filtered console"
    )
    expect(knowledge.findCitation(project?.citationId ?? "")?.href).toBe(
      "/projects#project-bugreceipt"
    )
    expect(
      knowledge.findCitation("case-study:bugreceipt:architecture")?.href
    ).toBe("/projects/bugreceipt#architecture")

    const articleEvidence = knowledge.findFact(
      "blog:reproducible-bug-reports-without-default-surveillance:problem"
    )
    expect(articleEvidence?.supportingFactIds).toEqual([
      "case-study:bugreceipt",
      "case-study:bugreceipt:problem",
    ])
    expect(
      knowledge.findCitation(articleEvidence?.citationId ?? "")?.href
    ).toBe(
      "/blog/reproducible-bug-reports-without-default-surveillance#problem"
    )

    expect(knowledge.relationships).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "relationship:casestudy:bugreceipt:documents:project-bugreceipt",
          kind: "documents",
        }),
        expect.objectContaining({
          id: "relationship:blog:reproducible-bug-reports-without-default-surveillance:explains:project-bugreceipt",
          kind: "explains",
        }),
        expect.objectContaining({
          id: "relationship:blog:reproducible-bug-reports-without-default-surveillance:derived-from:bugreceipt",
          kind: "derived-from",
        }),
      ])
    )
  })

  it("connects 1Snap project, case-study, and article evidence to citations", () => {
    const knowledge = compilePortfolioKnowledge()
    const project = knowledge.findFact("project:project-1snap")

    expect(project).toMatchObject({
      source: "projects",
      recordId: "project-1snap",
      evidenceRole: "first-party-portfolio",
      citationId: "project:project-1snap",
    })
    expect(knowledge.textForFact(project?.id ?? "")).toContain(
      "complete web pages"
    )
    expect(knowledge.findCitation(project?.citationId ?? "")?.href).toBe(
      "/projects#project-1snap"
    )
    expect(knowledge.findCitation("case-study:1snap:architecture")?.href).toBe(
      "/projects/1snap#architecture"
    )

    const articleEvidence = knowledge.findFact(
      "blog:full-page-screenshots-without-cloud-capture:problem"
    )
    expect(articleEvidence?.supportingFactIds).toEqual([
      "case-study:1snap",
      "case-study:1snap:problem",
    ])
    expect(
      knowledge.findCitation(articleEvidence?.citationId ?? "")?.href
    ).toBe("/blog/full-page-screenshots-without-cloud-capture#problem")

    expect(knowledge.relationships).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "relationship:casestudy:1snap:documents:project-1snap",
          kind: "documents",
        }),
        expect.objectContaining({
          id: "relationship:blog:full-page-screenshots-without-cloud-capture:explains:project-1snap",
          kind: "explains",
        }),
        expect.objectContaining({
          id: "relationship:blog:full-page-screenshots-without-cloud-capture:derived-from:1snap",
          kind: "derived-from",
        }),
      ])
    )
  })

  it("keeps the complete prompt packet compact with record-level evidence IDs", () => {
    const knowledge = compilePortfolioKnowledge()

    expect(knowledge.toon.length).toBeLessThan(400_000)
    expect(Math.ceil(knowledge.toon.length / 4)).toBeLessThan(100_000)
    expect(knowledge.findFact("project:project-postcraft")).toMatchObject({
      recordId: "project-postcraft",
      evidenceRole: "first-party-portfolio",
      citationId: "project:project-postcraft",
    })
    expect(
      knowledge.textForFact("case-study:postcraft:architecture")
    ).toContain("The Next.js application keeps HTTP boundaries")
    expect(
      knowledge.findCitation("case-study:postcraft:architecture")?.href
    ).toBe("/projects/postcraft#architecture")

    const derivedBlogEvidence = knowledge.findFact(
      "blog:video-qa-without-processing-video:problem"
    )
    expect(derivedBlogEvidence?.supportingFactIds).toEqual([
      "case-study:vidquery",
      "case-study:vidquery:problem",
    ])
    expect(
      knowledge.textForFact("blog:video-qa-without-processing-video:problem")
    ).toContain("Viewers must scrub long YouTube videos")
  })

  it("derives answer-ready facts with explicit provenance and ambiguity", () => {
    const knowledge = compilePortfolioKnowledge()

    expect(knowledge.derived.currentRole).toMatchObject({
      recordId: "experience-mymedicalhub-senior-software-engineer",
      role: "Senior Software Engineer",
      company: "MyMedicalHub International Ltd.",
      period: "Oct 2025 - Present",
    })
    expect(
      knowledge.findFact(knowledge.derived.currentRole.factId)
    ).toMatchObject({
      evidenceRole: "derived-fact",
      citationId: "experience:experience-mymedicalhub-senior-software-engineer",
    })

    expect(knowledge.derived.projectChronology[0]).toMatchObject({
      rank: 1,
      recordId: "project-1snap",
      title: "1Snap",
      historyStartedAt: "2026-08-28T05:24:40Z",
    })
    expect(knowledge.derived.latestDatedBlog).toMatchObject({
      recordId: "video-qa-without-processing-video",
      publishedAt: "2026-08-28",
      tieBreak: "catalog-order",
    })
    expect(knowledge.derived.latestDatedBlog.tiedRecordIds).toHaveLength(30)
    expect(knowledge.derived.latestDatedBlog.tiedCount).toBe(30)
    expect(
      knowledge.textForFact(knowledge.derived.latestDatedBlog.factId)
    ).toContain("30")

    expect(
      knowledge.findFact("derived:blog-content-distribution")?.data
    ).toEqual({
      total: 34,
      authored: 4,
      caseStudyDerived: 30,
    })
    expect(
      knowledge.findFact("derived:project-type-distribution")?.data
    ).toEqual({
      total: 33,
      byType: {
        api: 1,
        dataset: 2,
        extension: 5,
        package: 4,
        skill: 11,
        template: 1,
        tool: 2,
        website: 7,
      },
    })
    expect(knowledge.findFact("derived:credential-year-range")?.data).toEqual({
      count: 47,
      earliestYear: 2019,
      latestYear: 2026,
    })
    expect(
      knowledge.findFact("derived:contribution-activity-summary")?.data
    ).toMatchObject({
      totalContributions: 1824,
      recordedWeeks: 53,
      activeWeeks: 32,
      recordedDays: 366,
      activeDays: 99,
      firstDate: "2025-08-11",
      lastDate: "2026-08-11",
    })

    expect(knowledge.relationships).toContainEqual(
      expect.objectContaining({
        id: "relationship:casestudy:postcraft:documents:project-postcraft",
        fromRecordId: "casestudy:postcraft",
        kind: "documents",
        toRecordId: "projects:project-postcraft",
      })
    )
  })

  it("returns one deeply frozen cached result for production callers", () => {
    const first = getCompiledPortfolioKnowledge()
    const second = getCompiledPortfolioKnowledge()

    expect(first).toBe(second)
    expect(Object.isFrozen(first)).toBe(true)
    expect(Object.isFrozen(first.facts)).toBe(true)
    expect(Object.isFrozen(first.facts[0])).toBe(true)
    expect(Object.isFrozen(first.derived.projectChronology)).toBe(true)
  })
})
