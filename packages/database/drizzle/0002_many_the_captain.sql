ALTER TABLE "code_chunks" ADD COLUMN "markdown" text;--> statement-breakpoint
ALTER TABLE "code_chunks" ADD COLUMN "mermaid_diagram" text;--> statement-breakpoint
CREATE INDEX "code_chunks_embedding_hnsw_idx" ON "code_chunks" USING hnsw ("embedding" vector_cosine_ops);