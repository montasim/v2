import { describe, expect, it, vi } from "vitest"

import {
  CHAT_HTTP_DEADLINE_MS,
  handlePortfolioChatRequest,
} from "@/features/chat/application/portfolio-assistant.server"
import {
  CHAT_GENERATION_DEADLINE_MS,
  ChatDynamicRateLimitError,
} from "@/features/chat/application/portfolio-chat"
import { CHAT_MODERATION_ERROR } from "@/features/chat/domain/chat-moderation"
import type {
  PortfolioChat,
  PortfolioChatReply,
} from "@/features/chat/domain/portfolio-chat"
import { InMemoryChatRequestLimiter } from "@/features/chat/infrastructure/chat-rate-limit.server"

function request(
  question = "What are Montasim's strongest technical skills?",
  headers: Record<string, string> = {}
) {
  return new Request("https://montasim.dev/api/chat", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://montasim.dev",
      "x-forwarded-for": "203.0.113.4",
      ...headers,
    },
    body: JSON.stringify({
      id: "conversation",
      messages: [
        {
          id: "question",
          role: "user",
          parts: [{ type: "text", text: question }],
        },
      ],
    }),
  })
}

function chat(): PortfolioChat {
  return {
    answer: vi.fn(async () => ({
      kind: "exact" as const,
      messageId: "answer",
      text: "A reviewed answer.",
      source: "Skills",
      evidenceIds: ["skills:frontend"] as const,
      citations: [
        {
          label: "Explore technical skills",
          href: "/skills",
          kind: "skill" as const,
        },
      ] as const,
      fallbackDepth: 0,
      attempts: [],
    })),
  }
}

const questionRecorder = {
  recordQuestion: vi.fn(async () => undefined),
}

