import { z } from "zod"

import { visitorEmailSchema } from "@/features/email-verification/domain/email-verification"

export const inquiryTypeSchema = z.enum(["hire", "project"])

const baseInquirySchema = z.object({
  id: z.string().trim().min(8).max(100),
  name: z.string().trim().min(2).max(80),
  email: visitorEmailSchema,
  context: z.string().trim().max(1_000).optional(),
})

export const inquirySubmissionSchema = z.discriminatedUnion("type", [
  baseInquirySchema.extend({
    type: z.literal("hire"),
    role: z.string().trim().min(1).max(100),
    arrangement: z.string().trim().min(1).max(100),
  }),
  baseInquirySchema.extend({
    type: z.literal("project"),
    projectType: z.string().trim().min(1).max(100),
    timeline: z.string().trim().min(1).max(100),
  }),
])

export type InquiryType = z.infer<typeof inquiryTypeSchema>
export type InquirySubmission = z.infer<typeof inquirySubmissionSchema>

export type InquiryAnswerKey =
  "role" | "arrangement" | "projectType" | "timeline" | "name" | "email"

export interface InquiryStep {
  key: InquiryAnswerKey
  label: string
  title: string
  help: string
  type: "options" | "text" | "email"
  placeholder?: string
  options?: readonly string[]
}

export const roleInquiryOptions = [
  "Senior Frontend Engineer",
  "Senior Full-Stack Engineer",
  "Technical Lead",
  "Another role",
] as const

export const arrangementInquiryOptions = [
  "Remote",
  "Hybrid",
  "On-site",
  "Flexible",
] as const

export const inquirySteps = {
  hire: [
    {
      key: "role",
      label: "Role",
      title: "What role are you hiring for?",
      help: "Choose the closest match.",
      type: "options",
      options: roleInquiryOptions,
    },
    {
      key: "arrangement",
      label: "Work arrangement",
      title: "What is the work arrangement?",
      help: "This helps Montasim confirm fit and availability.",
      type: "options",
      options: arrangementInquiryOptions,
    },
    {
      key: "name",
      label: "Name",
      title: "Who should Montasim reply to?",
      help: "Enter your name or the hiring manager's name.",
      type: "text",
      placeholder: "Your name",
    },
    {
      key: "email",
      label: "Work email",
      title: "Where should he reply?",
      help: "Used only for this inquiry. It is not added to AI chat history.",
      type: "email",
      placeholder: "you@company.com",
    },
  ],
  project: [
    {
      key: "projectType",
      label: "Project type",
      title: "What are you planning?",
      help: "Choose the closest project type.",
      type: "options",
      options: [
        "Web application",
        "SaaS platform",
        "Frontend architecture",
        "Something else",
      ],
    },
    {
      key: "timeline",
      label: "Timeline",
      title: "When would you like to start?",
      help: "An estimate is enough.",
      type: "options",
      options: [
        "As soon as possible",
        "Within 1-3 months",
        "Within 3-6 months",
        "Flexible",
      ],
    },
    {
      key: "name",
      label: "Name",
      title: "Who should Montasim reply to?",
      help: "Enter your name.",
      type: "text",
      placeholder: "Your name",
    },
    {
      key: "email",
      label: "Email",
      title: "Where should he reply?",
      help: "Used only for this inquiry. It is not added to AI chat history.",
      type: "email",
      placeholder: "you@company.com",
    },
  ],
} as const satisfies Record<InquiryType, readonly InquiryStep[]>

export type InquiryStatus = "active" | "submitting" | "success" | "error"

export interface InquiryState {
  id: string
  type: InquiryType
  stepIndex: number
  editReturnStep: number | null
  answers: Partial<Record<InquiryAnswerKey, string>>
  context: string
  website: string
  status: InquiryStatus
  submissionError: string | null
}

export type InquiryAction =
  | { type: "answer"; value: string; context?: string; website?: string }
  | { type: "back" }
  | { type: "begin-edit"; stepIndex: number }
  | { type: "cancel-edit" }
  | { type: "submission-succeeded" }
  | { type: "submission-failed"; message: string }
  | { type: "retry-submission" }
  | { type: "edit-email" }

export function createInquiryState(type: InquiryType): InquiryState {
  return {
    id: createInquiryId(),
    type,
    stepIndex: 0,
    editReturnStep: null,
    answers: {},
    context: "",
    website: "",
    status: "active",
    submissionError: null,
  }
}

export function inquiryReducer(
  state: InquiryState,
  action: InquiryAction
): InquiryState {
  const steps = inquirySteps[state.type]

  switch (action.type) {
    case "answer": {
      if (state.status !== "active") return state
      const step = steps[state.stepIndex]

      const answers = { ...state.answers, [step.key]: action.value.trim() }
      const supplemental =
        step.key === "email"
          ? {
              context: action.context?.trim() ?? state.context,
              website: action.website?.trim() ?? state.website,
            }
          : {}
      if (state.editReturnStep !== null) {
        return {
          ...state,
          ...supplemental,
          answers,
          stepIndex: state.editReturnStep,
          editReturnStep: null,
        }
      }
      if (state.stepIndex < steps.length - 1) {
        return {
          ...state,
          ...supplemental,
          answers,
          stepIndex: state.stepIndex + 1,
        }
      }
      return {
        ...state,
        ...supplemental,
        answers,
        status: "submitting",
      }
    }
    case "back":
      if (state.status !== "active" || state.stepIndex === 0) return state
      return { ...state, stepIndex: state.stepIndex - 1, editReturnStep: null }
    case "begin-edit":
      if (
        state.status !== "active" ||
        state.editReturnStep !== null ||
        action.stepIndex < 0 ||
        action.stepIndex >= state.stepIndex
      ) {
        return state
      }
      return {
        ...state,
        editReturnStep: state.stepIndex,
        stepIndex: action.stepIndex,
      }
    case "cancel-edit":
      if (state.editReturnStep === null) return state
      return {
        ...state,
        stepIndex: state.editReturnStep,
        editReturnStep: null,
      }
    case "submission-succeeded":
      return state.status === "submitting"
        ? { ...state, status: "success", submissionError: null }
        : state
    case "submission-failed":
      return state.status === "submitting"
        ? { ...state, status: "error", submissionError: action.message }
        : state
    case "retry-submission":
      return state.status === "error"
        ? { ...state, status: "submitting", submissionError: null }
        : state
    case "edit-email":
      return state.status === "error"
        ? {
            ...state,
            status: "active",
            submissionError: null,
            stepIndex: steps.length - 1,
            editReturnStep: null,
          }
        : state
  }
}

export function toInquirySubmission(state: InquiryState): InquirySubmission {
  const candidate = {
    id: state.id,
    type: state.type,
    context: state.context || undefined,
    ...state.answers,
  }
  return inquirySubmissionSchema.parse(candidate)
}

export function createInquiryId() {
  if (typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID()
  }

  return `inquiry-${Date.now()}-${Math.random().toString(36).slice(2)}`
}
