import { describe, expect, it } from "vitest"

import { formatAcknowledgement } from "@/features/chat/infrastructure/inquiry/resend.server"

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
