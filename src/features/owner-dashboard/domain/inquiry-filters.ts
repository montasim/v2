export const inquiryTypeFilters = ["all", "hire", "project", "general"] as const

export type InquiryTypeFilter = (typeof inquiryTypeFilters)[number]

export type OwnerInquiryFilters = {
  page: number
  query: string
  type: InquiryTypeFilter
}
