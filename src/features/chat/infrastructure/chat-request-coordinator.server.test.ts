import type { SQL } from "drizzle-orm"
import { PgDialect } from "drizzle-orm/pg-core"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ChatRequestPendingError } from "@/features/chat/application/ports/chat-request-coordinator"
import {
  DatabaseChatRequestCoordinator,
  InMemoryChatRequestCoordinator,
} from "@/features/chat/infrastructure/chat-request-coordinator.server"

const database = vi.hoisted(() => {
  const returning = vi.fn(async () => [{ leaseToken: "lease-token" }])
  const onConflictDoUpdate = vi.fn((_config: unknown) => ({ returning }))
  const values = vi.fn(() => ({ onConflictDoUpdate }))
  const insert = vi.fn(() => ({ values }))
  const where = vi.fn(async () => undefined)
  const set = vi.fn(() => ({ where }))
  const update = vi.fn(() => ({ set }))

  return {
    returning,
    onConflictDoUpdate,
    values,
    insert,
    where,
    set,
    update,
  }
})

vi.mock("@/db/client.server", () => ({
  getDatabase: () => database,
}))

function request(work: () => Promise<string>) {
  return {
    conversationId: "conversation",
    clientMessageId: "message",
    findCompleted: async () => null,
    work,
  }
}

describe("InMemoryChatRequestCoordinator", () => {
  it("shares active work across concurrent requests with the same key", async () => {
    let release: ((value: string) => void) | undefined
    const work = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          release = resolve
        })
    )
    const coordinator = new InMemoryChatRequestCoordinator()

    const owner = coordinator.run(request(work))
    const waiter = coordinator.run(request(work))
    await vi.waitFor(() => expect(work).toHaveBeenCalledOnce())
    release?.("accepted reply")

    await expect(Promise.all([owner, waiter])).resolves.toEqual([
      "accepted reply",
      "accepted reply",
    ])
    expect(work).toHaveBeenCalledOnce()
  })

  it("releases failed work so a later request can retry", async () => {
    const coordinator = new InMemoryChatRequestCoordinator()
    const failure = new Error("record failed")

    await expect(
      coordinator.run(request(async () => Promise.reject(failure)))
    ).rejects.toBe(failure)
    await expect(
      coordinator.run(request(async () => "retried reply"))
    ).resolves.toBe("retried reply")
  })

  it("bounds how long a waiter follows work owned by another request", async () => {
    const coordinator = new InMemoryChatRequestCoordinator({ waitMs: 5 })
    let release: ((value: string) => void) | undefined
    const work = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          release = resolve
        })
    )

    const owner = coordinator.run(request(work))
    const waiter = coordinator.run(request(work))
    await expect(waiter).rejects.toBeInstanceOf(ChatRequestPendingError)
    release?.("accepted reply")
    await expect(owner).resolves.toBe("accepted reply")
    expect(work).toHaveBeenCalledOnce()
  })

  it("does not combine equal client message ids from different conversations", async () => {
    const coordinator = new InMemoryChatRequestCoordinator()
    const work = vi.fn(async () => "reply")

    await Promise.all([
      coordinator.run(request(work)),
      coordinator.run({
        ...request(work),
        conversationId: "other-conversation",
      }),
    ])

    expect(work).toHaveBeenCalledTimes(2)
  })
})

describe("DatabaseChatRequestCoordinator", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    database.returning.mockResolvedValue([{ leaseToken: "lease-token" }])
  })

  it("reclaims a completed request whose durable reply is no longer usable", async () => {
    const findCompleted = vi.fn(async () => null)
    const work = vi.fn(async () => "fresh reply")
    const coordinator = new DatabaseChatRequestCoordinator()

    await expect(
      coordinator.run({
        conversationId: "conversation",
        clientMessageId: "message",
        findCompleted,
        work,
      })
    ).resolves.toBe("fresh reply")

    const conflict = database.onConflictDoUpdate.mock.calls[0]?.[0] as
      { setWhere?: SQL } | undefined
    const condition = new PgDialect().sqlToQuery(conflict!.setWhere!)
    expect(condition.params).toContain("completed")
  })

  it("returns a reply published during completed-request reacquisition instead of repeating work", async () => {
    const findCompleted = vi
      .fn<() => Promise<string | null>>()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce("reply published by the first owner")
    const work = vi.fn(async () => "duplicate reply")
    const coordinator = new DatabaseChatRequestCoordinator()

    await expect(
      coordinator.run({
        conversationId: "conversation",
        clientMessageId: "message",
        findCompleted,
        work,
      })
    ).resolves.toBe("reply published by the first owner")

    expect(work).not.toHaveBeenCalled()
  })
})
