// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { ProjectReadmeDocument } from "./project-readme-document"

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe("ProjectReadmeDocument", () => {
  it("renders a private project's local README without making a request", () => {
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)

    render(
      <ProjectReadmeDocument
        source={{
          kind: "local",
          markdown: "# Private project\n\nPortfolio-safe documentation.",
        }}
      />
    )

    expect(
      screen.getByRole("heading", { name: "Private project" })
    ).toBeTruthy()
    expect(screen.getByText("Portfolio-safe documentation.")).toBeTruthy()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("loads a public README and resolves repository-relative resources", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(
          "# Public project\n\n[Guide](docs/guide.md)\n\n![Preview](images/preview.png)",
          { status: 200 }
        )
      )
    vi.stubGlobal("fetch", fetchMock)

    render(
      <ProjectReadmeDocument
        source={{
          kind: "remote",
          branch: "main",
          readmeUrl:
            "https://raw.githubusercontent.com/example/project/main/README.md",
          sourceBaseUrl: "https://github.com/example/project/blob/main",
          rawBaseUrl: "https://raw.githubusercontent.com/example/project/main",
        }}
      />
    )

    expect(
      await screen.findByRole("heading", { name: "Public project" })
    ).toBeTruthy()
    expect(
      screen.getByRole("link", { name: "Guide" }).getAttribute("href")
    ).toBe("https://github.com/example/project/blob/main/docs/guide.md")
    expect(
      screen.getByRole("img", { name: "Preview" }).getAttribute("src")
    ).toBe(
      "https://raw.githubusercontent.com/example/project/main/images/preview.png"
    )
    expect(fetchMock).toHaveBeenCalledWith(
      "https://raw.githubusercontent.com/example/project/main/README.md",
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    )
  })

  it("offers a retry when a remote README cannot be loaded", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("Unavailable", { status: 503 }))
      .mockResolvedValueOnce(new Response("# Recovered", { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)

    render(
      <ProjectReadmeDocument
        source={{
          kind: "remote",
          branch: "main",
          readmeUrl:
            "https://raw.githubusercontent.com/example/project/main/README.md",
          sourceBaseUrl: "https://github.com/example/project/blob/main",
          rawBaseUrl: "https://raw.githubusercontent.com/example/project/main",
        }}
      />
    )

    expect(
      await screen.findByRole("heading", { name: "README unavailable" })
    ).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Retry" }))
    expect(
      await screen.findByRole("heading", { name: "Recovered" })
    ).toBeTruthy()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
