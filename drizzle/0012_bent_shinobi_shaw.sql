ALTER TABLE "posts" ADD COLUMN "submittedForReviewAt" timestamp;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "submittedBy" uuid;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "approvedAt" timestamp;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "approvedBy" uuid;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_submittedBy_users_id_fk" FOREIGN KEY ("submittedBy") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_approvedBy_users_id_fk" FOREIGN KEY ("approvedBy") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;