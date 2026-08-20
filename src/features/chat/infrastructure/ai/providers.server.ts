import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { createGroq } from "@ai-sdk/groq"
import { streamText } from "ai"

import type { GoogleLanguageModelOptions } from "@ai-sdk/google"

import type {
  AiProviderAdapter,
  AiStreamRequest,
} from "@/features/chat/application/ports/ai-provider"
import type { PortfolioUIMessage } from "@/features/chat/domain/chat"

export const GEMINI_MODEL_ID = "gemini-3.5-flash"
export const GROQ_MODEL_ID = "openai/gpt-oss-120b"
export const GEMINI_LANGUAGE_MODEL_OPTIONS = {
  thinkingConfig: {
    thinkingLevel: "minimal",
    includeThoughts: false,
  },
} satisfies GoogleLanguageModelOptions

class GeminiAdapter implements AiProviderAdapter {
  readonly provider = "gemini" as const
  readonly modelId = GEMINI_MODEL_ID

  async stream(request: AiStreamRequest) {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (!apiKey) throw new Error("Gemini is not configured.")

    const google = createGoogleGenerativeAI({ apiKey })
    const result = streamText({
      model: google(this.modelId),
      system: request.system,
      messages: request.messages,
      abortSignal: request.signal,
      maxOutputTokens: 500,
      maxRetries: 0,
      temperature: 0.2,
      providerOptions: {
        google: GEMINI_LANGUAGE_MODEL_OPTIONS,
      },
    })

    return result.toUIMessageStream<PortfolioUIMessage>({
      sendReasoning: false,
      sendSources: false,
    })
  }
}

class GroqAdapter implements AiProviderAdapter {
  readonly provider = "groq" as const
  readonly modelId = GROQ_MODEL_ID

  async stream(request: AiStreamRequest) {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) throw new Error("Groq is not configured.")

    const groq = createGroq({ apiKey })
    const result = streamText({
      model: groq(this.modelId),
      system: request.system,
      messages: request.messages,
      abortSignal: request.signal,
      maxOutputTokens: 500,
      maxRetries: 0,
      temperature: 0.2,
    })

    return result.toUIMessageStream<PortfolioUIMessage>({
      sendReasoning: false,
      sendSources: false,
    })
  }
}

export function createAiProviders(): readonly [
  AiProviderAdapter,
  AiProviderAdapter,
] {
  return [new GeminiAdapter(), new GroqAdapter()]
}
