ALTER TABLE "organizations" ADD COLUMN "clerk_org_id" varchar(255);--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_clerk_org_id_unique" UNIQUE("clerk_org_id");