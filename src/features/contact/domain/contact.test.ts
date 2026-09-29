import { describe, expect, it } from "vitest"
import {
  contactHref,
  contactSearchSchema,
  contactSubmissionSchema,
  isContactPath,
} from "./contact"
import {
  loadContactContext,
  resolveContactSubmission,
  resolveRelatedPage,
} from "../application/contact-context.server"
import { parseInquiryRequest } from "@/features/chat/application/submit-inquiry"
import {
  formatAcknowledgement,
  formatOwnerNotification,
  formatOwnerSubject,
} from "@/features/chat/infrastructure/inquiry/resend.server"
import { inquiryToRow } from "@/features/chat/infrastructure/inquiry/google-sheets.server"
import { getInquiryModerationError } from "@/features/chat/domain/inquiry-moderation"

const contact = {
  id: "11111111-1111-4111-8111-111111111111",
  type: "contact" as const,
  topic: "general" as const,
  email: "person@example.com",
  context: "I have a question about your work.",
}

describe("direct contact contract", () => {
  it("includes catalog store links for contact products without empty destinations", () => {
    const { projects } = loadContactContext({ app: "bugreceipt" })
    expect(
      projects.find((project) => project.id === "project-bugreceipt")?.links
    ).toContainEqual({
      label: "Chrome Web Store",
      href: "https://chromewebstore.google.com/detail/bugreceipt/dcjbnkadoenmkcimidcbhhckdpaondae",
    })
    expect(
      projects.every((project) =>
        project.links.every((link) => Boolean(link.href))
      )
    ).toBe(true)
  })

  it("normalizes unknown search values and builds contextual links without personal data", () => {
    expect(contactSearchSchema.parse({ topic: "invalid", app: 3 })).toEqual({
      topic: undefined,
      app: undefined,
    })
    expect(contactHref({ topic: "question", from: "/experience" })).toBe(
      "/contact?topic=question&from=%2Fexperience"
    )
    expect(isContactPath("/contact/")).toBe(true)
    expect(isContactPath("/contact-other")).toBe(false)
    expect(loadContactContext({ app: "missing-app" })).toMatchObject({
      topic: "support",
      unknownApp: true,
      projectId: "",
    })
  })
  it("accepts an unnamed sender and requires meaningful support context", () => {
    expect(
      contactSubmissionSchema.parse({ ...contact, name: " " }).name
    ).toBeUndefined()
    expect(
      contactSubmissionSchema.safeParse({ ...contact, topic: "support" })
        .success
    ).toBe(false)
    expect(
      contactSubmissionSchema.safeParse({
        ...contact,
        topic: "support",
        unlistedProject: "Future app",
      }).success
    ).toBe(true)
  })
  it("resolves authoritative titles and discards injected titles and irrelevant support fields", () => {
    const initial = loadContactContext({
      app: "bugreceipt",
      from: "/experience?secret=value#part",
    })
    expect(initial.projectId).toBe("project-bugreceipt")
    const result = resolveContactSubmission({
      ...contact,
      topic: "question",
      projectId: initial.projectId,
      projectTitle: "Injected title",
      relatedPath: "/experience?secret=value",
      relatedTitle: "Injected",
      platform: "ignored",
    })
    expect(result).toMatchObject({
      projectTitle: "BugReceipt",
      relatedTitle: "Experience",
      relatedPath: "/experience",
      platform: undefined,
    })
    expect(() =>
      resolveContactSubmission({ ...contact, projectId: "unknown" })
    ).toThrow("no longer available")
  })
  it("defaults app-only links to support and clears project context for hiring", () => {
    expect(loadContactContext({ app: "mulalens" }).topic).toBe("support")
    expect(loadContactContext({ app: "missing" }).unknownApp).toBe(true)
    expect(
      loadContactContext({ app: "other", topic: "support" })
    ).toMatchObject({ projectId: "other", unknownApp: false })
    expect(loadContactContext({ topic: "collaboration" }).topic).toBe(
      "collaboration"
    )
    expect(
      resolveContactSubmission({
        ...contact,
        topic: "collaboration",
        projectId: "project-bugreceipt",
        platform: "Android",
        appVersion: "2",
      })
    ).toMatchObject({
      projectId: undefined,
      projectTitle: undefined,
      platform: undefined,
      appVersion: undefined,
    })
  })
  it("accepts only known internal content paths", () => {
    for (const path of [
      "https://evil.example/experience",
      "//evil.example",
      "/\\evil.example",
      "/dashboard",
      "/blog/not-a-post",
      "/projects/bugreceipt/other",
    ])
      expect(resolveRelatedPage(path)).toBeUndefined()
    expect(resolveRelatedPage("/projects/bugreceipt")).toEqual({
      path: "/projects/bugreceipt",
      title: "BugReceipt",
    })
  })
  it("allows a 5,000-character multibyte message while bounding requests and preserving legacy limits", () => {
    expect(
      parseInquiryRequest({
        inquiry: { ...contact, context: "ক".repeat(5000) },
      }).inquiry.context
    ).toHaveLength(5000)
    expect(() =>
      parseInquiryRequest({
        inquiry: { ...contact, context: "x".repeat(5001) },
      })
    ).toThrow()
    expect(() =>
      parseInquiryRequest({ inquiry: contact, ignored: "x".repeat(32768) })
    ).toThrow("too large")
    expect(() =>
      parseInquiryRequest({
        inquiry: { ...contact, type: "general", name: "Amina" },
        ignored: "x".repeat(4096),
      })
    ).toThrow("too large")
  })
  it("renders topic and context in delivery without an undefined name", () => {
    const support = resolveContactSubmission({
      ...contact,
      topic: "support",
      projectId: "project-bugreceipt",
      platform: "Windows",
      appVersion: "1.2",
    })
    expect(formatOwnerSubject(support)).toContain("BugReceipt")
    expect(formatOwnerNotification(support)).toContain("Platform: Windows")
    expect(formatAcknowledgement(support)).toContain("Hello,")
    expect(formatAcknowledgement(support)).not.toContain("undefined")
    const row = inquiryToRow({ ...support, platform: "=1+1" })
    expect(row[1]).toContain(support.id)
    expect(row[9]).toContain(support.context)
    expect(row[10]).toContain("support")
    expect(row[16]).not.toBe("=1+1")
    expect(row).toHaveLength(18)
  })
  it("normalizes text, rejects control characters, and strips unknown properties", () => {
    const parsed = contactSubmissionSchema.parse({
      ...contact,
      name: "  Jose\u0301  ",
      email: " PERSON@EXAMPLE.COM ",
      context: "  First line\r\nSecond line\twith detail  ",
      injected: "ignore me",
    })
    expect(parsed.name).toBe("José")
    expect(parsed.email).toBe("person@example.com")
    expect(parsed.context).toBe("First line\nSecond line\twith detail")
    expect(parsed).not.toHaveProperty("injected")
    for (const field of [
      "name",
      "platform",
      "appVersion",
      "unlistedProject",
      "context",
    ]) {
      expect(
        contactSubmissionSchema.safeParse({
          ...contact,
          [field]: "Invalid\0text here",
        }).success
      ).toBe(false)
    }
    expect(
      contactSubmissionSchema.safeParse({
        ...contact,
        name: "Name\r\nBcc: injected",
      }).success
    ).toBe(false)
    expect(
      contactSubmissionSchema.parse({
        ...contact,
        context: "Example: <script>alert(1)</script>",
      }).context
    ).toContain("<script>")
  })
  it.each(["platform", "appVersion", "unlistedProject"])(
    "moderates contact %s on the server",
    async (field) => {
      expect(
        await getInquiryModerationError({
          ...contact,
          [field]: "You are a fucking idiot.",
        })
      ).toBeTruthy()
    }
  )
  it("accepts ordinary technical support language", async () => {
    expect(
      await getInquiryModerationError({
        ...contact,
        context:
          "The app crashes when I open Settings. Windows 11, version 1.2.0.",
      })
    ).toBeNull()
  })
})
