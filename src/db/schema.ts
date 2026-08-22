import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
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

export const projectCaseStudyViews = pgTable("project_case_study_views", {
  caseStudySlug: varchar("case_study_slug", { length: 200 }).primaryKey(),
  viewCount: integer("view_count").default(0).notNull(),
})

export const assistantExchanges = pgTable(
  "assistant_exchanges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: varchar("conversation_id", { length: 120 }).notNull(),
    question: text("question").notNull(),
    answer: text("answer").notNull(),
    source: varchar("source", { length: 160 }).notNull(),
    provider: varchar("provider", { length: 40 }).notNull(),
    model: varchar("model", { length: 120 }).notNull(),
    usedFallback: boolean("used_fallback").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("assistant_exchanges_conversation_idx").on(
      table.conversationId,
      table.createdAt
    ),
  ]
)

export const portfolioInquiries = pgTable("portfolio_inquiries", {
  id: varchar("id", { length: 100 }).primaryKey(),
  type: varchar("type", { length: 20 }).notNull(),
  name: varchar("name", { length: 80 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  context: text("context"),
  role: varchar("role", { length: 100 }),
  arrangement: varchar("arrangement", { length: 100 }),
  projectType: varchar("project_type", { length: 100 }),
  timeline: varchar("timeline", { length: 100 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
})

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
