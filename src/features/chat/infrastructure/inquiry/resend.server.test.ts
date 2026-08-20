import { describe, expect, it } from "vitest"

import {
  formatAcknowledgement,
  formatOwnerNotification,
  formatOwnerSubject,
} from "@/features/chat/infrastructure/inquiry/resend.server"

describe("inquiry acknowledgement", () => {
  it("writes a personal role acknowledgement without repeating contact data", () => {
    const email = formatAcknowledgement({
      type: "hire",
      name: "Tanim",
      email: "tanim@example.com",
      role: "Senior Frontend Engineer",
      arrangement: "Remote",
    })

    expect(email).toContain("Hi Tanim,")
    expect(email).toContain(
      "Thanks for reaching out about the Senior Frontend Engineer role."
    )
    expect(email).toContain("I will review it personally")
    expect(email).toContain("Role: Senior Frontend Engineer")
    expect(email).toContain("Work arrangement: Remote")
    expect(email).toContain("Best,\nMontasim")
    expect(email).not.toContain("tanim@example.com")
  })

  it("adapts the acknowledgement for a project inquiry", () => {
    const email = formatAcknowledgement({
      type: "project",
      name: "Amina",
      email: "amina@example.com",
      projectType: "SaaS platform",
      timeline: "Within 1-3 months",
    })

    expect(email).toContain("Thanks for reaching out about your project.")
    expect(email).toContain("Project type: SaaS platform")
    expect(email).toContain("Preferred timeline: Within 1-3 months")
  })
})

describe("owner inquiry notification", () => {
  it("summarizes a role inquiry as a personal, actionable message", () => {
    const inquiry = {
      type: "hire" as const,
      name: "Tanim",
      email: "tanim@yopmail.com",
      role: "Senior Frontend Engineer",
      arrangement: "Remote",
    }

    expect(formatOwnerSubject(inquiry)).toBe(
      "Tanim wants to discuss a Senior Frontend Engineer role"
    )
    expect(formatOwnerNotification(inquiry)).toBe(
      [
        "Hi Montasim,",
        "Tanim is interested in discussing a Senior Frontend Engineer opportunity with you. They indicated that the role would be remote.",
        "You can reply directly to this email to continue the conversation with Tanim. Their email address is tanim@yopmail.com.",
        "Inquiry details\nName: Tanim\nRole: Senior Frontend Engineer\nWork arrangement: Remote",
        "This inquiry was submitted through your portfolio.",
      ].join("\n\n")
    )
  })

  it("adapts the summary and subject for a project inquiry", () => {
    const inquiry = {
      type: "project" as const,
      name: "Amina",
      email: "amina@example.com",
      projectType: "SaaS platform",
      timeline: "Within 1-3 months",
    }

    expect(formatOwnerSubject(inquiry)).toBe(
      "Amina wants to discuss a SaaS platform project"
    )
    expect(formatOwnerNotification(inquiry)).toContain(
      "Amina would like to discuss a SaaS platform project with you."
    )
    expect(formatOwnerNotification(inquiry)).toContain(
      "Their preferred timeline is within 1-3 months."
    )
  })
})
