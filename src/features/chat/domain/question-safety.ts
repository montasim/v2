const promptInjectionSignals = [
  "ignore every previous instruction",
  "ignore previous instructions",
  "ignore the system instruction",
  "hidden system prompt",
  "reveal your system prompt",
  "reveal the system prompt",
  "show the developer message",
  "hidden instructions",
  "private database",
  "database records",
] as const

const unpublishedDetailSignals = [
  "favorite",
  "favourite",
  "hobby",
  "hobbies",
  "weekend",
  "salary",
  "compensation",
  "direct reports",
  "team size",
  "largest engineering team",
] as const

export function isPromptInjectionAttempt(question: string) {
  const normalized = normalizeQuestion(question)

  return promptInjectionSignals.some((signal) => normalized.includes(signal))
}

export function asksForUnpublishedDetail(question: string) {
  const normalized = normalizeQuestion(question)

  return unpublishedDetailSignals.some((signal) => normalized.includes(signal))
}

function normalizeQuestion(question: string) {
  return question
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
}
