import { retryPendingPortfolioInquiries } from "@/features/chat/application/portfolio-inquiry-runtime.server"
import { logger } from "@/lib/logger.server"

export async function runScheduledInquiryRecovery(
  recover: () => Promise<unknown> = retryPendingPortfolioInquiries
) {
  const summary = await recover()
  logger.info({ summary }, "Scheduled inquiry recovery completed")
  return summary
}
