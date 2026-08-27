import { and, desc, eq, inArray } from "drizzle-orm"

import { assistantExchanges } from "@/db/schema"
import { getDatabase } from "@/db/client.server"
import type {
  ChatExchange,
  ChatExchangeRecorder,
  ChatKnowledgeScope,
  ChatReplyLookup,
} from "@/features/chat/application/ports/chat-exchange-recorder"
import type { PortfolioCitation } from "@/features/chat/domain/portfolio-citations"
import type {
  PortfolioChatReply,
  ProviderAttemptTrace,
} from "@/features/chat/domain/portfolio-chat"

export class DatabaseChatExchangeRecorder implements ChatExchangeRecorder {
  async record(exchange: ChatExchange) {
    const { reply } = exchange
    const storedQuestion = exchange.clientMessageId
      ? await this.findStoredQuestion(
          exchange.conversationId,
          exchange.clientMessageId
        )
      : null
    if (
      storedQuestion !== null &&
      normalizeReplayQuestion(storedQuestion) !==
        normalizeReplayQuestion(exchange.question)
    ) {
      throw new ChatReplayConflictError()
    }
    const acceptedAttempt = reply.attempts.find(
      (attempt) => attempt.outcome === "accepted"
    )
    const values = {
      id: reply.messageId,
      conversationId: exchange.conversationId,
      clientMessageId: exchange.clientMessageId,
      question: exchange.question,
      answer: reply.text,
      source: reply.source,
      responseKind: reply.kind,
      contactAction: reply.contactAction ?? null,
      handoffReason: reply.kind === "handoff" ? reply.reason : null,
      provider: reply.kind === "generated" ? (reply.provider ?? null) : null,
      model: reply.kind === "generated" ? (reply.requestedModel ?? null) : null,
      servedModel:
        reply.kind === "generated" ? (reply.servedModel ?? null) : null,
      usedFallback: reply.fallbackDepth > 0,
      fallbackDepth: reply.fallbackDepth,
      citations: reply.citations,
      evidenceIds: reply.evidenceIds,
      retrievalMetadata: exchange.retrievalMetadata ?? null,
      providerAttempts: reply.attempts,
      validationStatus: "accepted",
      latencyMs: exchange.latencyMs,
      inputTokens: acceptedAttempt?.inputTokens ?? null,
      outputTokens: acceptedAttempt?.outputTokens ?? null,
      costUsd:
        acceptedAttempt?.costUsd === undefined
          ? null
          : String(acceptedAttempt.costUsd),
      policyVersion: exchange.policyVersion,
      // The existing column is intentionally retained during the operational
      // cutover. It stores the compiled knowledge hash, not a retrieval corpus
      // version, for focused-evidence exchanges.
      corpusVersion: exchange.knowledgeHash,
    }
    const insert = getDatabase().insert(assistantExchanges).values(values)
    if (exchange.clientMessageId) {
      const rows = await insert
        .onConflictDoUpdate({
          target: [
            assistantExchanges.conversationId,
            assistantExchanges.clientMessageId,
          ],
          set: values,
          setWhere: eq(
            assistantExchanges.question,
            storedQuestion ?? exchange.question
          ),
        })
        .returning({ id: assistantExchanges.id })
      if (!rows[0]) throw new ChatReplayConflictError()
      return
    }
    await insert
  }

  private async findStoredQuestion(
    conversationId: string,
    clientMessageId: string
  ) {
    const rows = await getDatabase()
      .select({ question: assistantExchanges.question })
      .from(assistantExchanges)
      .where(
        and(
          eq(assistantExchanges.conversationId, conversationId),
          eq(assistantExchanges.clientMessageId, clientMessageId)
        )
      )
      .limit(1)
    return rows.at(0)?.question ?? null
  }

