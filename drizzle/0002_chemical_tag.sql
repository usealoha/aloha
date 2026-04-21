CREATE TABLE "feature_access" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"feature" text NOT NULL,
	"requestedAt" timestamp,
	"grantedAt" timestamp,
	"grantedBy" uuid,
	"revokedAt" timestamp,
	"note" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "feature_access" ADD CONSTRAINT "feature_access_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_access" ADD CONSTRAINT "feature_access_grantedBy_users_id_fk" FOREIGN KEY ("grantedBy") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "feature_access_user_feature" ON "feature_access" USING btree ("userId","feature");--> statement-breakpoint
CREATE INDEX "feature_access_feature_requested" ON "feature_access" USING btree ("feature","requestedAt");