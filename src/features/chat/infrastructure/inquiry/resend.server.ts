import { Resend } from "resend"

import type { InquiryDestination } from "@/features/chat/application/ports/portfolio-inquiry"
import type { InquirySubmission } from "@/features/chat/domain/inquiry"
import { logger } from "@/lib/logger.server"

export interface ResendInquiryConfig {
  apiKey: string
  from: string
  owner: string
}

interface InquiryEmailMessage {
  from: string
  to: string
  replyTo?: string
  subject: string
  text: string
}

type SendInquiryEmail = (
  message: InquiryEmailMessage,
  options: { idempotencyKey: string; signal?: AbortSignal }
) => Promise<{ error: unknown }>

export class ResendOwnerInquiryDelivery implements InquiryDestination {
  readonly channel = "resend-owner" as const

  constructor(
    private readonly config?: ResendInquiryConfig,
    private readonly sendEmail?: SendInquiryEmail
  ) {}

  async deliver({
    inquiry,
    idempotencyKey,
    signal,
  }: Parameters<InquiryDestination["deliver"]>[0]) {
    const config = this.config ?? readResendInquiryConfig()
    const result = await (this.sendEmail ?? createEmailSender(config.apiKey))(
      {
        from: config.from,
        to: config.owner,
        replyTo: inquiry.email,
        subject: formatOwnerSubject(inquiry),
        text: formatOwnerNotification(inquiry),
      },
      { idempotencyKey, ...(signal ? { signal } : {}) }
    )
    if (result.error) throw new Error("Inquiry delivery failed.")

    logger.info(
      { inquiryId: inquiry.id, inquiryType: inquiry.type },
      "Portfolio inquiry delivered"
    )
  }
}

export class ResendAcknowledgementInquiryDelivery implements InquiryDestination {
  readonly channel = "resend-acknowledgement" as const

  constructor(
    private readonly config?: ResendInquiryConfig,
    private readonly sendEmail?: SendInquiryEmail
  ) {}

  async deliver({
    inquiry,
    idempotencyKey,
    signal,
  }: Parameters<InquiryDestination["deliver"]>[0]) {
    const config = this.config ?? readResendInquiryConfig()
    const result = await (this.sendEmail ?? createEmailSender(config.apiKey))(
      {
        from: config.from,
        to: inquiry.email,
        subject: "Thanks for reaching out - Montasim",
        text: formatAcknowledgement(inquiry),
      },
      { idempotencyKey, ...(signal ? { signal } : {}) }
    )
    if (result.error) throw new Error("Inquiry acknowledgement failed.")
  }
}

function readResendInquiryConfig(): ResendInquiryConfig {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.FROM_EMAIL
  const owner = process.env.EMAIL_TO
  if (!apiKey || !from || !owner) {
    throw new Error("Inquiry delivery is not configured.")
  }
  return { apiKey, from, owner }
}

function createEmailSender(apiKey: string): SendInquiryEmail {
  const resend = new Resend(apiKey)
  return (message, options) =>
    resend.post(
      "/emails",
      {
        from: message.from,
        to: message.to,
        reply_to: message.replyTo,
        subject: message.subject,
        text: message.text,
      },
      options
    )
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
