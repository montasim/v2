import type { PortfolioContactAction } from "@/features/chat/domain/chat"

export type SupportedConversationAction = Exclude<
  PortfolioContactAction,
  "general"
>

const directAction =
  /\b(?:(?:i|we) (?:want|would like|plan|intend|need|hope)|(?:i am|we are) (?:ready|interested)|(?:i|we)(?:'d|’d) like|(?:how|where) (?:can|do) (?:i|we)|how can (?:a recruiter|a client)|(?:can|could) (?:i|we)|(?:is|would) (?:montasim|he) available|(?:i|we) have (?:an? )?(?:open role|opening|position|project|product)|we (?:are|'re|’re) hiring)\b|^(?:please )?(?:contact|connect|reach out|talk|discuss)\b/i
const hiringSubject =
  /\b(?:hire|hiring|job|open role|opening|position|recruit|recruiter|recruiting|role)\b/i
const projectSubject =
  /\b(?:build (?:a|our|the) (?:app|product|project|system)|client|collaborat(?:e|ion)|consulting|contract|freelance|help with (?:a|our|the) (?:app|product|project|system)|new project|our product|project for (?:him|montasim)|want (?:him|montasim) to build|work together)\b/i
const fundingSubject =
  /\b(?:back (?:his|montasim's) work|donat(?:e|ion)|fund(?:ing)? (?:his|montasim's|the)? ?(?:work|projects?)?|sponsor(?:ship)?|support (?:his|montasim's) (?:work|projects?))\b/i

export function inferConversationAction(
  question: string
): SupportedConversationAction | undefined {
  if (!directAction.test(question)) return undefined
  if (fundingSubject.test(question)) return "funding"
  if (hiringSubject.test(question)) return "hire"
  if (projectSubject.test(question)) return "project"
  return undefined
}
