const promptInjectionSignals = [
  "ignore every previous instruction",
  "ignore previous instructions",
  "ignore the system instruction",
  "hidden system prompt",
  "reveal your system prompt",
  "reveal the system prompt",
  "show the developer message",
  "hidden instructions",
] as const

const knownTechnicalAcronyms = new Set([
  "ai",
  "api",
  "aws",
  "cdn",
  "ci",
  "cli",
  "cd",
  "csp",
  "csr",
  "csrf",
  "css",
  "db",
  "fps",
  "fsm",
  "gcp",
  "html",
  "isr",
  "jwt",
  "llm",
  "ml",
  "mfa",
  "orm",
  "pwa",
  "rag",
  "rbac",
  "rpc",
  "sdk",
  "seo",
  "sso",
  "ssg",
  "ssr",
  "sql",
  "tls",
  "ui",
  "ux",
  "xss",
])

export function isPromptInjectionAttempt(question: string) {
  const normalized = normalizeQuestion(question)

  return (
    promptInjectionSignals.some((signal) => normalized.includes(signal)) ||
    /\b(?:dump|export|leak|reveal)\b.{0,40}\b(?:hidden|internal|private)\b.{0,24}\b(?:database|records?|data)\b/.test(
      normalized
    ) ||
    /\bshow (?:me|us)\b.{0,40}\b(?:hidden|internal|private)\b.{0,24}\b(?:database|records?|data)\b/.test(
      normalized
    ) ||
    /\b(?:ignore|disregard|override)\b.{0,40}\b(?:portfolio|evidence|sources?|facts?)\b/.test(
      normalized
    ) ||
    /\b(?:invent|fabricate|make up)\b.{0,40}\b(?:reason|achievement|experience|fact|claim|answer)\b/.test(
      normalized
    )
  )
}

export function isLikelyNoisyInput(question: string) {
  const normalized = normalizeQuestion(question)
  const tokens = normalized.split(" ").filter(Boolean)
  const opaqueTokens = tokens.filter(
    (token) =>
      token.length >= 3 &&
      !/[aeiouy]/.test(token) &&
      !knownTechnicalAcronyms.has(token)
  )
  const hasStandaloneNumber = tokens.some((token) => /^\d+$/.test(token))
  const hasRepeatedPunctuation = /[?!#]{3,}/.test(question)
  const isOpaqueSpam =
    opaqueTokens.length >= 3 && opaqueTokens.length / tokens.length >= 0.5
  const hasMixedNoiseSignature =
    tokens.length >= 6 &&
    opaqueTokens.length >= 1 &&
    hasStandaloneNumber &&
    hasRepeatedPunctuation

  return isOpaqueSpam || hasMixedNoiseSignature
}

function normalizeQuestion(question: string) {
  return question
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
}
