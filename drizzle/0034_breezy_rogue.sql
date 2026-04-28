ALTER TABLE "posts" ADD COLUMN "evergreenMarkedAt" timestamp;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "lastResurfacedAt" timestamp;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "parentPostId" uuid;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_parentPostId_posts_id_fk" FOREIGN KEY ("parentPostId") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;