import { mkdir, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"

import { createOpenRouterGlobalRateLimitRequests } from "@/features/chat/application/chat-rate-limit-policy"
import type { ChatProviderName } from "@/features/chat/domain/chat"
import {
  buildEvaluationCorpus,
  selectEvaluationCases,
} from "@/features/chat/evaluation/evaluation-corpus"
import type { ChatEvaluationCase } from "@/features/chat/evaluation/evaluation-corpus"
import {
  createForcedDynamicEvaluationTarget,
  runLiveEvaluation,
  serializeEvaluationReport,
} from "@/features/chat/evaluation/live-evaluation"
import {
  createEvaluationProviderHarness,
  EvaluationFatalProviderError,
} from "@/features/chat/evaluation/evaluation-provider-budget"
import { createAiProviders } from "@/features/chat/infrastructure/ai/providers.server"
import { DatabaseChatRequestLimiter } from "@/features/chat/infrastructure/chat-rate-limit.server"
import { InMemoryProviderCircuitStore } from "@/features/chat/infrastructure/provider-circuit.server"
import { getCompiledPortfolioKnowledge } from "@/features/chat/knowledge/portfolio-knowledge.server"

interface CliOptions {
  readonly limit: number
  readonly concurrency: number
  readonly caseStartsPerMinute: number
  readonly providerRequestsPerMinute: number
  readonly providerRequestsPerDay: number
  readonly category?: ChatEvaluationCase["category"]
  readonly output: string
}

export async function runLiveEvaluationCli(arguments_: readonly string[]) {
  if (arguments_.includes("--help")) {
    process.stdout.write(helpText)
    return
  }

  const options = parseOptions(arguments_)
  const configuredProviders = createAiProviders()
  const uniqueProviderNames = new Set(
    configuredProviders.map((provider) => provider.provider)
  )
  if (uniqueProviderNames.size < 2) {
    throw new Error(
      "Live chat evaluation requires two distinct providers so generation and evaluation judgment remain independent."
    )
  }
  const providerHarness = createEvaluationProviderHarness({
    providers: configuredProviders,
    limits: {
      requestsPerMinute: options.providerRequestsPerMinute,
      requestsPerDay: options.providerRequestsPerDay,
    },
    beforeCall: createSharedOpenRouterGate(new DatabaseChatRequestLimiter()),
  })
  const providers = providerHarness.providers

  const knowledge = getCompiledPortfolioKnowledge()
  const target = createForcedDynamicEvaluationTarget({
    knowledge,
    providers,
    recorder: {
      async record() {
        // The JSON report is the persistence seam for this isolated run.
      },
      async findLatest() {
        return null
      },
      async findReply() {
        return null
      },
    },
    providerCircuit: new InMemoryProviderCircuitStore(),
  })
  const eligibleCases = buildEvaluationCorpus().filter(
    (evaluationCase) =>
      !options.category || evaluationCase.category === options.category
  )
  const cases = selectEvaluationCases(
    eligibleCases,
    Math.min(options.limit, eligibleCases.length)
  )
  if (cases.length === 0) {
    throw new Error("No evaluation cases match the requested selection")
  }

  const cancellation = new AbortController()
  const cancel = () => cancellation.abort(new Error("Evaluation cancelled"))
  process.once("SIGINT", cancel)
  process.once("SIGTERM", cancel)
  try {
    const report = await runLiveEvaluation({
      target,
      judges: providers,
      providerTelemetry: providerHarness.telemetry,
      knowledge,
      cases,
      controls: {
        concurrency: options.concurrency,
        caseStartsPerMinute: options.caseStartsPerMinute,
      },
      signal: cancellation.signal,
      onCaseComplete(result, completed, total) {
        process.stderr.write(
          `[${completed}/${total}] ${result.evaluation.status.toUpperCase()} ${result.id}\n`
        )
      },
    })

    await mkdir(dirname(options.output), { recursive: true })
    await writeFile(options.output, serializeEvaluationReport(report), {
      encoding: "utf8",
      flag: "wx",
    })
    process.stdout.write(`${options.output}\n`)
  } finally {
    process.removeListener("SIGINT", cancel)
    process.removeListener("SIGTERM", cancel)
  }
}

function createSharedOpenRouterGate(limiter: DatabaseChatRequestLimiter) {
  return async (provider: ChatProviderName) => {
    if (provider !== "openrouter") return
    try {
      for (const request of createOpenRouterGlobalRateLimitRequests()) {
        const result = await limiter.consume(request)
        if (!result.allowed) {
          throw new EvaluationFatalProviderError(
            `OpenRouter shared free-tier budget is exhausted; retry after ${result.retryAfterSeconds} seconds.`
          )
        }
      }
    } catch (error) {
      if (error instanceof EvaluationFatalProviderError) throw error
      throw new EvaluationFatalProviderError(
        "OpenRouter evaluation stopped because the shared free-tier budget could not be verified."
      )
    }
  }
}

function parseOptions(arguments_: readonly string[]): CliOptions {
  const allCases = buildEvaluationCorpus()
  const limit = integerOption(arguments_, "--limit", allCases.length)
  const concurrency = integerOption(arguments_, "--concurrency", 1)
  const caseStartsPerMinute = numberOption(arguments_, "--rpm", 18)
  const providerRequestsPerMinute = numberOption(
    arguments_,
    "--provider-rpm",
    18
  )
  const providerRequestsPerDay = integerOption(
    arguments_,
    "--provider-daily-budget",
    900
  )
  const category = stringOption(arguments_, "--category")
  const validCategories = new Set(allCases.map((entry) => entry.category))
  if (
    category &&
    !validCategories.has(category as ChatEvaluationCase["category"])
  ) {
    throw new Error(`Unknown evaluation category: ${category}`)
  }
  if (limit < 1 || limit > allCases.length) {
    throw new Error(`--limit must be between 1 and ${allCases.length}`)
  }

  const defaultFilename = `${new Date().toISOString().replace(/[:.]/gu, "-")}.json`
  const output = resolve(
    stringOption(arguments_, "--output") ??
      `artifacts/chat-evaluation/${defaultFilename}`
  )
  return {
    limit,
    concurrency,
    caseStartsPerMinute,
    providerRequestsPerMinute,
    providerRequestsPerDay,
    ...(category
      ? { category: category as ChatEvaluationCase["category"] }
      : {}),
    output,
  }
}

function integerOption(
  arguments_: readonly string[],
  name: string,
  fallback: number
) {
  const value = numberOption(arguments_, name, fallback)
  if (!Number.isInteger(value)) throw new Error(`${name} must be an integer`)
  return value
}

function numberOption(
  arguments_: readonly string[],
  name: string,
  fallback: number
) {
  const value = stringOption(arguments_, name)
  if (value === undefined) return fallback
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) throw new Error(`${name} must be a number`)
  return parsed
}

function stringOption(arguments_: readonly string[], name: string) {
  const index = arguments_.indexOf(name)
  if (index < 0) return undefined
  const value = arguments_[index + 1]
  if (!value || value.startsWith("--")) {
    throw new Error(`${name} requires a value`)
  }
  return value
}

const helpText = `Portfolio chat live quality evaluation

Usage:
  pnpm chat:evaluate [options]

Options:
  --limit <1-300>       Number of deterministic non-exact cases (default: 300)
  --category <name>     Restrict the run to one of the 16 evaluation categories
  --concurrency <1-16>  Maximum concurrent cases (default: 1)
  --rpm <0-600>         Maximum case starts per minute (default: 18)
  --provider-rpm <1-18> Maximum starts per provider per minute (default: 18)
  --provider-daily-budget <1-900>
                         Maximum calls per provider during one run (default: 900)
  --output <path>       New JSON report path (default: artifacts/chat-evaluation/<time>.json)
  --help                Show this help

The runner always injects an empty exact-answer catalog. At least two distinct
providers keep generation and judgment independent. Every
provider call is paced and reported. OpenRouter retains the runtime free-model
allowlist, an 18 RPM / 900 request ceiling, and fail-closed zero-cost checks.
`
