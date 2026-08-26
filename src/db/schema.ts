import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"
import type { AnyPgColumn } from "drizzle-orm/pg-core"

export const blogComments = pgTable(
  "blog_comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    postSlug: varchar("post_slug", { length: 200 }).notNull(),
    parentId: uuid("parent_id").references((): AnyPgColumn => blogComments.id, {
      onDelete: "cascade",
    }),
    name: varchar("name", { length: 80 }).notNull(),
    email: varchar("email", { length: 320 }).notNull(),
    message: text("message").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("blog_comments_post_created_idx").on(table.postSlug, table.createdAt),
    index("blog_comments_parent_idx").on(table.parentId),
  ]
)

export const blogPostViews = pgTable("blog_post_views", {
  postSlug: varchar("post_slug", { length: 200 }).primaryKey(),
  viewCount: integer("view_count").default(0).notNull(),
})

export const newsletterSubscribers = pgTable(
  "newsletter_subscribers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 254 }).notNull(),
    confirmationState: varchar("confirmation_state", { length: 16 })
      .default("pending")
      .notNull(),
    confirmationLastError: text("confirmation_last_error"),
    confirmationSentAt: timestamp("confirmation_sent_at", {
      withTimezone: true,
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("newsletter_subscribers_email_idx").on(table.email),
    index("newsletter_subscribers_created_idx").on(table.createdAt),
  ]
)

export const projectCaseStudyViews = pgTable("project_case_study_views", {
  caseStudySlug: varchar("case_study_slug", { length: 200 }).primaryKey(),
  viewCount: integer("view_count").default(0).notNull(),
})

export const assistantExchanges = pgTable(
  "assistant_exchanges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: varchar("conversation_id", { length: 120 }).notNull(),
    clientMessageId: varchar("client_message_id", { length: 120 }),
    question: text("question").notNull(),
    answer: text("answer").notNull(),
    source: varchar("source", { length: 160 }).notNull(),
    responseKind: varchar("response_kind", { length: 24 })
      .default("generated")
      .notNull(),
    contactAction: varchar("contact_action", { length: 24 }),
    handoffReason: varchar("handoff_reason", { length: 40 }),
    provider: varchar("provider", { length: 40 }),
    model: varchar("model", { length: 160 }),
    servedModel: varchar("served_model", { length: 160 }),
    usedFallback: boolean("used_fallback").default(false).notNull(),
    fallbackDepth: integer("fallback_depth").default(0).notNull(),
    citations:
      jsonb("citations").$type<
        readonly { label: string; href: string; kind: string }[]
      >(),
    evidenceIds: jsonb("evidence_ids").$type<readonly string[]>(),
    retrievalMetadata:
      jsonb("retrieval_metadata").$type<Record<string, unknown>>(),
    providerAttempts: jsonb("provider_attempts").$type<readonly unknown[]>(),
    validationStatus: varchar("validation_status", { length: 32 })
      .default("accepted")
      .notNull(),
    latencyMs: integer("latency_ms"),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    costUsd: numeric("cost_usd", { precision: 16, scale: 10 }),
    policyVersion: varchar("policy_version", { length: 40 }),
    corpusVersion: varchar("corpus_version", { length: 64 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("assistant_exchanges_conversation_idx").on(
      table.conversationId,
      table.createdAt
    ),
    uniqueIndex("assistant_exchanges_message_idx").on(
      table.conversationId,
      table.clientMessageId
    ),
  ]
)

export const assistantChatQuestions = pgTable(
  "assistant_chat_questions",
  {
    conversationId: varchar("conversation_id", { length: 120 }).notNull(),
    clientMessageId: varchar("client_message_id", { length: 120 }).notNull(),
    question: text("question").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.conversationId, table.clientMessageId] }),
    index("assistant_chat_questions_created_idx").on(table.createdAt),
  ]
)

export const assistantChatRequests = pgTable(
  "assistant_chat_requests",
  {
    conversationId: varchar("conversation_id", { length: 120 }).notNull(),
    clientMessageId: varchar("client_message_id", { length: 120 }).notNull(),
    status: varchar("status", { length: 16 }).default("pending").notNull(),
    leaseToken: uuid("lease_token").notNull(),
    leaseExpiresAt: timestamp("lease_expires_at", {
      withTimezone: true,
    }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.conversationId, table.clientMessageId] }),
    index("assistant_chat_requests_lease_idx").on(
      table.status,
      table.leaseExpiresAt
    ),
  ]
)

