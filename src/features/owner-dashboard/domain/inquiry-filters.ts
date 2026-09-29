import { contactTopics } from "@/features/contact/domain/contact"

export const inquiryTopicFilters = ["all", ...contactTopics] as const
export type InquiryTopicFilter = (typeof inquiryTopicFilters)[number]
export const inquiryTypeFilters = [
  "all",
  "hire",
  "project",
  "general",
  "contact",
] as const

export type InquiryTypeFilter = (typeof inquiryTypeFilters)[number]

export type OwnerInquiryFilters = {
  topic?: InquiryTopicFilter
  page: number
  query: string
  type: InquiryTypeFilter
}
