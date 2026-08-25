import { afterEach, describe, expect, it, vi } from "vitest"

import {
  ResendAcknowledgementInquiryDelivery,
  ResendOwnerInquiryDelivery,
  formatAcknowledgement,
  formatOwnerNotification,
  formatOwnerSubject,
} from "@/features/chat/infrastructure/inquiry/resend.server"

const config = {
  apiKey: "resend-key",
  from: "Montasim <portfolio@example.com>",
  owner: "owner@example.com",
}

describe("Resend inquiry destinations", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it("passes the repository's stable idempotency key to the owner email", async () => {
    const sendEmail = vi.fn().mockResolvedValue({ error: null })
    const delivery = new ResendOwnerInquiryDelivery(config, sendEmail)

    await delivery.deliver({
      inquiry: {
        id: "inquiry-role-idempotent",
        type: "hire",
        name: "Tanim",
        email: "tanim@example.com",
        role: "Senior Frontend Engineer",
        arrangement: "Remote",
      },
      idempotencyKey:
        "portfolio-inquiry-inquiry-role-idempotent-resend-owner-v1",
    })

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "owner@example.com",
        replyTo: "tanim@example.com",
      }),
      {
        idempotencyKey:
          "portfolio-inquiry-inquiry-role-idempotent-resend-owner-v1",
      }
    )
  })

  it("tracks acknowledgement delivery independently", async () => {
    const sendEmail = vi.fn().mockResolvedValue({ error: null })
    const delivery = new ResendAcknowledgementInquiryDelivery(config, sendEmail)

    await delivery.deliver({
      inquiry: {
        id: "inquiry-project-idempotent",
        type: "project",
        name: "Amina",
        email: "amina@example.com",
        projectType: "SaaS platform",
        timeline: "Flexible",
      },
      idempotencyKey:
        "portfolio-inquiry-inquiry-project-idempotent-resend-acknowledgement-v1",
    })

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "amina@example.com" }),
      {
        idempotencyKey:
          "portfolio-inquiry-inquiry-project-idempotent-resend-acknowledgement-v1",
      }
    )
  })

  it("passes cancellation through to the underlying Resend request", async () => {
    const sendEmail = vi.fn().mockResolvedValue({ error: null })
    const delivery = new ResendOwnerInquiryDelivery(config, sendEmail)
    const controller = new AbortController()

    await delivery.deliver({
      inquiry: {
        id: "inquiry-role-cancellable",
        type: "hire",
        name: "Tanim",
        email: "tanim@example.com",
        role: "Senior Frontend Engineer",
        arrangement: "Remote",
      },
      idempotencyKey:
        "portfolio-inquiry-inquiry-role-cancellable-resend-owner-v1",
      signal: controller.signal,
    })

    expect(sendEmail).toHaveBeenCalledWith(expect.any(Object), {
      idempotencyKey:
        "portfolio-inquiry-inquiry-role-cancellable-resend-owner-v1",
      signal: controller.signal,
    })
  })

  it("aborts the production Resend fetch when delivery is cancelled", async () => {
    vi.stubEnv("NODE_ENV", "production")
    const requestSignals: AbortSignal[] = []
    const fetcher = vi.fn<typeof fetch>(async (_input, init) => {
      const requestSignal = init?.signal
      if (requestSignal) requestSignals.push(requestSignal)
      return new Promise<Response>((_resolve, reject) => {
        requestSignal?.addEventListener(
          "abort",
          () => reject(requestSignal.reason),
          { once: true }
        )
      })
    })
    vi.stubGlobal("fetch", fetcher)
    const delivery = new ResendOwnerInquiryDelivery(config)
    const controller = new AbortController()
    const result = delivery.deliver({
      inquiry: {
        id: "inquiry-role-production-cancellable",
        type: "hire",
        name: "Tanim",
        email: "tanim@example.com",
        role: "Senior Frontend Engineer",
        arrangement: "Remote",
      },
      idempotencyKey:
        "portfolio-inquiry-inquiry-role-production-cancellable-resend-owner-v1",
      signal: controller.signal,
    })
    const rejection = expect(result).rejects.toThrow("delivery failed")

    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledOnce())
    controller.abort(new Error("request deadline reached"))

    await rejection
    expect(requestSignals.at(0)).toBe(controller.signal)
    expect(requestSignals.at(0)!.aborted).toBe(true)
  })
})

describe("inquiry acknowledgement", () => {
  it("writes a personal role acknowledgement without repeating contact data", () => {
    const email = formatAcknowledgement({
      id: "inquiry-role-1",
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
      id: "inquiry-project-1",
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
      id: "inquiry-role-2",
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
      id: "inquiry-project-2",
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
