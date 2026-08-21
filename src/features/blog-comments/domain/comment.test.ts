import { describe, expect, it } from "vitest"

import {
  blogCommentSchema,
  blogCommentSubmissionSchema,
} from "@/features/blog-comments/domain/comment"
import { getCommentModerationError } from "@/features/blog-comments/domain/moderation"

describe("blog comments", () => {
  it("normalizes a valid submission", () => {
    expect(
      blogCommentSubmissionSchema.parse({
        postSlug: "reliable-state-machines",
        name: "  Samira Rahman  ",
        email: "  SAMIRA@EXAMPLE.COM ",
        message: "  Useful explanation.  ",
        replyTo: null,
      })
    ).toEqual({
      postSlug: "reliable-state-machines",
      name: "Samira Rahman",
      email: "samira@example.com",
      message: "Useful explanation.",
      replyTo: null,
    })
  })

  it("rejects unsafe or oversized public input", () => {
    expect(() =>
      blogCommentSubmissionSchema.parse({
        postSlug: "../admin",
        name: "A",
        email: "not-an-email",
        message: "x".repeat(2_001),
        replyTo: null,
      })
    ).toThrow()
  })

  it("keeps email out of the public comment shape", () => {
    const comment = blogCommentSchema.parse({
      id: "d184e0f3-b845-49c4-a7b5-d589df44e606",
      postSlug: "reliable-state-machines",
      name: "Samira Rahman",
      email: "private@example.com",
      message: "Useful explanation.",
      createdAt: "2026-08-22T00:00:00.000Z",
      replyTo: null,
    })

    expect(comment).not.toHaveProperty("email")
  })

  it.each([
    "The class design keeps state predictable.",
    "The assistant response was useful.",
    "I disagree with this architecture.",
  ])("does not block constructive language: %s", async (message) => {
    await expect(getCommentModerationError(message)).resolves.toBeNull()
  })
})
