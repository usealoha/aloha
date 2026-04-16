CREATE TABLE "bluesky_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"handle" text NOT NULL,
	"appPassword" text NOT NULL,
	"did" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bluesky_credentials_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "channelContent" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "bluesky_credentials" ADD CONSTRAINT "bluesky_credentials_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;