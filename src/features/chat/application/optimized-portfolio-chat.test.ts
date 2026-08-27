import { beforeAll, describe, expect, it, vi } from "vitest"

import { createPortfolioChat } from "@/features/chat/application/portfolio-chat"
import type {
  AiCompletionResult,
  AiProviderAdapter,
} from "@/features/chat/application/ports/ai-provider"
import type { ChatExchangeRecorder } from "@/features/chat/application/ports/chat-exchange-recorder"
import type { ChatRequestLimiter } from "@/features/chat/application/ports/chat-request-limiter"
import type { ChatProviderName } from "@/features/chat/domain/chat"
import { InMemoryProviderCircuitStore } from "@/features/chat/infrastructure/provider-circuit.server"
import type { PortfolioExactAnswerCatalog } from "@/features/chat/knowledge/exact-answer-catalog"
import { getCompiledPortfolioKnowledge } from "@/features/chat/knowledge/portfolio-knowledge.server"
import type { CompiledPortfolioKnowledge } from "@/features/chat/knowledge/portfolio-knowledge.server"

const currentRoleFactId =
  "experience:experience-mymedicalhub-senior-software-engineer"

const validDraft = JSON.stringify({
  interpretation: "The visitor wants the current role and its scope.",
  mode: "answer",
  claims: [
    {
      text: "Montasim currently works as a Senior Software Engineer at MyMedicalHub International Ltd. His documented scope includes a finite-state-machine biometric engine, real-time pose-analysis pipelines, a Redux Toolkit medical-chatbot rewrite, and a Presentational/Container refactor. That combination demonstrates hands-on ownership across frontend architecture, reliability, real-time AI, and maintainability.",
      type: "synthesis",
      factIds: [currentRoleFactId],
    },
  ],
})

let knowledge: CompiledPortfolioKnowledge

beforeAll(() => {
  knowledge = getCompiledPortfolioKnowledge()
})

function provider(
  providerName: ChatProviderName,
  output: string,
  options: {
    costUsd?: number
    supportsFullContextGeneration?: boolean
  } = {}
): AiProviderAdapter {
  const modelId =
    providerName === "openrouter"
      ? "z-ai/glm-5.2:free"
      : `${providerName}-test-model`
  return {
    provider: providerName,
    modelId,
    ...(options.supportsFullContextGeneration === undefined
      ? {}
      : {
          supportsFullContextGeneration: options.supportsFullContextGeneration,
        }),
    complete: vi.fn(async (): Promise<AiCompletionResult> => ({
      text: output,
      requestedModelId: modelId,
      servedModelId: modelId,
      usage: {
        inputTokens: 2_000,
        outputTokens: 120,
        ...(providerName === "openrouter"
          ? { costUsd: options.costUsd ?? 0 }
          : {}),
      },
    })),
  }
}

function noExactAnswers(): PortfolioExactAnswerCatalog {
  return Object.freeze({
    knowledgeHash: knowledge.hash,
    find: () => undefined,
  })
}

function recorder(): ChatExchangeRecorder {
  return {
    record: vi.fn(async () => undefined),
    findLatest: vi.fn(async () => null),
    findReply: vi.fn(async () => null),
  }
}

function allowAllLimiter(): ChatRequestLimiter {
  return {
    consume: vi.fn(async () => ({
      allowed: true,
      remaining: 100,
      retryAfterSeconds: 1,
    })),
  }
}

function createChat(providers: readonly AiProviderAdapter[]) {
  return createPortfolioChat({
    knowledge,
    exactAnswers: noExactAnswers(),
    providers,
    recorder: recorder(),
    requestLimiter: allowAllLimiter(),
    providerCircuit: new InMemoryProviderCircuitStore(),
    createId: () => "generated-id",
  })
}

const question =
  "What position does Montasim hold now, and what does its scope involve?"

describe("optimized portfolio chat orchestration", () => {
  it("returns a valid OpenRouter generation without spending a reviewer call", async () => {
    const openrouter = provider("openrouter", validDraft, { costUsd: 0 })
    const gemini = provider("gemini", "reviewer must not be called")
    const chat = createChat([openrouter, gemini])

    const reply = await chat.answer(
      { conversationId: "focused", question },
      { visitorHash: "visitor" }
    )

    expect(reply).toMatchObject({
      kind: "generated",
      provider: "openrouter",
      fallbackDepth: 0,
    })
    expect(openrouter.complete).toHaveBeenCalledOnce()
    expect(gemini.complete).not.toHaveBeenCalled()
    const request = vi.mocked(openrouter.complete).mock.calls[0][0]
    expect(request.system.length).toBeLessThan(40_000)
    expect(request.system).not.toContain(knowledge.toon)
    expect(request.system).toContain(currentRoleFactId)
    expect(reply.attempts.map((attempt) => attempt.stage)).toEqual([
      "generation",
    ])
  })

  it("falls through OpenRouter and Gemini to Groq generation", async () => {
    const openrouter = provider("openrouter", "not-json", { costUsd: 0 })
    const gemini = provider("gemini", "also-not-json")
    const groq = provider("groq", validDraft, {
      supportsFullContextGeneration: false,
    })
    const chat = createChat([openrouter, gemini, groq])

    const reply = await chat.answer(
      { conversationId: "fallback", question },
      { visitorHash: "visitor" }
    )

    expect(reply).toMatchObject({
      kind: "generated",
      provider: "groq",
      fallbackDepth: 2,
    })
    expect(
      reply.attempts.map(({ provider: attemptProvider, stage, outcome }) => ({
        provider: attemptProvider,
        stage,
        outcome,
      }))
    ).toEqual([
      { provider: "openrouter", stage: "generation", outcome: "rejected" },
      { provider: "gemini", stage: "generation", outcome: "rejected" },
      { provider: "groq", stage: "generation", outcome: "accepted" },
    ])
  })
})
