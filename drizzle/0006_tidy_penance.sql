CREATE TABLE "assistant_provider_states" (
	"provider" varchar(40) PRIMARY KEY NOT NULL,
	"disabled_until" timestamp with time zone,
	"reason" varchar(120),
	"last_cost_usd" numeric(16, 10),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assistant_rate_limits" (
	"scope" varchar(32) NOT NULL,
	"subject_hash" varchar(64) NOT NULL,
	"window_started_at" timestamp with time zone NOT NULL,
	"request_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assistant_rate_limits_scope_subject_hash_pk" PRIMARY KEY("scope","subject_hash")
);
--> statement-breakpoint
CREATE TABLE "inquiry_rate_limit_acceptances" (
	"scope" varchar(16) NOT NULL,
	"subject_hash" varchar(64) NOT NULL,
	"inquiry_id" varchar(100) NOT NULL,
	"accepted_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inquiry_rate_limit_acceptances_scope_subject_hash_inquiry_id_pk" PRIMARY KEY("scope","subject_hash","inquiry_id")
);
--> statement-breakpoint
CREATE TABLE "inquiry_rate_limits" (
	"scope" varchar(16) NOT NULL,
	"subject_hash" varchar(64) NOT NULL,
	"window_started_at" timestamp with time zone NOT NULL,
	"request_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inquiry_rate_limits_scope_subject_hash_pk" PRIMARY KEY("scope","subject_hash")
);
--> statement-breakpoint
CREATE TABLE "portfolio_evidence_manifests" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"corpus_hash" varchar(64) NOT NULL,
	"embedding_model" varchar(80) NOT NULL,
	"document_count" integer NOT NULL,
	"built_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assistant_exchanges" ALTER COLUMN "provider" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "assistant_exchanges" ALTER COLUMN "model" SET DATA TYPE varchar(160);--> statement-breakpoint
ALTER TABLE "assistant_exchanges" ALTER COLUMN "model" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "assistant_exchanges" ADD COLUMN "client_message_id" varchar(120);--> statement-breakpoint
ALTER TABLE "assistant_exchanges" ADD COLUMN "response_kind" varchar(24) DEFAULT 'generated' NOT NULL;--> statement-breakpoint
ALTER TABLE "assistant_exchanges" ADD COLUMN "contact_action" varchar(24);--> statement-breakpoint
ALTER TABLE "assistant_exchanges" ADD COLUMN "handoff_reason" varchar(40);--> statement-breakpoint
ALTER TABLE "assistant_exchanges" ADD COLUMN "served_model" varchar(160);--> statement-breakpoint
ALTER TABLE "assistant_exchanges" ADD COLUMN "fallback_depth" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "assistant_exchanges" ADD COLUMN "citations" jsonb;--> statement-breakpoint
ALTER TABLE "assistant_exchanges" ADD COLUMN "evidence_ids" jsonb;--> statement-breakpoint
ALTER TABLE "assistant_exchanges" ADD COLUMN "retrieval_metadata" jsonb;--> statement-breakpoint
ALTER TABLE "assistant_exchanges" ADD COLUMN "provider_attempts" jsonb;--> statement-breakpoint
ALTER TABLE "assistant_exchanges" ADD COLUMN "validation_status" varchar(32) DEFAULT 'accepted' NOT NULL;--> statement-breakpoint
ALTER TABLE "assistant_exchanges" ADD COLUMN "latency_ms" integer;--> statement-breakpoint
ALTER TABLE "assistant_exchanges" ADD COLUMN "input_tokens" integer;--> statement-breakpoint
ALTER TABLE "assistant_exchanges" ADD COLUMN "output_tokens" integer;--> statement-breakpoint
ALTER TABLE "assistant_exchanges" ADD COLUMN "cost_usd" numeric(16, 10);--> statement-breakpoint
ALTER TABLE "assistant_exchanges" ADD COLUMN "policy_version" varchar(40);--> statement-breakpoint
ALTER TABLE "assistant_exchanges" ADD COLUMN "corpus_version" varchar(64);--> statement-breakpoint
UPDATE "assistant_exchanges"
SET
	"response_kind" = 'legacy',
	"validation_status" = 'legacy-unverified'
WHERE "policy_version" IS NULL;--> statement-breakpoint
ALTER TABLE "portfolio_inquiries" ADD COLUMN "visitor_hash" varchar(64);--> statement-breakpoint
ALTER TABLE "portfolio_inquiries" ADD COLUMN "email_hash" varchar(64);--> statement-breakpoint
ALTER TABLE "portfolio_inquiries" ADD COLUMN "resend_owner_state" varchar(16) DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "portfolio_inquiries" ADD COLUMN "resend_owner_last_error" text;--> statement-breakpoint
ALTER TABLE "portfolio_inquiries" ADD COLUMN "resend_owner_updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "portfolio_inquiries" ADD COLUMN "resend_ack_state" varchar(16) DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "portfolio_inquiries" ADD COLUMN "resend_ack_last_error" text;--> statement-breakpoint
ALTER TABLE "portfolio_inquiries" ADD COLUMN "resend_ack_updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "portfolio_inquiries" ADD COLUMN "sheets_state" varchar(16) DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "portfolio_inquiries" ADD COLUMN "sheets_last_error" text;--> statement-breakpoint
ALTER TABLE "portfolio_inquiries" ADD COLUMN "sheets_updated_at" timestamp with time zone;--> statement-breakpoint
UPDATE "portfolio_inquiries"
SET
	"resend_owner_state" = 'sent',
	"resend_ack_state" = 'sent',
	"sheets_state" = 'sent';--> statement-breakpoint
CREATE INDEX "inquiry_acceptances_subject_idx" ON "inquiry_rate_limit_acceptances" USING btree ("scope","subject_hash","accepted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "assistant_exchanges_message_idx" ON "assistant_exchanges" USING btree ("conversation_id","client_message_id");
