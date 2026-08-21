import {
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
