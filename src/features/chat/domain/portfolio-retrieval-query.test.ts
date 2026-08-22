import { describe, expect, it } from "vitest"

import { buildPortfolioRetrievalQuery } from "@/features/chat/domain/portfolio-retrieval-query"

describe("portfolio retrieval query", () => {
  it("uses the latest question when there is no earlier user turn", () => {
    expect(
      buildPortfolioRetrievalQuery(
        [
          {
            id: "current",
            role: "user",
            parts: [{ type: "text", text: "What has he built?" }],
          },
        ],
        "What has he built?"
      )
    ).toBe("What has he built?")
  })

  it("adds the previous user question without treating the prior answer as evidence", () => {
    const query = buildPortfolioRetrievalQuery(
      [
        {
          id: "previous-question",
          role: "user",
          parts: [
            {
              type: "text",
              text: "What did he build with a finite state machine?",
            },
          ],
        },
        {
          id: "previous-answer",
          role: "assistant",
          parts: [{ type: "text", text: "An untrusted generated answer." }],
        },
        {
          id: "current-question",
          role: "user",
          parts: [
            {
              type: "text",
              text: "What user-visible symptoms did that problem cause?",
            },
          ],
        },
      ],
      "What user-visible symptoms did that problem cause?"
    )

    expect(query).toContain("finite state machine")
    expect(query).toContain("Current follow-up")
    expect(query).not.toContain("untrusted generated answer")
  })

  it("removes the portfolio owner's name when enough intent remains", () => {
    const query = buildPortfolioRetrievalQuery(
      [
        {
          id: "current",
          role: "user",
          parts: [
            {
              type: "text",
              text: "What formal education and certifications support Montasim's engineering background?",
            },
          ],
        },
      ],
      "What formal education and certifications support Montasim's engineering background?"
    )

    expect(query).not.toContain("Montasim")
    expect(query).toContain("education and certifications")
  })

  it("preserves a short profile question whose subject is the useful intent", () => {
    expect(
      buildPortfolioRetrievalQuery(
        [
          {
            id: "current",
            role: "user",
            parts: [{ type: "text", text: "Who is Montasim?" }],
          },
        ],
        "Who is Montasim?"
      )
    ).toBe("Who is Montasim?")
  })
})
