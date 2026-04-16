CREATE TABLE "mastodon_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"instanceUrl" text NOT NULL,
	"accessToken" text NOT NULL,
	"accountId" text NOT NULL,
	"username" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mastodon_credentials_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
ALTER TABLE "mastodon_credentials" ADD CONSTRAINT "mastodon_credentials_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;