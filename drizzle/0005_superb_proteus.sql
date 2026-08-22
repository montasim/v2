CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
CREATE TABLE "portfolio_evidence_documents" (
	"id" varchar(240) PRIMARY KEY NOT NULL,
	"source" varchar(80) NOT NULL,
	"title" varchar(240) NOT NULL,
	"content" text NOT NULL,
	"citation_label" varchar(260) NOT NULL,
	"citation_href" varchar(320) NOT NULL,
	"citation_kind" varchar(32) NOT NULL,
	"content_hash" varchar(64) NOT NULL,
	"embedding_model" varchar(80) NOT NULL,
	"embedding" vector(768) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "portfolio_evidence_source_idx" ON "portfolio_evidence_documents" USING btree ("source");--> statement-breakpoint
CREATE INDEX "portfolio_evidence_content_hash_idx" ON "portfolio_evidence_documents" USING btree ("content_hash");
