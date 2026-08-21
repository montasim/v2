CREATE TABLE "blog_post_views" (
	"post_slug" varchar(200) PRIMARY KEY NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL
);
