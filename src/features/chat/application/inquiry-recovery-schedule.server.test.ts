import { describe, expect, it, vi } from "vitest"

import { runScheduledInquiryRecovery } from "@/features/chat/application/inquiry-recovery-schedule.server"
import { config } from "../../../../netlify/functions/retry-portfolio-inquiries"

describe("scheduled inquiry recovery", () => {
  it("deploys a concrete five-minute outbox sweep", async () => {
    const recover = vi.fn().mockResolvedValue({
      selected: 1,
      retried: 1,
      failed: 0,
    })

    await expect(runScheduledInquiryRecovery(recover)).resolves.toEqual({
      selected: 1,
      retried: 1,
      failed: 0,
    })

    expect(recover).toHaveBeenCalledOnce()
    expect(config).toEqual({ schedule: "*/5 * * * *" })
  })
})
