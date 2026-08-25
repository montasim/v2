import { describe, expect, it, vi } from "vitest"

vi.mock("@tanstack/react-start", async (importOriginal) => {
  const actual = await importOriginal()
  if (typeof actual !== "object" || actual === null) {
    throw new Error("TanStack Start module could not be loaded for this test.")
  }

  return {
    ...actual,
    createCsrfMiddleware: () => undefined,
  }
})

describe("submitInquiry browser module", () => {
  it("initializes when server-only middleware factories are unavailable", async () => {
    await expect(import("./submit-inquiry")).resolves.toMatchObject({
      submitInquiry: expect.any(Function),
    })
  })
})
