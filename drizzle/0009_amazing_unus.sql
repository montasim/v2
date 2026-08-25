CREATE TABLE "assistant_chat_questions" (
	"conversation_id" varchar(120) NOT NULL,
	"client_message_id" varchar(120) NOT NULL,
	"question" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assistant_chat_questions_conversation_id_client_message_id_pk" PRIMARY KEY("conversation_id","client_message_id")
);
--> statement-breakpoint
CREATE INDEX "assistant_chat_questions_created_idx" ON "assistant_chat_questions" USING btree ("created_at");
