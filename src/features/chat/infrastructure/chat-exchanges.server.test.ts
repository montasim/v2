import type { SQL } from "drizzle-orm"
import { PgDialect } from "drizzle-orm/pg-core"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { ChatKnowledgeScope } from "@/features/chat/application/ports/chat-exchange-recorder"
import type { PortfolioChatReply } from "@/features/chat/domain/portfolio-chat"
import {
  ChatReplayConflictError,
  DatabaseChatExchangeRecorder,
} from "@/features/chat/infrastructure/chat-exchanges.server"
import { DatabaseChatRequestCoordinator } from "@/features/chat/infrastructure/chat-request-coordinator.server"

const database = vi.hoisted(() => {
  const rows: unknown[] = []
  let pendingValues: Record<string, unknown> = {}
  const limit = vi.fn(async () => rows)
  const orderBy = vi.fn(() => ({ limit }))
  const where = vi.fn((_condition: unknown) => ({ limit, orderBy }))
  const from = vi.fn(() => ({ where }))
  const select = vi.fn(() => ({ from }))

  const onConflictDoNothing = vi.fn(async () => undefined)
  const returning = vi.fn(async () => {
    if ("answer" in pendingValues) {
      const existing = (rows.at(0) ?? {}) as Record<string, unknown>
      rows.splice(0, rows.length, { ...existing, ...pendingValues })
    }
    return [{ id: "stored-reply", leaseToken: "lease-token" }]
  })
  const onConflictDoUpdate = vi.fn(() => ({ returning }))
  const values = vi.fn((nextValues: Record<string, unknown>) => {
    pendingValues = nextValues
    return { onConflictDoNothing, onConflictDoUpdate }
  })
  const insert = vi.fn(() => ({ values }))
  const set = vi.fn(() => ({ where }))
  const update = vi.fn(() => ({ set }))

  return {
    rows,
    select,
    from,
    where,
    orderBy,
    limit,
    insert,
    values,
    onConflictDoNothing,
    onConflictDoUpdate,
    returning,
    set,
    update,
  }
})

vi.mock("@/db/client.server", () => ({
  getDatabase: () => database,
}))

const scope = {
  policyVersion: "portfolio-chat/full-context-v1",
  knowledgeHash: "a".repeat(64),
} satisfies ChatKnowledgeScope

function storedExchange(
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    id: "74d21210-a1eb-4dbb-b7cd-a508fecd017c",
    conversationId: "conversation-1",
    clientMessageId: "message-1",
    question: "What is his strongest work?",
    answer: "His strongest documented work combines reliability and speed.",
    source: "Experience",
    responseKind: "exact",
    contactAction: null,
    handoffReason: null,
    provider: null,
    model: null,
    servedModel: null,
    usedFallback: false,
    fallbackDepth: 0,
    citations: [
      {
        label: "View experience",
        href: "/experience#experience-mymedicalhub-senior",
        kind: "experience",
      },
    ],
    evidenceIds: ["experience:mymedicalhub-senior"],
    retrievalMetadata: null,
    providerAttempts: [],
    validationStatus: "accepted",
    latencyMs: 20,
    inputTokens: null,
    outputTokens: null,
    costUsd: null,
    policyVersion: scope.policyVersion,
    corpusVersion: scope.knowledgeHash,
    createdAt: new Date("2026-08-24T00:00:00.000Z"),
    ...overrides,
  }
}

function exactReply(
  overrides: Record<string, unknown> = {}
): PortfolioChatReply {
  return {
    kind: "exact",
    messageId: "74d21210-a1eb-4dbb-b7cd-a508fecd017c",
    text: "A grounded exact answer.",
    source: "Profile",
    citations: [
      {
        label: "View profile",
        href: "/#about",
        kind: "page",
      },
    ],
    evidenceIds: ["profile"],
    fallbackDepth: 0,
    attempts: [],
    ...overrides,
  }
}

