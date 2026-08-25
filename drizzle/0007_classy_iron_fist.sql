CREATE TABLE "assistant_chat_requests" (
	"conversation_id" varchar(120) NOT NULL,
	"client_message_id" varchar(120) NOT NULL,
	"status" varchar(16) DEFAULT 'pending' NOT NULL,
	"lease_token" uuid NOT NULL,
	"lease_expires_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assistant_chat_requests_conversation_id_client_message_id_pk" PRIMARY KEY("conversation_id","client_message_id")
);
--> statement-breakpoint
CREATE INDEX "assistant_chat_requests_lease_idx" ON "assistant_chat_requests" USING btree ("status","lease_expires_at");
