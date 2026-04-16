CREATE TABLE "inbox_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"platform" text NOT NULL,
	"remoteId" text NOT NULL,
	"threadId" text,
	"parentId" text,
	"reason" text NOT NULL,
	"authorDid" text NOT NULL,
	"authorHandle" text NOT NULL,
	"authorDisplayName" text,
	"authorAvatarUrl" text,
	"content" text NOT NULL,
	"isRead" boolean DEFAULT false NOT NULL,
	"platformData" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"platformCreatedAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inbox_sync_cursors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"platform" text NOT NULL,
	"cursor" text,
	"lastSyncedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wishlist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"message" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "inbox_messages" ADD CONSTRAINT "inbox_messages_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbox_sync_cursors" ADD CONSTRAINT "inbox_sync_cursors_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "inbox_messages_user_platform_remote" ON "inbox_messages" USING btree ("userId","platform","remoteId");--> statement-breakpoint
CREATE UNIQUE INDEX "inbox_sync_cursors_user_platform" ON "inbox_sync_cursors" USING btree ("userId","platform");