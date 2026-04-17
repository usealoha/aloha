CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"source" text NOT NULL,
	"url" text NOT NULL,
	"mimeType" text NOT NULL,
	"width" integer,
	"height" integer,
	"alt" text,
	"prompt" text,
	"sourceGenerationId" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_sourceGenerationId_generations_id_fk" FOREIGN KEY ("sourceGenerationId") REFERENCES "public"."generations"("id") ON DELETE set null ON UPDATE no action;