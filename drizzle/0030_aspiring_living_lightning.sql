CREATE TABLE "post_share_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"postId" uuid NOT NULL,
	"workspaceId" uuid NOT NULL,
	"createdByUserId" uuid NOT NULL,
	"token" text NOT NULL,
	"permissions" text DEFAULT 'comment_approve' NOT NULL,
	"expiresAt" timestamp,
	"revokedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "post_share_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "post_notes" ALTER COLUMN "authorUserId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "post_notes" ADD COLUMN "externalAuthor" jsonb;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "externalApproverIdentity" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "notifyReviewByEmail" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "post_share_tokens" ADD CONSTRAINT "post_share_tokens_postId_posts_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_share_tokens" ADD CONSTRAINT "post_share_tokens_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_share_tokens" ADD CONSTRAINT "post_share_tokens_createdByUserId_users_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "post_share_tokens_post" ON "post_share_tokens" USING btree ("postId");--> statement-breakpoint
CREATE INDEX "post_share_tokens_token" ON "post_share_tokens" USING btree ("token");