  async findLatest(conversationId: string, scope: ChatKnowledgeScope) {
    const rows = await getDatabase()
      .select({
        question: assistantExchanges.question,
        answer: assistantExchanges.answer,
      })
      .from(assistantExchanges)
      .where(
        and(
          eq(assistantExchanges.conversationId, conversationId),
          eq(assistantExchanges.validationStatus, "accepted"),
          eq(assistantExchanges.policyVersion, scope.policyVersion),
          eq(assistantExchanges.corpusVersion, scope.knowledgeHash),
          inArray(assistantExchanges.responseKind, ["exact", "generated"])
        )
      )
      .orderBy(desc(assistantExchanges.createdAt))
      .limit(1)
    return rows.at(0) ?? null
  }

  async findReply({
    conversationId,
    clientMessageId,
    question,
    scope,
  }: ChatReplyLookup): Promise<PortfolioChatReply | null> {
    const rows = await getDatabase()
      .select()
      .from(assistantExchanges)
      .where(
        and(
          eq(assistantExchanges.conversationId, conversationId),
          eq(assistantExchanges.clientMessageId, clientMessageId)
        )
      )
      .limit(1)
    const exchange = rows.at(0)
    if (!exchange) return null

    if (
      normalizeReplayQuestion(exchange.question) !==
      normalizeReplayQuestion(question)
    ) {
      throw new ChatReplayConflictError()
    }
    if (
      exchange.validationStatus !== "accepted" ||
      exchange.policyVersion !== scope.policyVersion ||
      exchange.corpusVersion !== scope.knowledgeHash
    ) {
      return null
    }

    const common = {
      messageId: exchange.id,
      text: exchange.answer,
      source: exchange.source,
      citations: parseCitations(exchange.citations),
      evidenceIds: exchange.evidenceIds ?? [],
      fallbackDepth: exchange.fallbackDepth,
      attempts: (exchange.providerAttempts ??
        []) as readonly ProviderAttemptTrace[],
    }
    if (exchange.responseKind === "handoff") {
      return {
        ...common,
        kind: "handoff" as const,
        citations: [] as const,
        evidenceIds: [] as const,
        contactAction: parseContactAction(exchange.contactAction),
        reason: parseHandoffReason(exchange.handoffReason),
      }
    }
    const citations = common.citations
    const evidenceIds = common.evidenceIds
    if (!citations[0] || !evidenceIds[0]) return null
    if (
      exchange.responseKind !== "exact" &&
      exchange.responseKind !== "generated"
    ) {
      return null
    }
    const kind = exchange.responseKind
    return {
      ...common,
      kind,
      citations: citations as [PortfolioCitation, ...PortfolioCitation[]],
      evidenceIds: evidenceIds as [string, ...string[]],
      contactAction:
        exchange.contactAction === "hire" ||
        exchange.contactAction === "project" ||
        exchange.contactAction === "funding"
          ? exchange.contactAction
          : undefined,
      provider:
        exchange.provider === "openrouter" ||
        exchange.provider === "gemini" ||
        exchange.provider === "groq"
          ? exchange.provider
          : undefined,
      requestedModel: exchange.model ?? undefined,
      servedModel: exchange.servedModel ?? undefined,
    }
  }
}

export class ChatReplayConflictError extends Error {
  readonly code = "chat-replay-conflict"

  constructor() {
    super("A client message ID cannot be reused for a different question.")
    this.name = "ChatReplayConflictError"
  }
}

function normalizeReplayQuestion(value: string) {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ")
}

function parseContactAction(value: string | null) {
  if (
    value === "hire" ||
    value === "project" ||
    value === "funding" ||
    value === "general"
  ) {
    return value
  }
  return "general"
}

function parseHandoffReason(value: string | null) {
  if (
    value === "contact-intent" ||
    value === "insufficient-evidence" ||
    value === "unsafe-question" ||
    value === "provider-unavailable"
  ) {
    return value
  }
  return "provider-unavailable"
}

function parseCitations(
  value: readonly { label: string; href: string; kind: string }[] | null
): readonly PortfolioCitation[] {
  return (value ?? []).flatMap((citation) =>
    citation.kind === "project" ||
    citation.kind === "case-study" ||
    citation.kind === "blog" ||
    citation.kind === "experience" ||
    citation.kind === "skill" ||
    citation.kind === "page"
      ? [{ ...citation, kind: citation.kind }]
      : []
  )
}
