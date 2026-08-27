import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { createGroq } from "@ai-sdk/groq"
import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { generateText, Output } from "ai"

import type { GoogleLanguageModelOptions } from "@ai-sdk/google"
import type { GroqLanguageModelChatOptions } from "@ai-sdk/groq"
import type { OpenRouterChatSettings } from "@openrouter/ai-sdk-provider"
import type { ProviderMetadata } from "ai"

import type {
  AiCompletionRequest,
  AiCompletionResult,
  AiCompletionUsage,
  AiProviderAdapter,
} from "@/features/chat/application/ports/ai-provider"
import type { ChatProviderName } from "@/features/chat/domain/chat"

export const OPENROUTER_FREE_MODEL_IDS = [
  "z-ai/glm-5.2:free",
  "minimax/minimax-m3:free",
  "minimax/minimax-m2.7:free",
  "google/gemma-4-31b-it:free",
  "google/gemma-4-26b-a4b-it:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "dots-studio/dots-3-note-preview:free",
] as const
export type OpenRouterFreeModelId = (typeof OPENROUTER_FREE_MODEL_IDS)[number]

export const OPENROUTER_MODEL_ID: OpenRouterFreeModelId =
  "minimax/minimax-m3:free"
export const GEMINI_MODEL_ID = "gemini-3.5-flash"
export const GROQ_MODEL_ID = "openai/gpt-oss-120b"

export const OPENROUTER_PROVIDER_OPTIONS = {
  plugins: [],
  usage: { include: true },
  provider: {
    allow_fallbacks: true,
    require_parameters: true,
    max_price: {
      prompt: 0,
      completion: 0,
      image: 0,
      audio: 0,
      request: 0,
    },
  },
} satisfies OpenRouterChatSettings

export const GEMINI_LANGUAGE_MODEL_OPTIONS = {
  thinkingConfig: {
    thinkingLevel: "minimal",
    includeThoughts: false,
  },
} satisfies GoogleLanguageModelOptions

export const GROQ_LANGUAGE_MODEL_OPTIONS = {
  reasoningEffort: "low",
  reasoningFormat: "hidden",
} satisfies GroqLanguageModelChatOptions

export const OPENROUTER_MAX_OUTPUT_TOKENS = 2_400
export const OPENROUTER_TEMPERATURE = 0
export const GEMINI_MAX_OUTPUT_TOKENS = 2_400
export const GEMINI_TEMPERATURE = 0
export const GROQ_MAX_OUTPUT_TOKENS = 2_400
export const GROQ_TEMPERATURE = 0

export type AiProviderErrorCode =
  | "aborted"
  | "authentication"
  | "empty-response"
  | "invalid-model"
  | "not-configured"
  | "policy-violation"
  | "provider-unavailable"
  | "rate-limited"
  | "request-failed"

interface AiProviderErrorOptions {
  code: AiProviderErrorCode
  provider: ChatProviderName
  modelId: string
  message: string
  cause?: unknown
  statusCode?: number
  responseHeaders?: unknown
  data?: unknown
  responseBody?: string
  costUsd?: number
}

/** A stable error shape at the provider boundary. */
export class AiProviderError extends Error {
  override readonly name = "AiProviderError"
  readonly code: AiProviderErrorCode
  readonly provider: ChatProviderName
  readonly modelId: string
  readonly statusCode?: number
  readonly responseHeaders?: unknown
  readonly data?: unknown
  readonly responseBody?: string
  readonly costUsd?: number

  constructor(options: AiProviderErrorOptions) {
    super(options.message, { cause: options.cause })
    this.code = options.code
    this.provider = options.provider
    this.modelId = options.modelId
    this.statusCode = options.statusCode
    this.responseHeaders = options.responseHeaders
    this.data = options.data
    this.responseBody = options.responseBody
    this.costUsd = options.costUsd
  }
}

export interface OpenRouterAdapterConfig {
  apiKey: string
  modelId?: string
  /** @deprecated Only the first configured model is used. */
  modelIds?: readonly string[]
}

export interface DirectProviderAdapterConfig {
  apiKey: string
}

export interface AiProviderEnvironment {
  OPENROUTER_API_KEY?: string
  OPENROUTER?: string
  /** @deprecated Only the first entry is used; prefer OPENROUTER_FREE_MODEL. */
  OPENROUTER_FREE_MODELS?: string
  OPENROUTER_FREE_MODEL?: string
  GOOGLE_GENERATIVE_AI_API_KEY?: string
  GROQ_API_KEY?: string
}

class OpenRouterAdapter implements AiProviderAdapter {
  readonly provider = "openrouter" as const
  readonly supportsFullContextGeneration = true

  constructor(
    readonly modelId: OpenRouterFreeModelId,
    private readonly apiKey: string
  ) {}

