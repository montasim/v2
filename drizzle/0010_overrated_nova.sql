ALTER TABLE "assistant_provider_states" ADD COLUMN "model" varchar(160) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "assistant_provider_states" DROP CONSTRAINT "assistant_provider_states_pkey";--> statement-breakpoint
ALTER TABLE "assistant_provider_states" ADD CONSTRAINT "assistant_provider_states_provider_model_pk" PRIMARY KEY("provider","model");--> statement-breakpoint
ALTER TABLE "assistant_provider_states" ALTER COLUMN "model" DROP DEFAULT;
