import { Resend } from "resend"

import type { InquiryDelivery } from "@/features/chat/application/ports/inquiry-delivery"
import type { InquirySubmission } from "@/features/chat/domain/inquiry"
import { logger } from "@/lib/logger.server"

export class ResendInquiryDelivery implements InquiryDelivery {
  async deliver(inquiry: InquirySubmission) {
    const apiKey = process.env.RESEND_API_KEY
    const from = process.env.FROM_EMAIL
    const owner = process.env.EMAIL_TO
    if (!apiKey || !from || !owner) {
      throw new Error("Inquiry delivery is not configured.")
    }

    const resend = new Resend(apiKey)
    const details = formatDetails(inquiry)
    const result = await resend.emails.send({
      from,
      to: owner,
      replyTo: inquiry.email,
      subject:
        inquiry.type === "hire" ? "New role inquiry" : "New project inquiry",
      text: details,
    })
    if (result.error) throw new Error("Inquiry delivery failed.")

    logger.info({ inquiryType: inquiry.type }, "Portfolio inquiry delivered")

    try {
      await resend.emails.send({
        from,
        to: inquiry.email,
        subject: "Thanks for reaching out - Montasim",
        text: formatAcknowledgement(inquiry),
      })
    } catch {
      logger.warn(
        { inquiryType: inquiry.type },
        "Inquiry acknowledgement failed"
      )
    }
  }
}

export function formatAcknowledgement(inquiry: InquirySubmission) {
  const introduction =
    inquiry.type === "hire"
      ? `Thanks for reaching out about the ${inquiry.role} role. I appreciate you taking the time to share what you are looking for.`
      : "Thanks for reaching out about your project. I appreciate you taking the time to share the initial details."

  const details =
    inquiry.type === "hire"
      ? [`Role: ${inquiry.role}`, `Work arrangement: ${inquiry.arrangement}`]
      : [
          `Project type: ${inquiry.projectType}`,
          `Preferred timeline: ${inquiry.timeline}`,
        ]

  return [
    `Hi ${inquiry.name},`,
    introduction,
    "I've received your inquiry. I will review it personally and reply directly to this email as soon as I can.",
    `Here's what you shared:\n${details.join("\n")}`,
    "Best,\nMontasim",
  ].join("\n\n")
}

function formatDetails(inquiry: InquirySubmission) {
  const lines = [
    `Inquiry: ${inquiry.type === "hire" ? "Role" : "Project"}`,
    `Name: ${inquiry.name}`,
    `Email: ${inquiry.email}`,
  ]
  if (inquiry.type === "hire") {
    lines.push(
      `Role: ${inquiry.role}`,
      `Work arrangement: ${inquiry.arrangement}`
    )
  } else {
    lines.push(
      `Project type: ${inquiry.projectType}`,
      `Timeline: ${inquiry.timeline}`
    )
  }
  return lines.join("\n")
}
