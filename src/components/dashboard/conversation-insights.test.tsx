// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { CONVERSATION_MODEL_NON_MODEL } from "@/features/owner-dashboard/domain/conversation-filters"

import {
  ConversationFilterEmptyState,
  ConversationFilters,
  ConversationModelUsage,
} from "./conversation-insights"

const models = [
  {
    key: "google/gemini-2.5-flash",
    label: "google/gemini-2.5-flash",
    count: 4,
  },
  { key: "openai/gpt-oss-120b", label: "openai/gpt-oss-120b", count: 2 },
  { key: CONVERSATION_MODEL_NON_MODEL, label: "Non-model responses", count: 1 },
]

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe("ConversationModelUsage", () => {
  it("describes model usage through the existing chart surface", () => {
    render(<ConversationModelUsage models={models} total={7} />)

    expect(
      screen.getByRole("img", {
        name: /Donut chart of 7 saved exchanges.*google\/gemini-2.5-flash, 4.*Non-model responses, 1/,
      })
    ).not.toBeNull()
    expect(
      screen.getByRole("list", { name: "Model usage legend" })
    ).not.toBeNull()
  })
})

describe("ConversationFilters", () => {
  it("debounces search while preserving the selected model", () => {
    vi.useFakeTimers()
    const onChange = vi.fn()
    render(
      <ConversationFilters
        model="google/gemini-2.5-flash"
        models={models}
        query=""
        resultTotal={4}
        onChange={onChange}
      />
    )

    fireEvent.change(
      screen.getByPlaceholderText(
        "Search questions, answers, sources, or models"
      ),
      { target: { value: "  Laravel  " } }
    )
    expect(onChange).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(300))
    expect(onChange).toHaveBeenCalledWith({
      query: "Laravel",
      model: "google/gemini-2.5-flash",
    })
  })

  it("changes the model and clears the conversation search", () => {
    const onChange = vi.fn()
    render(
      <ConversationFilters
        model="google/gemini-2.5-flash"
        models={models}
        query="Laravel"
        resultTotal={2}
        onChange={onChange}
      />
    )

    fireEvent.click(screen.getByRole("combobox", { name: "Response model" }))
    fireEvent.click(
      screen.getByRole("option", { name: "openai/gpt-oss-120b (2)" })
    )
    expect(onChange).toHaveBeenLastCalledWith({
      query: "Laravel",
      model: "openai/gpt-oss-120b",
    })

    fireEvent.click(
      screen.getByRole("button", { name: "Clear conversation search" })
    )
    expect(onChange).toHaveBeenLastCalledWith({
      query: "",
      model: "openai/gpt-oss-120b",
    })
  })

  it("offers recovery when no conversations match", () => {
    const onClear = vi.fn()
    render(<ConversationFilterEmptyState onClear={onClear} />)

    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }))
    expect(onClear).toHaveBeenCalledOnce()
  })
})