  async complete(request: AiCompletionRequest) {
    try {
      const openrouter = createOpenRouter({
        apiKey: this.apiKey,
        compatibility: "strict",
        headers: { "X-OpenRouter-Metadata": "enabled" },
      })
      const result = await generateText({
        model: openrouter.chat(this.modelId),
        system: request.system,
        messages: request.messages,
        abortSignal: request.signal,
        maxOutputTokens: OPENROUTER_MAX_OUTPUT_TOKENS,
        maxRetries: 0,
        output: Output.json(),
        temperature: OPENROUTER_TEMPERATURE,
        providerOptions: {
          openrouter: OPENROUTER_PROVIDER_OPTIONS,
        },
      })
      const costUsd = readOpenRouterCost(result.providerMetadata)
      if (costUsd !== 0) {
        throw new AiProviderError({
          code: "policy-violation",
          provider: this.provider,
          modelId: this.modelId,
          message: "OpenRouter did not report a verified zero-cost generation.",
          costUsd,
        })
      }

      return toCompletionResult(result, this.provider, this.modelId, costUsd)
    } catch (error) {
      throw normalizeProviderError(error, this.provider, this.modelId, request)
    }
  }
}

class GeminiAdapter implements AiProviderAdapter {
  readonly provider = "gemini" as const
  readonly modelId = GEMINI_MODEL_ID
  readonly supportsFullContextGeneration = true

  constructor(private readonly apiKey: string) {}

  async complete(request: AiCompletionRequest) {
    try {
      const google = createGoogleGenerativeAI({ apiKey: this.apiKey })
      const result = await generateText({
        model: google(this.modelId),
        system: request.system,
        messages: request.messages,
        abortSignal: request.signal,
        maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
        maxRetries: 0,
        output: Output.json(),
        temperature: GEMINI_TEMPERATURE,
        providerOptions: {
          google: GEMINI_LANGUAGE_MODEL_OPTIONS,
        },
      })

      return toCompletionResult(result, this.provider, this.modelId)
    } catch (error) {
      throw normalizeProviderError(error, this.provider, this.modelId, request)
    }
  }
}

class GroqAdapter implements AiProviderAdapter {
  readonly provider = "groq" as const
  readonly modelId = GROQ_MODEL_ID
  readonly supportsFullContextGeneration = true

  constructor(private readonly apiKey: string) {}

  async complete(request: AiCompletionRequest) {
    try {
      const groq = createGroq({ apiKey: this.apiKey })
      const result = await generateText({
        model: groq(this.modelId),
        system: request.system,
        messages: request.messages,
        abortSignal: request.signal,
        maxOutputTokens: GROQ_MAX_OUTPUT_TOKENS,
        maxRetries: 0,
        output: Output.json(),
        temperature: GROQ_TEMPERATURE,
        providerOptions: {
          groq: GROQ_LANGUAGE_MODEL_OPTIONS,
        },
      })

      return toCompletionResult(result, this.provider, this.modelId)
    } catch (error) {
      throw normalizeProviderError(error, this.provider, this.modelId, request)
    }
  }
}

export function createOpenRouterAdapter(
  config: OpenRouterAdapterConfig
): AiProviderAdapter {
  const configuredModelIds = config.modelIds ?? [
    config.modelId ?? OPENROUTER_MODEL_ID,
  ]
  assertApiKey(config.apiKey, "openrouter", configuredModelIds[0] ?? "")
  const modelId = validateOpenRouterModelId(configuredModelIds[0] ?? "")
  return new OpenRouterAdapter(modelId, config.apiKey)
}

export function createGeminiAdapter(
  config: DirectProviderAdapterConfig
): AiProviderAdapter {
  assertApiKey(config.apiKey, "gemini", GEMINI_MODEL_ID)
  return new GeminiAdapter(config.apiKey)
}

export function createGroqAdapter(
  config: DirectProviderAdapterConfig
): AiProviderAdapter {
  assertApiKey(config.apiKey, "groq", GROQ_MODEL_ID)
  return new GroqAdapter(config.apiKey)
}

export function createAiProviders(
  environment: AiProviderEnvironment = process.env
): readonly AiProviderAdapter[] {
  const providers: AiProviderAdapter[] = []
  const openRouterApiKey =
    environment.OPENROUTER_API_KEY ?? environment.OPENROUTER

  if (hasApiKey(openRouterApiKey)) {
    const modelIds = configuredOpenRouterModelIds(environment)
    providers.push(
      createOpenRouterAdapter({ apiKey: openRouterApiKey, modelIds })
    )
  }
  if (hasApiKey(environment.GOOGLE_GENERATIVE_AI_API_KEY)) {
    providers.push(
      createGeminiAdapter({ apiKey: environment.GOOGLE_GENERATIVE_AI_API_KEY })
    )
  }
  if (hasApiKey(environment.GROQ_API_KEY)) {
    providers.push(createGroqAdapter({ apiKey: environment.GROQ_API_KEY }))
  }

  return providers
}

