ALTER TABLE "portfolio_inquiries" ALTER COLUMN "name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "portfolio_inquiries" ADD COLUMN "topic" varchar(30);--> statement-breakpoint
ALTER TABLE "portfolio_inquiries" ADD COLUMN "project_id" varchar(200);--> statement-breakpoint
ALTER TABLE "portfolio_inquiries" ADD COLUMN "project_title" varchar(300);--> statement-breakpoint
ALTER TABLE "portfolio_inquiries" ADD COLUMN "related_path" varchar(300);--> statement-breakpoint
ALTER TABLE "portfolio_inquiries" ADD COLUMN "related_title" varchar(300);--> statement-breakpoint
ALTER TABLE "portfolio_inquiries" ADD COLUMN "unlisted_project" varchar(160);--> statement-breakpoint
ALTER TABLE "portfolio_inquiries" ADD COLUMN "platform" varchar(100);--> statement-breakpoint
ALTER TABLE "portfolio_inquiries" ADD COLUMN "app_version" varchar(100);