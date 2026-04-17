ALTER TABLE "notion_credentials" ADD COLUMN "reauthRequired" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "notion_credentials" ADD COLUMN "lastSyncedAt" timestamp;