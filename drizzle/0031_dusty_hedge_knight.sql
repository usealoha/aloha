ALTER TABLE "users" ADD COLUMN "notifyReviewSubmittedByEmail" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "notifyReviewApprovedByEmail" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "notifyReviewAssignedByEmail" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "notifyReviewCommentByEmail" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "notifyReviewMentionByEmail" boolean DEFAULT true NOT NULL;