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
    const result = await resend.emails.send({
      from,
      to: owner,
      replyTo: inquiry.email,
      subject: formatOwnerSubject(inquiry),
      text: formatOwnerNotification(inquiry),
    })
    if (result.error) throw new Error("Inquiry delivery failed.")

    logger.info({ inquiryType: inquiry.type }, "Portfolio inquiry delivered")

    try {
      const acknowledgement = await resend.emails.send({
        from,
        to: inquiry.email,
        subject: "Thanks for reaching out - Montasim",
        text: formatAcknowledgement(inquiry),
      })
      if (acknowledgement.error) {
        throw new Error("Inquiry acknowledgement failed.")
      }
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
  if (inquiry.context) details.push(`Additional context: ${inquiry.context}`)

  return [
    `Hi ${inquiry.name},`,
    introduction,
    "I've received your inquiry. I will review it personally and reply directly to this email as soon as I can.",
    `Here's what you shared:\n${details.join("\n")}`,
    "Best,\nMontasim",
  ].join("\n\n")
}

export function formatOwnerSubject(inquiry: InquirySubmission) {
  return inquiry.type === "hire"
    ? `${inquiry.name} wants to discuss a ${inquiry.role} role`
    : `${inquiry.name} wants to discuss ${describeProject(inquiry.projectType)}`
}

export function formatOwnerNotification(inquiry: InquirySubmission) {
  const summary =
    inquiry.type === "hire"
      ? `${inquiry.name} is interested in discussing a ${inquiry.role} opportunity with you. They indicated that the role would be ${inquiry.arrangement.toLowerCase()}.`
      : `${inquiry.name} would like to discuss ${describeProject(inquiry.projectType)} with you. Their preferred timeline is ${inquiry.timeline.toLowerCase()}.`
  const details =
    inquiry.type === "hire"
      ? [`Role: ${inquiry.role}`, `Work arrangement: ${inquiry.arrangement}`]
      : [
          `Project type: ${inquiry.projectType}`,
          `Preferred timeline: ${inquiry.timeline}`,
        ]
  if (inquiry.context) details.push(`Additional context: ${inquiry.context}`)

  return [
    "Hi Montasim,",
    summary,
    `You can reply directly to this email to continue the conversation with ${inquiry.name}. Their email address is ${inquiry.email}.`,
    `Inquiry details\nName: ${inquiry.name}\n${details.join("\n")}`,
    "This inquiry was submitted through your portfolio.",
  ].join("\n\n")
}

function describeProject(projectType: string) {
  return projectType === "Something else"
    ? "a custom project"
    : `a ${projectType} project`
}
