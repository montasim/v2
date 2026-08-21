import { describe, expect, it } from "vitest"

import {
  createInquiryState,
  inquiryReducer,
  inquirySteps,
  toInquirySubmission,
} from "@/features/chat/domain/inquiry"

describe("inquiryReducer", () => {
  it("uses the approved prototype copy for work arrangement", () => {
    expect(inquirySteps.hire[1]).toMatchObject({
      title: "What is the work arrangement?",
      help: "This helps Montasim confirm fit and availability.",
    })
  })

  it("uses the approved prototype project flow", () => {
    expect(inquirySteps.project[0]).toMatchObject({
      title: "What are you planning?",
      help: "Choose the closest project type.",
      options: [
        "Web application",
        "SaaS platform",
        "Frontend architecture",
        "Something else",
      ],
    })
    expect(inquirySteps.project[2].help).toBe("Enter your name.")
  })

  it("advances through a role inquiry and prepares a valid submission", () => {
    let state = createInquiryState("hire")
    for (const value of [
      "Senior Frontend Engineer",
      "Remote",
      "Amina Rahman",
      "amina@example.com",
    ]) {
      state = inquiryReducer(state, { type: "answer", value })
    }

    expect(state.status).toBe("submitting")
    expect(toInquirySubmission(state)).toEqual({
      id: expect.any(String),
      type: "hire",
      role: "Senior Frontend Engineer",
      arrangement: "Remote",
      name: "Amina Rahman",
      email: "amina@example.com",
    })
  })

  it("changes an earlier answer, preserves later answers, and returns", () => {
    let state = createInquiryState("project")
    state = inquiryReducer(state, { type: "answer", value: "Web application" })
    state = inquiryReducer(state, { type: "answer", value: "Flexible" })

    state = inquiryReducer(state, { type: "begin-edit", stepIndex: 0 })
    state = inquiryReducer(state, { type: "answer", value: "SaaS platform" })

    expect(state.stepIndex).toBe(2)
    expect(state.editReturnStep).toBeNull()
    expect(state.answers).toMatchObject({
      projectType: "SaaS platform",
      timeline: "Flexible",
    })
  })

  it("cancels editing without changing the answer", () => {
    let state = createInquiryState("hire")
    state = inquiryReducer(state, {
      type: "answer",
      value: "Senior Frontend Engineer",
    })
    state = inquiryReducer(state, { type: "answer", value: "Remote" })
    state = inquiryReducer(state, { type: "begin-edit", stepIndex: 0 })
    state = inquiryReducer(state, { type: "cancel-edit" })

    expect(state.stepIndex).toBe(2)
    expect(state.answers.role).toBe("Senior Frontend Engineer")
  })

  it("preserves answers after a failed submission so it can retry", () => {
    let state = createInquiryState("project")
    const inquiryId = state.id
    for (const value of [
      "Something else",
      "Within 1-3 months",
      "Tariq Hasan",
      "tariq@example.com",
    ]) {
      state = inquiryReducer(state, { type: "answer", value })
    }
    state = inquiryReducer(state, {
      type: "submission-failed",
      message: "Delivery failed.",
    })
    state = inquiryReducer(state, { type: "retry-submission" })

    expect(state.status).toBe("submitting")
    expect(state.id).toBe(inquiryId)
    expect(state.answers.email).toBe("tariq@example.com")
  })

  it("includes optional context in the final submission", () => {
    let state = createInquiryState("hire")
    for (const value of ["Technical Lead", "Hybrid", "Amina Rahman"]) {
      state = inquiryReducer(state, { type: "answer", value })
    }
    state = inquiryReducer(state, {
      type: "answer",
      value: "amina@example.com",
      context: "https://example.com/jobs/technical-lead",
    })

    expect(toInquirySubmission(state).context).toBe(
      "https://example.com/jobs/technical-lead"
    )
  })
})
