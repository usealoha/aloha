ALTER TABLE "workspaces" ADD COLUMN "shortId" text;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_shortId_unique" UNIQUE("shortId");