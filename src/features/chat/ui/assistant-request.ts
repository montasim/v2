import { inquiryTypeSchema } from "@/features/chat/domain/inquiry"
import type { InquiryType } from "@/features/chat/domain/inquiry"

export const portfolioAssistantInquiryEvent = "portfolio:assistant-inquiry"

export interface PortfolioAssistantInquiryRequest {
  inquiryType: InquiryType
}

export function requestPortfolioInquiry(
  request: PortfolioAssistantInquiryRequest
) {
  window.dispatchEvent(
    new CustomEvent<PortfolioAssistantInquiryRequest>(
      portfolioAssistantInquiryEvent,
      { detail: request }
    )
  )
}

export function isPortfolioAssistantInquiryRequest(
  value: unknown
): value is PortfolioAssistantInquiryRequest {
  return (
    typeof value === "object" &&
    value !== null &&
    "inquiryType" in value &&
    inquiryTypeSchema.safeParse(value.inquiryType).success
  )
}
