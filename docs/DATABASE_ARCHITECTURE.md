# Database Architecture & Schema Design

## Overview

The AI_Documentation SaaS uses PostgreSQL with Drizzle ORM and pgvector for a scalable, multi-tenant architecture supporting:
- Repository ingestion and webhook sync
- AI-powered documentation generation
- Semantic search with vector embeddings
- Role-based access control
- Audit trails for compliance

## Multi-Tenancy Model

**Organization-based isolation** ensures data separation:
- All core resources (repositories, documents, code chunks) include `organization_id`
- Queries must always filter by organization for security
- Foreign key cascades ensure org deletion cleans all tenant data
- Secrets are encrypted at rest

## Schema Design Principles

### 1. **Core Entities**
- **organizations**: Tenant container (namespace)
- **users**: Application users with auth provider integration
- **memberships**: User-org relationships with role-based access

### 2. **Repository Management**
- **repositories**: GitHub/GitLab repos linked to organizations
- Tracks provider ID, installation ID, webhook secrets, sync state
- Webhook secrets encrypted with AES-256-GCM

### 3. **Documentation Pipeline**
- **documents**: Generated markdown documentation
- Supports multiple doc types (README, API, modules, guides)
- Status workflow: draft → generated → approved
- Metadata JSON for extensible properties

### 4. **Code Analysis**
- **code_chunks**: Parsed code symbols with embeddings
- Stores raw code, symbol info, and AI-generated summaries
- **embedding (vector)**: 768-dimensional for Gemini compatibility
- Content hash prevents duplicate processing
- HNSW index enables fast cosine similarity search

### 5. **Sync Tracking**
- **sync_runs**: Audit trail for repository synchronization
- Tracks status, trigger type, error messages, timing
- Enables recovery and manual intervention for failed syncs

## Indexing Strategy

**Performance Optimization:**
- B-tree indexes on high-cardinality columns (ID, email, org_id)
- Partial indexes on status columns for filtering
- **HNSW vector index** on code_chunks.embedding (cosine distance)

**Lookup Patterns:**
```
org by slug → organizations.slug_idx
user by email → users.email_idx
memberships by user → memberships.user_id_idx
repos by org → repositories.org_id_idx
chunks by org → code_chunks.org_id_idx
vector search → code_chunks.embedding_hnsw_idx
```

## Constraints

**Uniqueness:**
- organizations.slug (unique per platform)
- users.email (global unique)
- users.auth_provider_id (prevents duplicate auth)
- memberships (user_id, organization_id) unique pair
- code_chunks.content_hash (prevents duplicate parsing)

**Referential Integrity:**
All foreign keys with ON DELETE CASCADE ensure:
- Org deletion removes all dependent data
- Repo deletion removes docs and chunks
- User deletion removes memberships

## Vector Embeddings

**Gemini Integration:**
- 768-dimensional vectors (Gemini's standard)
- Stored as pgvector type in PostgreSQL
- HNSW index with cosine similarity metric
- Enables semantic search: "Find similar error handling code"

**Queries:**
```sql
SELECT * FROM code_chunks
ORDER BY embedding <=> query_embedding::vector
LIMIT 10;
```

## Security

**Encryption:**
- Webhook secrets: AES-256-GCM with random IV + auth tag
- In-transit: Use HTTPS/TLS
- At-rest: Database encryption via managed service (Neon)

**Multi-Tenancy Isolation:**
- Row-level security via organization_id
- All queries must include org filter
- Auth middleware validates org membership

## Scalability

**Denormalization Choices:**
- `organization_id` duplicated in documents and code_chunks for O(1) tenant isolation
- Avoids expensive JOINs across org boundary
- Trade small storage for query performance

**Future Optimizations:**
- Partitioning by organization for massive orgs
- Time-based partitioning for sync_runs audit log
- Columnar storage for analytics on documents
- Materialized views for dashboard queries

## Migration Pipeline

**Development:**
1. Modify schema in TypeScript files (src/schema/*.ts)
2. Run `npm run db:generate` → generates SQL in migrations/
3. Run `npm run db:migrate` → applies to database
4. Commit migrations to version control

**Production (Neon):**
1. Test migrations in staging environment
2. Run migrations with connection pool management
3. Monitor for lock timeouts on large tables
4. Use `npm run db:push` for direct cloud deployment

## Data Lifecycle

**Code Chunk Processing:**
```
1. Webhook triggers repository sync
2. Worker parses source files via tree-sitter
3. Creates code_chunk entries with raw code
4. AI service generates embeddings (Gemini API)
5. Updates embedding column
6. Document generator summarizes chunks
7. Creates document entries in markdown
```

**Retention:**
- Sync runs: Keep last 1000 per repo
- Code chunks: Archive after 30 days if repo deleted
- Documents: Archive versions after 1 year

## Monitoring

**Key Metrics:**
- Embedding table growth (vector index performance)
- Sync run failure rate
- Query latency on code_chunks similarity search
- Vector search recall on test queries

**Alerting:**
- Disk usage > 80%
- Sync runs in 'failed' state > 5
- Query latency > 500ms (p95)

## Testing

**Schema Validation:**
```bash
npm run db:generate  # Check for migration drifts
npm run db:studio   # Visual inspection
```

**Data Integrity:**
- Foreign key cascades in tests
- Tenant isolation in auth tests
- Vector search quality on fixture data

## Future Enhancements

1. **Audit Logs Table**: Track all mutations for compliance
2. **Document Versions**: Branch/merge workflows
3. **Approval Workflow**: Status gates before publication
4. **Full-Text Search**: PostgreSQL tsearch on documents
5. **Webhook Delivery Log**: Retry tracking and debugging
6. **Rate Limiting**: Counter tables for API throttling
7. **Materialized Views**: Dashboard aggregates
8. **Event Sourcing**: Audit trail for debugging
