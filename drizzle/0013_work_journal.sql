CREATE TABLE "journal_companies" (
	"id" uuid PRIMARY KEY NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"name" varchar(200) NOT NULL,
	"role" varchar(200) NOT NULL,
	"start_date" date,
	"end_date" date,
	"archived" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_entries" (
	"id" uuid PRIMARY KEY NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"work_date" date NOT NULL,
	"company_id" uuid NOT NULL,
	"project_id" uuid,
	"notes" text NOT NULL,
	"reflection" text NOT NULL,
	"contributions" jsonb NOT NULL,
	"source_hash" varchar(64) NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"summary_source_hash" varchar(64),
	"draft" text,
	"draft_source_hash" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_generation_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"target_id" uuid NOT NULL,
	"state" varchar(20) DEFAULT 'started' NOT NULL,
	"model" varchar(160) NOT NULL,
	"input_tokens" integer,
	"output_tokens" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_projects" (
	"id" uuid PRIMARY KEY NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"company_id" uuid NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"archived" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_reviews" (
	"id" uuid PRIMARY KEY NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"title" varchar(200) NOT NULL,
	"from_date" date NOT NULL,
	"to_date" date NOT NULL,
	"company_id" uuid NOT NULL,
	"audience" varchar(20) NOT NULL,
	"sources" jsonb NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"draft" text,
	"generated_count" integer DEFAULT 0 NOT NULL,
	"partials" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_settings" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"timezone" varchar(100) DEFAULT 'Asia/Dhaka' NOT NULL,
	"week_starts_on" integer DEFAULT 1 NOT NULL,
	"ai_day" date,
	"ai_requests" integer DEFAULT 0 NOT NULL,
	"next_ai_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_company_id_journal_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."journal_companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_project_id_journal_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."journal_projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_projects" ADD CONSTRAINT "journal_projects_company_id_journal_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."journal_companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_reviews" ADD CONSTRAINT "journal_reviews_company_id_journal_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."journal_companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "journal_entries_company_date_idx" ON "journal_entries" USING btree ("company_id","work_date");--> statement-breakpoint
CREATE INDEX "journal_entries_date_idx" ON "journal_entries" USING btree ("work_date");--> statement-breakpoint
CREATE INDEX "journal_projects_company_idx" ON "journal_projects" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "journal_reviews_created_idx" ON "journal_reviews" USING btree ("created_at");