export const portfolioAssistantInquiryEvent = "portfolio:assistant-inquiry"

export interface PortfolioAssistantInquiryRequest {
  inquiryType: "hire" | "project"
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
    (value.inquiryType === "hire" || value.inquiryType === "project")
  )
}
