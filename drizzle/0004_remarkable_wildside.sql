CREATE TABLE "channel_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"channel" text NOT NULL,
	"providerAccountId" text,
	"displayName" text,
	"handle" text,
	"avatarUrl" text,
	"profileUrl" text,
	"bio" text,
	"followerCount" integer,
	"fetchedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "channel_profiles" ADD CONSTRAINT "channel_profiles_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "channel_profiles_user_channel" ON "channel_profiles" USING btree ("userId","channel");