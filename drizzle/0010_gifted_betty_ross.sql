CREATE TABLE "brand_corpus" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"source" text NOT NULL,
	"sourceId" text NOT NULL,
	"title" text,
	"content" text NOT NULL,
	"url" text,
	"fetchedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notion_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"accessToken" text NOT NULL,
	"workspaceId" text NOT NULL,
	"workspaceName" text,
	"workspaceIcon" text,
	"botId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notion_credentials_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
ALTER TABLE "brand_corpus" ADD CONSTRAINT "brand_corpus_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notion_credentials" ADD CONSTRAINT "notion_credentials_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "brand_corpus_user_source_sourceid" ON "brand_corpus" USING btree ("userId","source","sourceId");