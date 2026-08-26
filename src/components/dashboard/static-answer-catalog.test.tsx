// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { StaticAnswerCatalog } from "./static-answer-catalog"

afterEach(cleanup)

const catalog = {
  knowledgeHash: "a".repeat(64),
  records: [
    {
      id: "project:postcraft:overview",
      category: "project" as const,
      question: "What is Montasim's PostCraft project?",
      text: "PostCraft is an AI-assisted social publishing product.",
      evidenceCount: 3,
    },
    {
      id: "technical-depth:async-workflows",
      category: "technical-depth" as const,
      question: "How does Montasim design durable asynchronous workflows?",
      text: "He persists scheduling state and delegates delivery to durable queues.",
      evidenceCount: 2,
    },
    {
      id: "hiring-fit-due-diligence:full-stack-fit",
      category: "hiring-fit-due-diligence" as const,
      question: "What supports hiring Montasim for a full-stack position?",
      text: "His evidence covers frontend architecture and backend delivery.",
      evidenceCount: 4,
    },
  ],
}

describe("StaticAnswerCatalog", () => {
  it("shows the saved questions and full answers as read-only content", () => {
    render(<StaticAnswerCatalog catalog={catalog} />)

    expect(screen.getByText("Read only")).not.toBeNull()
    expect(
      screen.getByText("What is Montasim's PostCraft project?")
    ).not.toBeNull()
    expect(
      screen.getByText("PostCraft is an AI-assisted social publishing product.")
    ).not.toBeNull()
    expect(screen.getByText("3 evidence references")).not.toBeNull()
    expect(
      screen.getByRole("img", {
        name: /Donut chart of 3 static answers:/,
      })
    ).not.toBeNull()
    expect(
      screen.getByRole("list", { name: "Catalog coverage legend" })
    ).not.toBeNull()
    expect(
      screen.queryByRole("heading", { name: "Questions and answers" })
    ).toBeNull()
    const answerList = screen.getByRole("list", {
      name: "Questions and answers",
    })
    expect(answerList.className).toContain("space-y-4")
    for (const item of answerList.children) {
      expect(item.className).toContain("rounded-xl")
      expect(item.className).toContain("border")
    }
  })

  it("searches questions, answers, and record IDs", () => {
    render(<StaticAnswerCatalog catalog={catalog} />)

    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "durable queues" },
    })

    expect(
      screen.getByText(
        "How does Montasim design durable asynchronous workflows?"
      )
    ).not.toBeNull()
    expect(
      screen.queryByText("What is Montasim's PostCraft project?")
    ).toBeNull()

    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "full-stack-fit" },
    })
    expect(
      screen.getByText(
        "What supports hiring Montasim for a full-stack position?"
      )
    ).not.toBeNull()
  })

  it("filters by category and recovers from an empty result", () => {
    render(<StaticAnswerCatalog catalog={catalog} />)

    const categorySelect = screen.getByLabelText("Category")
    expect(categorySelect.className).toContain("appearance-none")
    expect(categorySelect.className).toContain("pl-3")
    expect(categorySelect.className).toContain("pr-10")

    fireEvent.change(categorySelect, {
      target: { value: "technical-depth" },
    })
    expect(
      screen.getByText(
        "How does Montasim design durable asynchronous workflows?"
      )
    ).not.toBeNull()
    expect(
      screen.queryByText("What is Montasim's PostCraft project?")
    ).toBeNull()

    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "no-result-query" },
    })
    expect(screen.getByText("No matching answers")).not.toBeNull()

    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }))
    expect(
      screen.getByText("What is Montasim's PostCraft project?")
    ).not.toBeNull()
  })

  it("uses the full record width for answer text", () => {
    render(<StaticAnswerCatalog catalog={catalog} />)

    const answer = screen.getByText(
      "PostCraft is an AI-assisted social publishing product."
    )
    expect(answer.className).toContain("w-full")
    expect(answer.className).toContain("max-w-none")
    expect(answer.className).not.toContain("max-w-[75ch]")
  })

  it("paginates the catalog without hiding answer content", () => {
    const paginatedCatalog = {
      knowledgeHash: "b".repeat(64),
      records: Array.from({ length: 13 }, (_, index) => ({
        id: `project:catalog:${index + 1}`,
        category: "project" as const,
        question: `Saved question ${index + 1}?`,
        text: `Complete saved answer ${index + 1}.`,
        evidenceCount: 1,
      })),
    }

    render(<StaticAnswerCatalog catalog={paginatedCatalog} />)

    expect(screen.getByText("Saved question 1?")).not.toBeNull()
    expect(screen.queryByText("Saved question 13?")).toBeNull()

    fireEvent.click(screen.getByRole("button", { name: "Next answers page" }))

    expect(screen.getByText("Saved question 13?")).not.toBeNull()
    expect(screen.getByText("Complete saved answer 13.")).not.toBeNull()
    expect(document.activeElement).toBe(
      screen.getByRole("list", { name: "Questions and answers" })
    )
    expect(
      screen.getByRole("navigation", { name: "Static answers pagination" })
        .textContent
    ).toContain("Showing 13–13 of 13 answers")
  })
})
