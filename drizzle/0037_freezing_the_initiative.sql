CREATE TABLE "dm_thread_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspaceId" uuid NOT NULL,
	"platform" text NOT NULL,
	"threadId" text NOT NULL,
	"counterpartyId" text NOT NULL,
	"counterpartyHandle" text NOT NULL,
	"counterpartyDisplayName" text,
	"counterpartyAvatarUrl" text,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dm_thread_profiles" ADD CONSTRAINT "dm_thread_profiles_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "dm_thread_profiles_workspace_platform_thread" ON "dm_thread_profiles" USING btree ("workspaceId","platform","threadId");