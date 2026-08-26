// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { InquiryFilterEmptyState, InquiryFilters } from "./inquiry-filters"

const typeCounts = [
  { label: "hire", count: 3 },
  { label: "project", count: 2 },
  { label: "general", count: 1 },
]

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe("InquiryFilters", () => {
  it("debounces inquiry searches while preserving the selected type", () => {
    vi.useFakeTimers()
    const onChange = vi.fn()
    render(
      <InquiryFilters
        query=""
        type="project"
        typeCounts={typeCounts}
        resultTotal={2}
        onChange={onChange}
      />
    )

    fireEvent.change(
      screen.getByPlaceholderText("Search names, emails, roles, or messages"),
      { target: { value: "  Acme  " } }
    )
    expect(onChange).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(300))
    expect(onChange).toHaveBeenCalledWith({
      query: "Acme",
      type: "project",
    })
  })

  it("changes inquiry type and clears the inquiry search", () => {
    const onChange = vi.fn()
    render(
      <InquiryFilters
        query="Acme"
        type="project"
        typeCounts={typeCounts}
        resultTotal={1}
        onChange={onChange}
      />
    )

    fireEvent.click(screen.getByRole("combobox", { name: "Inquiry type" }))
    fireEvent.click(screen.getByRole("option", { name: "Role inquiries (3)" }))
    expect(onChange).toHaveBeenLastCalledWith({
      query: "Acme",
      type: "hire",
    })

    fireEvent.click(
      screen.getByRole("button", { name: "Clear inquiry search" })
    )
    expect(onChange).toHaveBeenLastCalledWith({ query: "", type: "hire" })
  })

  it("offers recovery when no inquiries match", () => {
    const onClear = vi.fn()
    render(<InquiryFilterEmptyState onClear={onClear} />)

    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }))
    expect(onClear).toHaveBeenCalledOnce()
  })
})