describe("database chat exchange recorder", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    database.rows.length = 0
  })

  it("loads trusted history only from accepted exact or generated answers in the current knowledge scope", async () => {
    await new DatabaseChatExchangeRecorder().findLatest("conversation-1", scope)

    const condition = database.where.mock.calls[0]?.[0] as SQL | undefined
    const query = new PgDialect().sqlToQuery(condition!)

    expect(query.params).toEqual(
      expect.arrayContaining([
        "conversation-1",
        "accepted",
        scope.policyVersion,
        scope.knowledgeHash,
        "exact",
        "generated",
      ])
    )
    expect(query.params).not.toContain("common")
  })

  it("replays an exact answer only when policy, knowledge, and question match", async () => {
    database.rows.push(storedExchange())

    const reply = await new DatabaseChatExchangeRecorder().findReply({
      conversationId: "conversation-1",
      clientMessageId: "message-1",
      question: "  What   is his strongest work?  ",
      scope,
    })

    expect(reply).toMatchObject({
      kind: "exact",
      messageId: "74d21210-a1eb-4dbb-b7cd-a508fecd017c",
      evidenceIds: ["experience:mymedicalhub-senior"],
    })
  })

  it.each([
    { policyVersion: "portfolio-chat-v2" },
    { corpusVersion: "b".repeat(64) },
    { validationStatus: "legacy-unverified" },
    { responseKind: "common" },
  ])("does not replay an out-of-scope stored answer: %o", async (override) => {
    database.rows.push(storedExchange(override))

    await expect(
      new DatabaseChatExchangeRecorder().findReply({
        conversationId: "conversation-1",
        clientMessageId: "message-1",
        question: "What is his strongest work?",
        scope,
      })
    ).resolves.toBeNull()
  })

  it("rejects reuse of a client message identity for a different question", async () => {
    database.rows.push(
      storedExchange({
        validationStatus: "legacy-unverified",
        policyVersion: "portfolio-chat-v2",
      })
    )

    await expect(
      new DatabaseChatExchangeRecorder().findReply({
        conversationId: "conversation-1",
        clientMessageId: "message-1",
        question: "What is his latest project?",
        scope,
      })
    ).rejects.toBeInstanceOf(ChatReplayConflictError)

    const condition = database.where.mock.calls[0]?.[0] as SQL | undefined
    expect(new PgDialect().sqlToQuery(condition!).params).not.toContain(
      "accepted"
    )
  })

  it("stores the knowledge hash in the compatible corpus-version column", async () => {
    const reply = exactReply()

    await new DatabaseChatExchangeRecorder().record({
      conversationId: "conversation-1",
      clientMessageId: "message-1",
      question: "Introduce him.",
      reply,
      latencyMs: 12,
      policyVersion: scope.policyVersion,
      knowledgeHash: scope.knowledgeHash,
    })

    expect(database.values).toHaveBeenCalledWith(
      expect.objectContaining({
        responseKind: "exact",
        policyVersion: scope.policyVersion,
        corpusVersion: scope.knowledgeHash,
      })
    )
  })

  it("replaces a same-question exchange when a new knowledge scope produces a fresh reply", async () => {
    database.rows.push(
      storedExchange({
        policyVersion: "portfolio-chat/full-context-v0",
        corpusVersion: "b".repeat(64),
      })
    )

    await new DatabaseChatExchangeRecorder().record({
      conversationId: "conversation-1",
      clientMessageId: "message-1",
      question: "What is his strongest work?",
      reply: exactReply({
        messageId: "f6c51366-a741-4fe6-b86a-74840508c82a",
        text: "The fresh, current-scope answer.",
      }),
      latencyMs: 14,
      policyVersion: scope.policyVersion,
      knowledgeHash: scope.knowledgeHash,
    })

    expect(database.onConflictDoUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        set: expect.objectContaining({
          answer: "The fresh, current-scope answer.",
          policyVersion: scope.policyVersion,
          corpusVersion: scope.knowledgeHash,
          contactAction: null,
          inputTokens: null,
          outputTokens: null,
          costUsd: null,
        }),
        setWhere: expect.anything(),
      })
    )
  })

  it("refuses to replace an exchange when the client message id belongs to a different question", async () => {
    database.rows.push(storedExchange())

    await expect(
      new DatabaseChatExchangeRecorder().record({
        conversationId: "conversation-1",
        clientMessageId: "message-1",
        question: "What is his latest project?",
        reply: exactReply(),
        latencyMs: 14,
        policyVersion: scope.policyVersion,
        knowledgeHash: scope.knowledgeHash,
      })
    ).rejects.toBeInstanceOf(ChatReplayConflictError)
  })

  it("regenerates one stale completed exchange and then replays the current-scope result", async () => {
    database.rows.push(
      storedExchange({
        policyVersion: "portfolio-chat/full-context-v0",
        corpusVersion: "b".repeat(64),
      })
    )
    const recorder = new DatabaseChatExchangeRecorder()
    const coordinator = new DatabaseChatRequestCoordinator({
      waitMs: 5,
      pollMs: 1,
    })
    const lookup = {
      conversationId: "conversation-1",
      clientMessageId: "message-1",
      question: "What is his strongest work?",
      scope,
    }
    const freshReply = exactReply({
      messageId: "f6c51366-a741-4fe6-b86a-74840508c82a",
      text: "The current-scope answer.",
    })
    const work = vi.fn(async () => {
      await recorder.record({
        conversationId: lookup.conversationId,
        clientMessageId: lookup.clientMessageId,
        question: lookup.question,
        reply: freshReply,
        latencyMs: 14,
        policyVersion: scope.policyVersion,
        knowledgeHash: scope.knowledgeHash,
      })
      return freshReply
    })
    const coordinatedRequest = {
      conversationId: lookup.conversationId,
      clientMessageId: lookup.clientMessageId,
      findCompleted: () => recorder.findReply(lookup),
      work,
    }

    await expect(coordinator.run(coordinatedRequest)).resolves.toMatchObject({
      messageId: freshReply.messageId,
      text: freshReply.text,
    })
    await expect(coordinator.run(coordinatedRequest)).resolves.toMatchObject({
      messageId: freshReply.messageId,
      text: freshReply.text,
    })
    expect(work).toHaveBeenCalledOnce()

    await expect(
      coordinator.run({
        ...coordinatedRequest,
        findCompleted: () =>
          recorder.findReply({
            ...lookup,
            question: "What is his latest project?",
          }),
      })
    ).rejects.toBeInstanceOf(ChatReplayConflictError)
    expect(work).toHaveBeenCalledOnce()
  })
})
