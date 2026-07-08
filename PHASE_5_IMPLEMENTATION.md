# Phase 5 Implementation: Semantic Search & Vector Embeddings

## Overview

Phase 5 adds semantic search using embeddings, stores GPT-generated documentation and embeddings in PostgreSQL with pgvector, and updates the worker pipeline to generate documentation and embeddings automatically.

## Folder Structure

- `packages/ai-engine/src/embeddings/`
  - `embedding.service.ts`
  - `index.ts`
- `apps/api/src/search/`
  - `search.service.ts`
  - `search.controller.ts`
  - `search.module.ts`
- `scripts/seed-phase5.ts`
- `packages/database/src/schema/code-chunks.ts`

## New Services

- `EmbeddingService` in `packages/ai-engine/src/embeddings/embedding.service.ts`
  - Uses `@google/generative-ai` model `text-embedding-004`
  - Generates embeddings for documentation and queries
- `SearchService` in `apps/api/src/search/search.service.ts`
  - Uses query embeddings and pgvector cosine similarity search
  - Filters by `organization_id` and optional `repository_id`
  - Caches query embeddings in Redis when available
- `SearchController` in `apps/api/src/search/search.controller.ts`
  - Provides `GET /api/search` endpoint
  - Validates `q` and `organizationId`
  - Returns only lightweight search results
- `SearchModule` in `apps/api/src/search/search.module.ts`
  - Registered in `apps/api/src/app.module.ts`

## Modified Files

- `packages/ai-engine/src/types.ts`
  - Added `SearchableChunk`
  - Added `EmbeddingResult`
- `packages/ai-engine/src/index.ts`
  - Exported embeddings module
- `packages/database/src/schema/code-chunks.ts`
  - Added `markdown` and `mermaid_diagram` columns
  - Added `code_chunks_embedding_hnsw_idx` HNSW index
- `apps/api/src/app.module.ts`
  - Added `SearchModule`
- `package.json`
  - Added `seed:phase5` script

## Database Changes

- `code_chunks` now includes:
  - `markdown` text
  - `mermaid_diagram` text
- Fixed HNSW index definition for pgvector:
  - `embeddingHnswIdx: index('code_chunks_embedding_hnsw_idx').using('hnsw', table.embedding.op('vector_cosine_ops'))`
- Comment added: `Run: pnpm --filter @ai-docs/database generate then migrate`

## Worker Flow

Updated worker pipeline in `apps/worker/src/processors/github-sync.processor.ts`:

1. Pull changed file content from GitHub
2. Extract symbols using `extractStructure`
3. Generate documentation for each symbol with `AIEngineService`
4. Generate documentation embedding with `EmbeddingService`
5. Insert or update matching `code_chunks` rows
6. Log failures and continue processing remaining symbols

## Search Flow

- Query embedding generated from user text
- Search limited to selected organization and optional repository
- Vector search ordered by cosine similarity using pgvector
- Top results returned with `similarityScore`
- Result shape includes:
  - `id`
  - `symbolName`
  - `filePath`
  - `summary`
  - `rawCode`
  - `similarityScore`

## Embedding Flow

- Embeddings are generated from documentation content instead of raw code
- Documentation input includes:
  - `symbolName`
  - `filePath`
  - `markdown`
  - `mermaidDiagram`
- Query embedding is cached in Redis with SHA-256 key

## Redis Cache Flow

- `SearchService` attempts to connect to Redis at `REDIS_URL`
- If Redis is unavailable, searches still work using direct embedding generation
- Caching is limited to query embeddings for faster repeated searches

## API Endpoints

- `GET /api/search?q=...&organizationId=...&repositoryId=...&limit=...&minScore=...`

## Environment Variables

- `GEMINI_API_KEY`
- `DATABASE_URL`
- `REDIS_URL` (optional)
- `GITHUB_APP_ID`
- `GITHUB_APP_PRIVATE_KEY`
- `GITHUB_WEBHOOK_SECRET`

## Testing Instructions

- Run `pnpm seed:phase5` to create sample code chunks and embeddings
- Start the API and use `GET /api/search` to verify semantic search results
- Confirm worker logs show documentation and embedding generation on sync jobs

## Notes

- No migrations were applied automatically
- Existing `scripts/seed.ts` was preserved
- HNSW index fix requires running database generation and migration manually