describe("portfolio chat HTTP handler", () => {
  it("keeps the default deadline within Netlify's execution limit with delivery headroom", () => {
    expect(CHAT_HTTP_DEADLINE_MS).toBeLessThan(60_000)
    expect(
      CHAT_HTTP_DEADLINE_MS - CHAT_GENERATION_DEADLINE_MS
    ).toBeGreaterThanOrEqual(5_000)
  })

  it("adapts a fully resolved answer to the existing AI SDK UI protocol", async () => {
    const assistant = chat()
    const response = await handlePortfolioChatRequest(request(), {
      chat: assistant,
      limiter: new InMemoryChatRequestLimiter(),
      questionRecorder,
    })
    const body = await response.text()

    expect(response.status).toBe(200)
    expect(body).toContain("A reviewed answer.")
    expect(body).toContain('"responseKind":"exact"')
    expect(body).toContain('"href":"/skills"')
    expect(assistant.answer).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: "conversation",
        clientMessageId: "question",
      }),
      expect.objectContaining({
        visitorHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      })
    )
    expect(response.headers.get("cache-control")).toBe("no-store")
  })

  it("streams requested and served model provenance for generated answers", async () => {
    const assistant: PortfolioChat = {
      answer: vi.fn(async () => ({
        kind: "generated" as const,
        messageId: "answer",
        text: "A grounded generated answer.",
        source: "Experience",
        evidenceIds: ["experience:current"] as const,
        citations: [
          {
            label: "View professional experience",
            href: "/experience",
            kind: "experience" as const,
          },
        ] as const,
        provider: "openrouter" as const,
        requestedModel: "z-ai/glm-5.2:free",
        servedModel: "z-ai/glm-5.2",
        fallbackDepth: 0,
        attempts: [],
      })),
    }

    const response = await handlePortfolioChatRequest(request(), {
      chat: assistant,
      limiter: new InMemoryChatRequestLimiter(),
      questionRecorder,
    })
    const body = await response.text()

    expect(response.status).toBe(200)
    expect(body).toContain('"requestedModel":"z-ai/glm-5.2:free"')
    expect(body).toContain('"servedModel":"z-ai/glm-5.2"')
  })

  it("returns a usable stream when providers cannot produce a verified answer", async () => {
    const assistant: PortfolioChat = {
      answer: vi.fn(async () => ({
        kind: "handoff" as const,
        messageId: "answer",
        text: "I couldn't prepare a fully verified answer right now.",
        source: "Portfolio contact",
        evidenceIds: [] as const,
        citations: [] as const,
        contactAction: "general" as const,
        reason: "provider-unavailable" as const,
        fallbackDepth: 0,
        attempts: [],
      })),
    }

    const response = await handlePortfolioChatRequest(request(), {
      chat: assistant,
      limiter: new InMemoryChatRequestLimiter(),
      questionRecorder,
    })
    const body = await response.text()

    expect(response.status).toBe(200)
    expect(body).toContain("fully verified answer")
    expect(body).toContain('"responseKind":"handoff"')
    expect(body).toContain('"contactAction":"general"')
  })

  it("rejects cross-site, non-JSON, and oversized requests before chat", async () => {
    const assistant = chat()
    const limiter = new InMemoryChatRequestLimiter()
    const crossSite = await handlePortfolioChatRequest(
      request("question", { origin: "https://attacker.example" }),
      { chat: assistant, limiter, questionRecorder }
    )
    const nonJson = await handlePortfolioChatRequest(
      new Request("https://montasim.dev/api/chat", {
        method: "POST",
        headers: { "content-type": "text/plain" },
        body: "question",
      }),
      { chat: assistant, limiter, questionRecorder }
    )
    const oversized = await handlePortfolioChatRequest(
      request("question", { "content-length": "20000" }),
      { chat: assistant, limiter, questionRecorder }
    )

    expect(crossSite.status).toBe(403)
    expect(nonJson.status).toBe(415)
    expect(oversized.status).toBe(413)
    expect(assistant.answer).not.toHaveBeenCalled()
  })

  it("rejects offensive messages before rate limiting or chat resolution", async () => {
    const assistant = chat()
    const limiter = new InMemoryChatRequestLimiter()
    const recordQuestion = vi.fn(async () => undefined)

    const response = await handlePortfolioChatRequest(
      request("You are a fucking idiot."),
      { chat: assistant, limiter, questionRecorder: { recordQuestion } }
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: CHAT_MODERATION_ERROR,
    })
    expect(recordQuestion).toHaveBeenCalledOnce()
    expect(assistant.answer).not.toHaveBeenCalled()
  })

  it("rate-limits repeated traffic before resolving an answer", async () => {
    const assistant = chat()
    const limiter = new InMemoryChatRequestLimiter()
    const recordQuestion = vi.fn(async () => undefined)
    let response: Response | undefined
    for (let index = 0; index < 61; index += 1) {
      response = await handlePortfolioChatRequest(request(), {
        chat: assistant,
        limiter,
        questionRecorder: { recordQuestion },
      })
    }
    expect(response?.status).toBe(429)
    expect(response?.headers.get("retry-after")).toBeTruthy()
    expect(recordQuestion).toHaveBeenCalledTimes(61)
    expect(assistant.answer).toHaveBeenCalledTimes(60)
  })

  it("does not run limits or AI when the question cannot be stored", async () => {
    const assistant = chat()
    const consume = vi.fn()

    const response = await handlePortfolioChatRequest(request(), {
      chat: assistant,
      limiter: { consume },
      questionRecorder: {
        recordQuestion: vi.fn(async () => {
          throw new Error("database unavailable")
        }),
      },
    })

    expect(response.status).toBe(503)
    expect(consume).not.toHaveBeenCalled()
    expect(assistant.answer).not.toHaveBeenCalled()
  })

  it("applies only the broad HTTP limit before deep chat resolution", async () => {
    const assistant = chat()
    const consume = vi.fn(async () => ({
      allowed: true,
      retryAfterSeconds: 0,
      remaining: 199,
    }))

    const response = await handlePortfolioChatRequest(
      request("How does PostCraft preserve idempotency during recovery?"),
      {
        chat: assistant,
        limiter: { consume },
        questionRecorder,
      }
    )

    expect(response.status).toBe(200)
    expect(consume).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ scope: "all-10m", limit: 60 })
    )
    expect(consume).toHaveBeenCalledOnce()
  })

  it("maps a deep dynamic limit to a retryable 429 response", async () => {
    const recordQuestion = vi.fn(async () => undefined)
    const assistant: PortfolioChat = {
      answer: vi.fn(async () => {
        throw new ChatDynamicRateLimitError(37)
      }),
    }

    const response = await handlePortfolioChatRequest(request(), {
      chat: assistant,
      limiter: new InMemoryChatRequestLimiter(),
      questionRecorder: { recordQuestion },
    })

    expect(response.status).toBe(429)
    expect(response.headers.get("retry-after")).toBe("37")
    expect(recordQuestion).toHaveBeenCalledWith({
      conversationId: "conversation",
      clientMessageId: "question",
      question: "What are Montasim's strongest technical skills?",
    })
  })

  it("ends the whole request before the serverless execution deadline", async () => {
    const assistant: PortfolioChat = {
      answer: vi.fn(() => new Promise<PortfolioChatReply>(() => undefined)),
    }

    const response = await handlePortfolioChatRequest(request(), {
      chat: assistant,
      limiter: new InMemoryChatRequestLimiter(),
      questionRecorder,
      deadlineMs: 10,
    })

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({
      error: "The assistant is temporarily unavailable.",
    })
  })
})