export const assistantRateLimits = pgTable(
  "assistant_rate_limits",
  {
    scope: varchar("scope", { length: 32 }).notNull(),
    subjectHash: varchar("subject_hash", { length: 64 }).notNull(),
    windowStartedAt: timestamp("window_started_at", {
      withTimezone: true,
    }).notNull(),
    requestCount: integer("request_count").default(0).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.scope, table.subjectHash] })]
)

export const assistantProviderStates = pgTable(
  "assistant_provider_states",
  {
    provider: varchar("provider", { length: 40 }).notNull(),
    model: varchar("model", { length: 160 }).notNull(),
    disabledUntil: timestamp("disabled_until", { withTimezone: true }),
    reason: varchar("reason", { length: 120 }),
    lastCostUsd: numeric("last_cost_usd", { precision: 16, scale: 10 }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.provider, table.model] })]
)

export const portfolioInquiries = pgTable("portfolio_inquiries", {
  id: varchar("id", { length: 100 }).primaryKey(),
  type: varchar("type", { length: 20 }).notNull(),
  name: varchar("name", { length: 80 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  visitorHash: varchar("visitor_hash", { length: 64 }),
  emailHash: varchar("email_hash", { length: 64 }),
  context: text("context"),
  role: varchar("role", { length: 100 }),
  arrangement: varchar("arrangement", { length: 100 }),
  projectType: varchar("project_type", { length: 100 }),
  timeline: varchar("timeline", { length: 100 }),
  resendOwnerState: varchar("resend_owner_state", { length: 16 })
    .default("pending")
    .notNull(),
  resendOwnerLastError: text("resend_owner_last_error"),
  resendOwnerUpdatedAt: timestamp("resend_owner_updated_at", {
    withTimezone: true,
  }),
  resendAcknowledgementState: varchar("resend_ack_state", { length: 16 })
    .default("pending")
    .notNull(),
  resendAcknowledgementLastError: text("resend_ack_last_error"),
  resendAcknowledgementUpdatedAt: timestamp("resend_ack_updated_at", {
    withTimezone: true,
  }),
  sheetsState: varchar("sheets_state", { length: 16 })
    .default("pending")
    .notNull(),
  sheetsLastError: text("sheets_last_error"),
  sheetsUpdatedAt: timestamp("sheets_updated_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
})

export const inquiryRateLimits = pgTable(
  "inquiry_rate_limits",
  {
    scope: varchar("scope", { length: 16 }).notNull(),
    subjectHash: varchar("subject_hash", { length: 64 }).notNull(),
    windowStartedAt: timestamp("window_started_at", {
      withTimezone: true,
    }).notNull(),
    requestCount: integer("request_count").default(0).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.scope, table.subjectHash] })]
)

export const inquiryRateLimitAcceptances = pgTable(
  "inquiry_rate_limit_acceptances",
  {
    scope: varchar("scope", { length: 16 }).notNull(),
    subjectHash: varchar("subject_hash", { length: 64 }).notNull(),
    inquiryId: varchar("inquiry_id", { length: 100 }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.scope, table.subjectHash, table.inquiryId] }),
    index("inquiry_acceptances_subject_idx").on(
      table.scope,
      table.subjectHash,
      table.acceptedAt
    ),
  ]
)

export const availabilitySettings = pgTable("availability_settings", {
  id: varchar("id", { length: 32 }).primaryKey(),
  enabled: boolean("enabled").default(true).notNull(),
  sectionTitle: varchar("section_title", { length: 80 }).notNull(),
  cardTitle: varchar("card_title", { length: 100 }).notNull(),
  description: varchar("description", { length: 240 }).notNull(),
  ctaLabel: varchar("cta_label", { length: 60 }).notNull(),
  availability: varchar("availability", { length: 120 }).notNull(),
  workSetup: varchar("work_setup", { length: 160 }).notNull(),
  location: varchar("location", { length: 160 }).notNull(),
  timeZone: varchar("time_zone", { length: 80 }).notNull(),
  timeZoneDetail: varchar("time_zone_detail", { length: 200 }).notNull(),
  relocationVisa: varchar("relocation_visa", { length: 160 }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
})
