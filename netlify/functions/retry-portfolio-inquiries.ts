import { runScheduledInquiryRecovery } from "../../src/features/chat/application/inquiry-recovery-schedule.server"

export default async function retryPortfolioInquiries() {
  await runScheduledInquiryRecovery()
  return new Response(null, { status: 204 })
}

export const config = {
  schedule: "*/5 * * * *",
}
