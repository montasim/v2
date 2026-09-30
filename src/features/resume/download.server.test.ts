import { afterEach, describe, expect, it, vi } from "vitest"
import { downloadResume } from "./download.server"

afterEach(() => vi.unstubAllGlobals())

describe("resume download", () => {
  it("returns the Drive PDF as an attachment without redirecting", async () => {
    const pdf = "%PDF-1.5\nresume contents"
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(pdf, {
        headers: {
          "Content-Disposition":
            'attachment; filename="Mohammad_Montasim_Al_Mamun_Shuvo_Resume.pdf"',
        },
      })
    )
    vi.stubGlobal("fetch", fetchMock)

    const response = await downloadResume()

    expect(response.status).toBe(200)
    expect(response.headers.get("Content-Type")).toBe("application/pdf")
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="Mohammad_Montasim_Al_Mamun_Shuvo_Resume.pdf"'
    )
    expect(response.headers.get("Location")).toBeNull()
    expect(await response.text()).toBe(pdf)
    const url = fetchMock.mock.calls[0][0] as URL
    expect(url.hostname).toBe("drive.google.com")
    expect(url.searchParams.get("export")).toBe("download")
    expect(url.searchParams.get("id")).toBe("1v0RP3PyBB6KdsfXhonIHJXU-wgAUSIRT")
  })

  it.each([
    [
      'inline; filename="Updated Resume.pdf"',
      'attachment; filename="Updated Resume.pdf"',
    ],
    [
      "attachment; filename*=UTF-8''R%C3%A9sum%C3%A9.pdf",
      "attachment; filename*=UTF-8''R%C3%A9sum%C3%A9.pdf",
    ],
    [null, 'attachment; filename="resume.pdf"'],
  ])(
    "preserves filename metadata while forcing a download: %s",
    async (upstream, expected) => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          new Response("%PDF-1.5", {
            headers: upstream ? { "Content-Disposition": upstream } : {},
          })
        )
      )
      const response = await downloadResume()
      expect(response.headers.get("Content-Disposition")).toBe(expected)
      expect(response.headers.get("Location")).toBeNull()
    }
  )

  it.each([
    new Response("<html>Sign in</html>"),
    new Response("Not found", { status: 404 }),
  ])(
    "does not download a Drive error or preview as a PDF",
    async (upstream) => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(upstream))
      const response = await downloadResume()
      expect(response.status).toBe(502)
      expect(response.headers.get("Content-Disposition")).toBeNull()
      expect(response.headers.get("Cache-Control")).toBe("no-store")
    }
  )

  it("handles network failures without redirecting to Drive", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("timeout")))
    const response = await downloadResume()
    expect(response.status).toBe(502)
    expect(response.headers.get("Location")).toBeNull()
  })
})
