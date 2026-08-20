import { describe, expect, it } from "vitest"
import { selectPortfolioCitations } from "./portfolio-citations"

describe("portfolio citations", () => {
  it("links a named project directly to its portfolio record", () => {
    expect(
      selectPortfolioCitations("Tell me about PostCraft", "Projects")
    ).toEqual([
      {
        label: "Open PostCraft",
        href: "/projects#project-postcraft",
        kind: "project",
      },
    ])
  })

  it("supports broad impact answers with a role and representative projects", () => {
    const citations = selectPortfolioCitations(
      "Which projects best show his impact?",
      "Experience and projects"
    )

    expect(citations.map((citation) => citation.href)).toEqual([
      "/experience#experience-mymedicalhub-senior-software-engineer",
      "/projects#project-postcraft",
      "/projects#project-b4joinacompany",
    ])
  })

  it("links named skills to their evidence view", () => {
    const citations = selectPortfolioCitations(
      "What is his experience with React and Next.js?",
      "Experience, skills, and projects"
    )

    expect(citations).toContainEqual({
      label: "Explore React.js evidence",
      href: "/skills?skill=react-js#evidence",
      kind: "skill",
    })
    expect(citations).toContainEqual({
      label: "Explore Next.js evidence",
      href: "/skills?skill=next-js#evidence",
      kind: "skill",
    })
    expect(citations).toHaveLength(3)
  })

  it("does not add portfolio citations to contact-only guidance", () => {
    expect(
      selectPortfolioCitations("How can I contact him?", "Contact preferences")
    ).toEqual([])
  })
})
