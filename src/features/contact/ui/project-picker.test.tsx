// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import { afterEach, beforeEach, expect, it, vi } from "vitest"
import { ProjectPicker } from "./project-picker"

beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  )
  HTMLElement.prototype.scrollIntoView = vi.fn()
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

it("filters projects, handles no matches, and selects a result using the keyboard", async () => {
  const onValueChange = vi.fn()
  render(
    <ProjectPicker
      id="project"
      projects={[
        { id: "bugreceipt", title: "BugReceipt" },
        { id: "mulalens", title: "MulaLens" },
      ]}
      value="bugreceipt"
      placeholder="Choose an app"
      onValueChange={onValueChange}
    />
  )
  fireEvent.click(screen.getByRole("combobox"))
  const search = screen.getByRole("combobox", {
    name: "Search apps or projects",
  })
  fireEvent.change(search, { target: { value: "missing" } })
  expect(screen.getByText("No matching apps or projects.")).toBeTruthy()
  fireEvent.change(search, { target: { value: "mula" } })
  expect(screen.queryByRole("option", { name: "BugReceipt" })).toBeNull()
  await waitFor(() =>
    expect(
      screen
        .getByRole("option", { name: "MulaLens" })
        .getAttribute("aria-selected")
    ).toBe("true")
  )
  fireEvent.keyDown(search, { key: "Enter", code: "Enter" })
  expect(onValueChange).toHaveBeenCalledWith("mulalens")
  expect(screen.queryByRole("dialog")).toBeNull()
})

it("falls back when a project icon cannot load", () => {
  const { container } = render(
    <ProjectPicker
      id="project"
      projects={[
        { id: "app", title: "App", iconUrl: "https://example.com/favicon.ico" },
      ]}
      value="app"
      placeholder="Choose an app"
      onValueChange={vi.fn()}
    />
  )
  const image = container.querySelector("img")!
  expect(image.getAttribute("src")).toBe("https://example.com/favicon.ico")
  fireEvent.error(image)
  expect(container.querySelector("img")).toBeNull()
  expect(screen.getByRole("combobox").textContent).toContain("App")
})
