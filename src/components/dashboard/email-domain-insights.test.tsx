// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  EmailDomainDistribution,
  EmailDomainFilterEmptyState,
  EmailDomainFilters,
} from "./email-domain-insights"

const domains = [
  { key: "gmail.com", label: "gmail.com", count: 5 },
  { key: "outlook.com", label: "outlook.com", count: 3 },
  { key: "acme.dev", label: "acme.dev", count: 2 },
]

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe("EmailDomainDistribution", () => {
  it("describes comment domains through the shared chart surface", () => {
    render(
      <EmailDomainDistribution domains={domains} kind="comments" total={10} />
    )

    expect(
      screen.getByRole("img", {
        name: /Donut chart of 10 comments: gmail.com, 5; outlook.com, 3; acme.dev, 2/,
      })
    ).not.toBeNull()
    expect(
      screen.getByRole("list", { name: "Commenter domains legend" })
    ).not.toBeNull()
  })

  it("uses subscriber-specific chart copy", () => {
    render(
      <EmailDomainDistribution
        domains={domains}
        kind="subscribers"
        total={10}
      />
    )

    expect(screen.getByText("Subscriber domains")).not.toBeNull()
    expect(
      screen.getByRole("img", { name: /Donut chart of 10 subscribers/ })
    ).not.toBeNull()
  })
})

describe("EmailDomainFilters", () => {
  it("debounces comment search while preserving the selected domain", () => {
    vi.useFakeTimers()
    const onChange = vi.fn()
    render(
      <EmailDomainFilters
        domain="acme.dev"
        domains={domains}
        kind="comments"
        query=""
        resultTotal={2}
        onChange={onChange}
      />
    )

    fireEvent.change(
      screen.getByPlaceholderText(
        "Search authors, emails, comments, or articles"
      ),
      { target: { value: "  Laravel  " } }
    )
    expect(onChange).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(300))
    expect(onChange).toHaveBeenCalledWith({
      query: "Laravel",
      domain: "acme.dev",
    })
  })

  it("changes subscriber domain and clears the search", () => {
    const onChange = vi.fn()
    render(
      <EmailDomainFilters
        domain="gmail.com"
        domains={domains}
        kind="subscribers"
        query="failed"
        resultTotal={1}
        onChange={onChange}
      />
    )

    fireEvent.click(screen.getByRole("combobox", { name: "Email domain" }))
    fireEvent.click(screen.getByRole("option", { name: "outlook.com (3)" }))
    expect(onChange).toHaveBeenLastCalledWith({
      query: "failed",
      domain: "outlook.com",
    })

    fireEvent.click(
      screen.getByRole("button", { name: "Clear subscriber search" })
    )
    expect(onChange).toHaveBeenLastCalledWith({
      query: "",
      domain: "outlook.com",
    })
  })

  it("offers recovery for both empty page variants", () => {
    const onClear = vi.fn()
    render(<EmailDomainFilterEmptyState kind="comments" onClear={onClear} />)

    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }))
    expect(onClear).toHaveBeenCalledOnce()
  })
})
