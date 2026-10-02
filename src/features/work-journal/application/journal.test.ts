import { readFileSync } from "node:fs"
import { runInNewContext } from "node:vm"
import ts from "typescript"
import { z } from "zod"
import { beforeEach, describe, expect, it, vi } from "vitest"
import * as domain from "../domain/journal"

// Execute the real server-handler source before TanStack replaces handlers with
// transport stubs. Only framework/auth/storage boundaries are substituted.
const owner = vi.fn()
const storage = vi.fn()
const handlers: Array<(context: { data: unknown }) => Promise<unknown>> = []
const api: Record<string, unknown> = {}
const compiled = ts.transpileModule(
  readFileSync("src/features/work-journal/application/journal.ts", "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }
).outputText
runInNewContext(compiled, {
  exports: api,
  Error,
  require: (name: string) => {
    if (name === "zod") return { z }
    if (name === "../domain/journal") return domain
    if (name.includes("neon-auth.server"))
      return { requirePortfolioOwner: owner }
    if (name.includes("infrastructure/"))
      return new Proxy({}, { get: () => storage })
    if (name === "@tanstack/react-start")
      return {
        createServerFn: () => {
          const builder = {
            validator: () => builder,
            handler: (
              handler: (context: { data: unknown }) => Promise<unknown>
            ) => {
              handlers.push(handler)
              return handler
            },
          }
          return builder
        },
      }
    throw new Error(`Unexpected test import: ${name}`)
  },
})
beforeEach(() => {
  owner.mockReset()
  storage.mockReset()
})
describe("private journal server boundaries", () => {
  it("authorizes every read, mutation, export and generation before accessing data", async () => {
    expect(Object.keys(api)).toHaveLength(16)
    expect(handlers).toHaveLength(16)
    owner.mockRejectedValue(new Error("Unauthorized"))
    for (const handler of handlers)
      await expect(handler({ data: undefined })).rejects.toThrow("Unauthorized")
    expect(storage).not.toHaveBeenCalled()
  })
  it("does not expose database credentials or query contents on failure", async () => {
    owner.mockResolvedValue({ email: "owner@example.test" })
    storage.mockImplementation(() => {
      throw new Error("postgres://user:secret@database private notes")
    })
    await expect(handlers[0]({ data: undefined })).rejects.toThrow(
      "could not complete"
    )
    await expect(handlers[0]({ data: undefined })).rejects.not.toThrow("secret")
  })
})
