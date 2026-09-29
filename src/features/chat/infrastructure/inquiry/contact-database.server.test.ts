import { beforeEach, describe, expect, it, vi } from "vitest"
import type { portfolioInquiries } from "@/db/schema"
import { DatabaseInquiryRepository } from "./database.server"
import type { ContactSubmission } from "@/features/contact/domain/contact"

const storage = vi.hoisted(() => ({
  row: undefined as typeof portfolioInquiries.$inferSelect | undefined,
}))
vi.mock("@/db/client.server", () => ({
  getDatabase: () => ({
    insert: () => ({
      values: (values: Partial<typeof portfolioInquiries.$inferInsert>) => ({
        onConflictDoNothing: () => ({
          returning: async () => {
            if (storage.row) return []
            storage.row = {
              id: "",
              type: "",
              name: null,
              email: "",
              visitorHash: null,
              emailHash: null,
              context: null,
              topic: null,
              projectId: null,
              projectTitle: null,
              relatedPath: null,
              relatedTitle: null,
              unlistedProject: null,
              platform: null,
              appVersion: null,
              role: null,
              arrangement: null,
              projectType: null,
              timeline: null,
              resendOwnerState: "pending",
              resendOwnerLastError: null,
              resendOwnerUpdatedAt: null,
              resendAcknowledgementState: "pending",
              resendAcknowledgementLastError: null,
              resendAcknowledgementUpdatedAt: null,
              sheetsState: "pending",
              sheetsLastError: null,
              sheetsUpdatedAt: null,
              createdAt: new Date(),
              ...values,
            }
            return [storage.row]
          },
        }),
      }),
    }),
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => (storage.row ? [storage.row] : []),
        }),
      }),
    }),
  }),
}))
const inquiry: ContactSubmission = {
  id: "11111111-1111-4111-8111-111111111111",
  type: "contact",
  topic: "support",
  email: "person@example.com",
  context: "The app fails to open on my device.",
  projectId: "project-example",
  projectTitle: "Example",
  platform: "Android",
  appVersion: "1.2",
  relatedPath: "/experience",
  relatedTitle: "Experience",
}
beforeEach(() => {
  storage.row = undefined
})
describe("contact persistence and recovery", () => {
  it("round-trips unnamed contact context and reconstructs pending deliveries", async () => {
    const repository = new DatabaseInquiryRepository()
    await repository.accept({
      inquiry,
      visitorHash: "visitor",
      emailHash: "email",
    })
    expect(storage.row?.name).toBeNull()
    const restored = await repository.findPending(inquiry.id)
    expect(restored?.inquiry).toEqual(inquiry)
    expect(
      restored?.pendingDeliveries.map((delivery) => delivery.channel)
    ).toEqual(["resend-owner", "resend-acknowledgement", "google-sheets"])
    expect((await repository.findAccepted(inquiry))?.inquiry).toEqual(inquiry)
    await expect(
      repository.findAccepted({ ...inquiry, appVersion: "2" })
    ).rejects.toThrow("already been used")
  })
  it("still reconstructs historical assistant inquiries", async () => {
    const repository = new DatabaseInquiryRepository()
    const legacy = {
      id: inquiry.id,
      type: "general" as const,
      name: "Amina",
      email: inquiry.email,
      context: inquiry.context,
    }
    await repository.accept({
      inquiry: legacy,
      visitorHash: "visitor",
      emailHash: "email",
    })
    expect((await repository.findPending(legacy.id))?.inquiry).toEqual(legacy)
  })
})
