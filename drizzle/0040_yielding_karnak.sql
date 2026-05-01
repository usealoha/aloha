ALTER TABLE "workspaces" ADD COLUMN "trialEndsAt" timestamp;
--> statement-breakpoint
-- Backfill: existing workspaces get a 30-day window from their creation
-- date. Anything older than 30 days is therefore already an expired trial.
UPDATE "workspaces" SET "trialEndsAt" = "createdAt" + INTERVAL '30 days' WHERE "trialEndsAt" IS NULL;