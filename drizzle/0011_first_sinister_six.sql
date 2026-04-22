ALTER TABLE "feature_access" DROP CONSTRAINT "feature_access_grantedBy_users_id_fk";
--> statement-breakpoint
ALTER TABLE "feature_access" ADD CONSTRAINT "feature_access_grantedBy_internal_users_id_fk" FOREIGN KEY ("grantedBy") REFERENCES "public"."internal_users"("id") ON DELETE set null ON UPDATE no action;