import type { InquiryType } from "@/features/chat/domain/inquiry"

export type ContactIntent = InquiryType | "funding"

interface ContactIntentInput {
  question: string
  source?: string
}

export interface ContactGuidance {
  intent: ContactIntent
  answer: string
  source: string
}

const roleIntentPatterns = [
  /\b(?:hire|hiring|recruit|recruiting)\b/,
  /\b(?:job|career) (?:offer|opportunity)\b/,
  /\b(?:open position|job opening|vacancy)\b/,
  /\b(?:new|open) (?:role|position|job)\b/,
  /\bjoin (?:our|the) team\b/,
  /\bavailable for (?:a |the )?(?:role|position|job|work)\b/,
  /\b(?:discuss|offer) (?:a |the )?(?:role|position|job)\b/,
  /\b(?:role|position)\b.{0,24}\b(?:fit|suitable|consider)\b/,
  /\b(?:fit|suitable|consider)\b.{0,24}\b(?:role|position)\b/,
] as const

const projectIntentPatterns = [
  /\b(?:discuss|start|plan|scope) (?:a |the |our )?project\b/,
  /\b(?:new|upcoming|freelance|client) project\b/,
  /\b(?:freelance|consulting|contract) (?:work|opportunity)\b/,
  /\b(?:work|collaborate) (?:with|together)\b/,
  /\b(?:need|want|looking for) (?:his |a )?(?:help|developer|engineer)\b/,
  /\bbuild (?:us|our)\b/,
] as const

const fundingIntentPatterns = [
  /\b(?:fund|funding|sponsor|sponsorship|donate|donation|tip)\b/,
  /\b(?:financially )?support (?:him|montasim|his work|his projects?)\b/,
  /\bcontribute (?:to|financially)\b/,
] as const

const guidanceByIntent = {
  hire: {
    intent: "hire",
    answer: "Here are the quickest ways to discuss hiring Montasim.",
    source: "Contact preferences",
  },
  project: {
    intent: "project",
    answer: "Here are the quickest ways to discuss a project with Montasim.",
    source: "Contact preferences",
  },
  funding: {
    intent: "funding",
    answer:
      "Here is the direct support option for Montasim's independent work.",
    source: "Support preferences",
  },
} as const satisfies Record<ContactIntent, ContactGuidance>

export function getContactGuidance({
  question,
  source,
}: ContactIntentInput): ContactGuidance | undefined {
  const normalizedQuestion = question.toLowerCase().replace(/\s+/g, " ").trim()

  if (matchesAny(normalizedQuestion, fundingIntentPatterns))
    return guidanceByIntent.funding
  if (matchesAny(normalizedQuestion, projectIntentPatterns))
    return guidanceByIntent.project
  if (matchesAny(normalizedQuestion, roleIntentPatterns))
    return guidanceByIntent.hire

  if (source === "Experience and projects") return guidanceByIntent.project
  if (source === "Experience and recommendations") return guidanceByIntent.hire

  return undefined
}

function matchesAny(value: string, patterns: readonly RegExp[]) {
  return patterns.some((pattern) => pattern.test(value))
}
