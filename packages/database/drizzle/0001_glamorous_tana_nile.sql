ALTER TABLE "code_chunks" DROP CONSTRAINT "code_chunks_org_id_fk";
--> statement-breakpoint
ALTER TABLE "code_chunks" DROP CONSTRAINT "code_chunks_repo_id_fk";
--> statement-breakpoint
DROP INDEX "code_chunks_embedding_hnsw_idx";--> statement-breakpoint
DROP INDEX "sync_runs_started_at_idx";--> statement-breakpoint
ALTER TABLE "code_chunks" ALTER COLUMN "id" SET DEFAULT 'gen_random_uuid()';--> statement-breakpoint
ALTER TABLE "code_chunks" ALTER COLUMN "embedding" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sync_runs" ADD COLUMN "delivery_id" varchar(255);--> statement-breakpoint
ALTER TABLE "sync_runs" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "code_chunks" ADD CONSTRAINT "code_chunks_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "code_chunks" ADD CONSTRAINT "code_chunks_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sync_runs_delivery_id_idx" ON "sync_runs" USING btree ("delivery_id");--> statement-breakpoint
CREATE INDEX "sync_runs_created_at_idx" ON "sync_runs" USING btree ("created_at");