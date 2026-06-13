# Database Package

PostgreSQL + Drizzle ORM database layer with pgvector support for the AI Documentation SaaS.

## Overview

This package contains:
- **Schema definitions** using Drizzle ORM with TypeScript
- **Database client** and typed query wrappers
- **Migration pipeline** via drizzle-kit
- **pgvector support** for semantic search with 768-dim embeddings
- **Multi-tenant architecture** with proper isolation

## Schema

### Core Tables

#### organizations
Multi-tenant container for all project resources.
- `id` (UUID): Primary key
- `name` (varchar): Organization name
- `slug` (varchar): URL-safe identifier (unique)
- `created_at`, `updated_at`: Timestamps

#### users
Application users with auth provider integration.
- `id` (UUID): Primary key
- `auth_provider_id` (varchar): Auth0/Google/GitHub ID (unique)
- `email` (varchar): User email (unique)
- `full_name`, `avatar_url`: Profile data
- `created_at`, `updated_at`: Timestamps

#### memberships
User-organization relationships with role-based access.
- `id` (UUID): Primary key
- `user_id` (FK): Reference to users
- `organization_id` (FK): Reference to organizations
- `role` (varchar): 'owner' | 'admin' | 'member'
- `created_at`, `updated_at`: Timestamps
- Unique constraint on (user_id, organization_id)

#### repositories
GitHub/GitLab repositories synced for documentation generation.
- `id` (UUID): Primary key
- `organization_id` (FK): Tenant isolation
- `provider` (varchar): 'github' | 'gitlab'
- `provider_repo_id` (varchar): Provider-specific ID
- `full_name` (varchar): "owner/repo" format
- `default_branch` (varchar): Default branch (usually 'main')
- `github_installation_id`: GitHub App installation ID
- `webhook_secret_encrypted` (text): Encrypted webhook secret
- `last_synced_commit_sha`: Track latest sync point
- `created_at`, `updated_at`: Timestamps

#### documents
Generated documentation for code entities.
- `id` (UUID): Primary key
- `organization_id` (FK): Tenant isolation
- `repository_id` (FK): Parent repository
- `file_path` (varchar): Source file path in repo
- `title`, `slug`: Document metadata
- `doc_type` (varchar): 'readme' | 'api' | 'module' | 'guide'
- `status` (varchar): 'draft' | 'generated' | 'approved'
- `markdown_content` (text): Generated markdown
- `metadata_json` (text): Custom metadata (stringified)
- `created_at`, `updated_at`: Timestamps

#### code_chunks
Parsed code snippets with vector embeddings for semantic search.
- `id` (UUID): Primary key
- `organization_id` (FK): Tenant isolation
- `repository_id` (FK): Parent repository
- `file_path` (varchar): Source file
- `symbol_name` (varchar): Function/class/method name
- `language` (varchar): Programming language
- `start_line`, `end_line` (integer): Code location
- `raw_code` (text): Source code
- `summary` (text): AI-generated summary
- **embedding (vector)**: 768-dimensional embedding (Gemini compatible)
- `content_hash` (varchar): SHA256 of raw_code for deduplication
- `created_at`, `updated_at`: Timestamps
- **HNSW index on embedding** with cosine distance for fast similarity search

#### sync_runs
Audit trail of repository synchronization jobs.
- `id` (UUID): Primary key
- `repository_id` (FK): Parent repository
- `commit_sha` (varchar): Git commit SHA
- `branch` (varchar): Branch name
- `status` (varchar): 'pending' | 'running' | 'completed' | 'failed'
- `trigger_type` (varchar): 'webhook' | 'manual' | 'scheduled'
- `error_message` (text): Failure reason if applicable
- `started_at`, `finished_at`: Timing data

## Setup

### 1. Start Local Database

```bash
npm run docker:up
```

This starts PostgreSQL 16 with pgvector support on localhost:5432.

### 2. Generate Migrations

```bash
npm run db:generate
```

Creates SQL migration files in `packages/database/migrations/` based on schema changes.

### 3. Apply Migrations

```bash
npm run db:migrate
```

Applies all pending migrations to the database.

## Usage

### Import and Use

```typescript
import { DatabaseService } from '@ai-docs/database';
import { organizations, users } from '@ai-docs/database';

// Create an organization
const org = await DatabaseService.createOrganization({
  name: 'My Company',
  slug: 'my-company',
});

// Get user memberships
const memberships = await DatabaseService.getMembershipsByUserId(userId);

// Vector similarity search
const results = await DatabaseService.searchCodeChunksByEmbedding(
  embedding, // 768-dim array
  organizationId,
  10 // limit
);
```

### Direct Drizzle Queries

```typescript
import { db } from '@ai-docs/database';
import { repositories, eq } from '@ai-docs/database';

const repos = await db
  .select()
  .from(repositories)
  .where(eq(repositories.organizationId, orgId));
```

## Encryption

Webhook secrets and other sensitive data are encrypted using AES-256-GCM.

```typescript
import { encryptSecret, decryptSecret } from '@ai-docs/database';

const encrypted = encryptSecret('webhook-secret-xyz');
const decrypted = decryptSecret(encrypted);
```

Set `ENCRYPTION_KEY` environment variable (32 chars) for production.

## Development Tools

### Drizzle Studio (GUI)

```bash
npm run db:studio
```

Opens interactive schema explorer at `https://local.drizzle.studio`

### Push Schema (Neon Cloud)

```bash
npm run db:push
```

Directly push schema changes to Neon PostgreSQL without migration files.

## Indexes

Strategic indexes for performance:
- `organizations.slug`
- `users.email`, `users.auth_provider_id`
- `memberships.user_id`, `memberships.organization_id`
- `repositories.organization_id`
- `documents.organization_id`, `documents.repository_id`, `documents.status`
- `code_chunks.organization_id`, `code_chunks.repository_id`, `code_chunks.symbol_name`
- **`code_chunks.embedding` (HNSW)**: Vector similarity search
- `sync_runs.repository_id`, `sync_runs.status`

## Foreign Keys

All relationships enforce referential integrity with ON DELETE CASCADE for tenant cleanup:
- `memberships` → `users`, `organizations`
- `repositories` → `organizations`
- `documents` → `organizations`, `repositories`
- `code_chunks` → `organizations`, `repositories`
- `sync_runs` → `repositories`

## Multi-Tenancy

- **organization_id** is denormalized across documents and code_chunks for direct tenant isolation
- All queries should filter by organization_id
- Cascade deletes ensure data cleanup when organization is removed

## Future Extensions

- Audit logs table for compliance
- Document versions for revision history
- Approval workflows with status tracking
- Semantic search rankings
- Full-text search on documents
- Webhook delivery log
- Rate limiting counters
