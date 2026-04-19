CREATE TABLE "broadcast_sends" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"broadcastId" uuid NOT NULL,
	"subscriberId" uuid NOT NULL,
	"email" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"resendMessageId" text,
	"errorMessage" text,
	"sentAt" timestamp,
	"deliveredAt" timestamp,
	"openedAt" timestamp,
	"clickedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "broadcasts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"subject" text NOT NULL,
	"preheader" text,
	"body" text NOT NULL,
	"fromName" text,
	"fromAddress" text NOT NULL,
	"replyTo" text,
	"sendingDomainId" uuid,
	"audienceFilter" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"scheduledAt" timestamp,
	"sentAt" timestamp,
	"recipientCount" integer DEFAULT 0 NOT NULL,
	"deliveredCount" integer DEFAULT 0 NOT NULL,
	"bouncedCount" integer DEFAULT 0 NOT NULL,
	"openedCount" integer DEFAULT 0 NOT NULL,
	"clickedCount" integer DEFAULT 0 NOT NULL,
	"unsubscribedCount" integer DEFAULT 0 NOT NULL,
	"generationId" uuid,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sending_domains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"domain" text NOT NULL,
	"resendDomainId" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"dkimRecords" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"verifiedAt" timestamp,
	"lastCheckedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "subscribers" ADD COLUMN "unsubscribedAt" timestamp;--> statement-breakpoint
ALTER TABLE "broadcast_sends" ADD CONSTRAINT "broadcast_sends_broadcastId_broadcasts_id_fk" FOREIGN KEY ("broadcastId") REFERENCES "public"."broadcasts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broadcast_sends" ADD CONSTRAINT "broadcast_sends_subscriberId_subscribers_id_fk" FOREIGN KEY ("subscriberId") REFERENCES "public"."subscribers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broadcasts" ADD CONSTRAINT "broadcasts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broadcasts" ADD CONSTRAINT "broadcasts_sendingDomainId_sending_domains_id_fk" FOREIGN KEY ("sendingDomainId") REFERENCES "public"."sending_domains"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broadcasts" ADD CONSTRAINT "broadcasts_generationId_generations_id_fk" FOREIGN KEY ("generationId") REFERENCES "public"."generations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sending_domains" ADD CONSTRAINT "sending_domains_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "broadcast_sends_broadcast_subscriber" ON "broadcast_sends" USING btree ("broadcastId","subscriberId");--> statement-breakpoint
CREATE UNIQUE INDEX "sending_domains_user_domain" ON "sending_domains" USING btree ("userId","domain");