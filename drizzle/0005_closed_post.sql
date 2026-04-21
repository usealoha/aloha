ALTER TABLE "automation_runs" ADD COLUMN "scheduledMessageId" text;--> statement-breakpoint
ALTER TABLE "automations" ADD COLUMN "scheduledMessageId" text;