function configuredOpenRouterModelIds(
  environment: AiProviderEnvironment
): readonly OpenRouterFreeModelId[] {
  if (environment.OPENROUTER_FREE_MODEL !== undefined) {
    return [validateOpenRouterModelId(environment.OPENROUTER_FREE_MODEL)]
  }

  if (environment.OPENROUTER_FREE_MODELS !== undefined) {
    const entries = environment.OPENROUTER_FREE_MODELS.split(",")
    const normalized = entries.map((modelId) => modelId.trim())

    if (normalized.some((modelId) => modelId.length === 0)) {
      return [validateOpenRouterModelId("")]
    }

    let selected: OpenRouterFreeModelId | undefined
    for (const modelId of normalized) {
      const validated = validateOpenRouterModelId(modelId)
      selected ??= validated
      if (validated === OPENROUTER_MODEL_ID) selected = validated
    }
    return [selected ?? validateOpenRouterModelId("")]
  }

  return [OPENROUTER_MODEL_ID]
}

export function validateOpenRouterModelId(
  modelId: string
): OpenRouterFreeModelId {
  if ((OPENROUTER_FREE_MODEL_IDS as readonly string[]).includes(modelId)) {
    return modelId as OpenRouterFreeModelId
  }

  throw new AiProviderError({
    code: "invalid-model",
    provider: "openrouter",
    modelId,
    message: "The configured OpenRouter model is not approved for free use.",
  })
}

function assertApiKey(
  apiKey: string,
  provider: ChatProviderName,
  modelId: string
): void {
  if (hasApiKey(apiKey)) return
  throw new AiProviderError({
    code: "not-configured",
    provider,
    modelId,
    message: `${provider} is not configured.`,
  })
}

function hasApiKey(value: string | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0
}

interface TextGenerationResult {
  text: string
  finishReason: string
  usage: {
    inputTokens?: number
    outputTokens?: number
    totalTokens?: number
  }
  response: {
    id: string
    modelId: string
  }
}

function toCompletionResult(
  result: TextGenerationResult,
  provider: ChatProviderName,
  requestedModelId: string,
  costUsd?: number
): AiCompletionResult {
  if (!result.text.trim()) {
    throw new AiProviderError({
      code: "empty-response",
      provider,
      modelId: requestedModelId,
      message: "The provider returned no answer.",
    })
  }

  const usage = {
    inputTokens: result.usage.inputTokens,
    outputTokens: result.usage.outputTokens,
    totalTokens: result.usage.totalTokens,
    ...(costUsd === undefined ? {} : { costUsd }),
  } satisfies AiCompletionUsage

  return {
    text: result.text,
    requestedModelId,
    servedModelId: result.response.modelId,
    finishReason: result.finishReason,
    generationId: result.response.id,
    usage,
  }
}

function readOpenRouterCost(metadata: ProviderMetadata | undefined) {
  if (!isRecord(metadata?.openrouter)) return undefined
  const usage = metadata.openrouter.usage
  if (!isRecord(usage)) return undefined
  const cost = usage.cost
  return typeof cost === "number" && Number.isFinite(cost) ? cost : undefined
}

function normalizeProviderError(
  error: unknown,
  provider: ChatProviderName,
  modelId: string,
  request: AiCompletionRequest
) {
  if (error instanceof AiProviderError) return error

  const details = isRecord(error) ? error : undefined
  const statusCode =
    typeof details?.statusCode === "number" ? details.statusCode : undefined
  const name = error instanceof Error ? error.name : undefined
  const providerCode = readProviderErrorCode(details?.data)
  const code: AiProviderErrorCode =
    request.signal?.aborted || name === "AbortError"
      ? "aborted"
      : statusCode === 401 || statusCode === 403
        ? "authentication"
        : statusCode === 402
          ? "policy-violation"
          : statusCode === 429 ||
              providerCode === "rate_limit_exceeded" ||
              (provider === "groq" && statusCode === 413)
            ? "rate-limited"
            : statusCode === 408 ||
                (statusCode !== undefined && statusCode >= 500)
              ? "provider-unavailable"
              : "request-failed"

  return new AiProviderError({
    code,
    provider,
    modelId,
    message: `${provider} generation failed.`,
    cause: error,
    statusCode,
    responseHeaders: details?.responseHeaders,
    data: details?.data,
    responseBody:
      typeof details?.responseBody === "string"
        ? details.responseBody
        : undefined,
    costUsd: typeof details?.costUsd === "number" ? details.costUsd : undefined,
  })
}

function readProviderErrorCode(data: unknown) {
  if (!isRecord(data)) return undefined
  if (typeof data.code === "string") return data.code
  return isRecord(data.error) && typeof data.error.code === "string"
    ? data.error.code
    : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}
