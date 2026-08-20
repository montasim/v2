import { z } from "zod"

export const inquiryTypeSchema = z.enum(["hire", "project"])

const baseInquirySchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().max(254),
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

export const inquirySteps = {
  hire: [
    {
      key: "role",
      label: "Role",
      title: "What role are you hiring for?",
      help: "Choose the closest match.",
      type: "options",
      options: [
        "Senior Frontend Engineer",
        "Senior Full-Stack Engineer",
        "Technical Lead",
        "Another role",
      ],
    },
    {
      key: "arrangement",
      label: "Work arrangement",
      title: "What is the work arrangement?",
      help: "This helps Montasim confirm fit and availability.",
      type: "options",
      options: ["Remote", "Hybrid", "On-site", "Flexible"],
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
  type: InquiryType
  stepIndex: number
  editReturnStep: number | null
  answers: Partial<Record<InquiryAnswerKey, string>>
  status: InquiryStatus
}

export type InquiryAction =
  | { type: "answer"; value: string }
  | { type: "back" }
  | { type: "begin-edit"; stepIndex: number }
  | { type: "cancel-edit" }
  | { type: "submission-succeeded" }
  | { type: "submission-failed" }
  | { type: "retry-submission" }
  | { type: "edit-email" }

export function createInquiryState(type: InquiryType): InquiryState {
  return {
    type,
    stepIndex: 0,
    editReturnStep: null,
    answers: {},
    status: "active",
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
      if (state.editReturnStep !== null) {
        return {
          ...state,
          answers,
          stepIndex: state.editReturnStep,
          editReturnStep: null,
        }
      }
      if (state.stepIndex < steps.length - 1) {
        return { ...state, answers, stepIndex: state.stepIndex + 1 }
      }
      return { ...state, answers, status: "submitting" }
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
        ? { ...state, status: "success" }
        : state
    case "submission-failed":
      return state.status === "submitting"
        ? { ...state, status: "error" }
        : state
    case "retry-submission":
      return state.status === "error"
        ? { ...state, status: "submitting" }
        : state
    case "edit-email":
      return state.status === "error"
        ? {
            ...state,
            status: "active",
            stepIndex: steps.length - 1,
            editReturnStep: null,
          }
        : state
  }
}

export function toInquirySubmission(state: InquiryState): InquirySubmission {
  const candidate = { type: state.type, ...state.answers }
  return inquirySubmissionSchema.parse(candidate)
}
