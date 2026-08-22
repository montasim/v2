CREATE TABLE "assistant_exchanges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar(120) NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"source" varchar(160) NOT NULL,
	"provider" varchar(40) NOT NULL,
	"model" varchar(120) NOT NULL,
	"used_fallback" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "availability_settings" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"section_title" varchar(80) NOT NULL,
	"card_title" varchar(100) NOT NULL,
	"description" varchar(240) NOT NULL,
	"cta_label" varchar(60) NOT NULL,
	"availability" varchar(120) NOT NULL,
	"work_setup" varchar(160) NOT NULL,
	"location" varchar(160) NOT NULL,
	"time_zone" varchar(80) NOT NULL,
	"time_zone_detail" varchar(200) NOT NULL,
	"relocation_visa" varchar(160) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolio_inquiries" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"type" varchar(20) NOT NULL,
	"name" varchar(80) NOT NULL,
	"email" varchar(320) NOT NULL,
	"context" text,
	"role" varchar(100),
	"arrangement" varchar(100),
	"project_type" varchar(100),
	"timeline" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "assistant_exchanges_conversation_idx" ON "assistant_exchanges" USING btree ("conversation_id","created_at");