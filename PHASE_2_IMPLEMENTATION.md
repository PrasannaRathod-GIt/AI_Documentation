# Phase 2 Implementation Summary

## Overview
This document summarizes the GitHub webhook ingestion implementation for Phase 2 of the AI_Documentation monorepo.

## Files Created

### GitHub Module Files

#### `apps/api/src/github/github.module.ts`
- NestJS module definition
- Imports QueueModule
- Exports GitHubService for external use

#### `apps/api/src/github/github.controller.ts`
- Webhook endpoint: `POST /api/webhooks/github`
- Validates GitHub headers (event, signature, delivery ID)
- Verifies HMAC SHA-256 signature using timing-safe comparison
- Accepts only `push` events
- Creates/updates sync run in database
- Enqueues job to BullMQ with GitHub Delivery ID as job ID
- Returns 200 OK immediately

#### `apps/api/src/github/github.service.ts`
- `findOrCreateSyncRun()` - Creates sync run with idempotent delivery ID check
- `findRepositoryByProviderId()` - Looks up repository by GitHub ID
- `buildJobPayload()` - Constructs the job payload for the queue

#### `apps/api/src/github/github-signature.ts`
- `verifyGitHubSignature()` - Validates GitHub webhook signature
- Uses Node's `crypto.timingSafeEqual()` for timing attack protection
- Supports SHA-256 algorithm (GitHub's current standard)

### Queue Module Files

#### `apps/api/src/queue/queue.module.ts`
- NestJS module definition
- Provides GitHubSyncQueue service

#### `apps/api/src/queue/github-sync.queue.ts`
- BullMQ queue instance for GitHub sync jobs
- `enqueueSync()` - Adds job with delivery ID as job ID (ensures idempotency)
- Configures retry strategy (3 attempts, exponential backoff)
- Keeps completed jobs for 24 hours

#### `apps/api/src/queue/github-sync.processor.ts`
- Worker processor for handling queue jobs
- Updates sync run status: `RUNNING` → `COMPLETED` or `FAILED`
- Logs job payload (ready for Phase 3)
- Handles graceful startup/shutdown
- Error handling with sync run status updates

### Worker Files

#### `apps/api/src/worker/github-sync-worker.ts`
- Standalone worker script
- Can be run in separate process: `npx tsx src/worker/github-sync-worker.ts`
- Handles SIGTERM/SIGINT gracefully

### Documentation & Configuration

#### `apps/api/.env.example`
- Environment variable template
- GITHUB_WEBHOOK_SECRET
- REDIS_URL
- WORKER_CONCURRENCY

#### `apps/api/GITHUB_WEBHOOK_SETUP.md`
- Complete setup instructions
- Architecture overview
- GitHub configuration guide
- Testing examples
- Monitoring instructions

## Files Updated

### `apps/api/src/main.ts`
**Change**: Enabled raw body support for NestJS
```typescript
const app = await NestFactory.create(AppModule, {
  rawBody: true,  // NEW: Enable raw body for signature verification
});
```

### `apps/api/src/app.module.ts`
**Change**: Imported GitHubModule
```typescript
import { GitHubModule } from './github/github.module';

@Module({
  imports: [GitHubModule],  // NEW
  ...
})
```

### `apps/api/package.json`
**Changes**: Added required dependencies
```json
{
  "dependencies": {
    "@ai-docs/database": "*",        // NEW: Database access
    "bullmq": "^5.0.0",               // NEW: Job queue
    "redis": "^4.7.0",                // NEW: Redis client
    "drizzle-orm": "^0.45.2"          // NEW: Database ORM
  }
}
```

### `packages/database/src/schema/sync-runs.ts`
**Changes**: Added idempotency and tracking fields
```typescript
deliveryId: varchar('delivery_id', { length: 255 })  // NEW: GitHub delivery ID
createdAt: timestamp('created_at', { withTimezone: true })  // NEW: Creation timestamp
// Removed: startedAtIdx
// Added: deliveryIdIdx, createdAtIdx
```

## Architecture Overview

```
GitHub Event
    ↓
[Webhook Endpoint]
  ├─ Validate signature (timing-safe)
  ├─ Check headers
  ├─ Find repository
  ├─ Find/Create sync_run (idempotent)
  └─ Enqueue job → Redis/BullMQ
    ↓
[BullMQ Queue]
  ├─ Job ID = GitHub Delivery ID
  ├─ Retry strategy: 3 attempts
  └─ Exponential backoff
    ↓
[Worker Processor]
  ├─ Update sync_run → RUNNING
  ├─ Log job (ready for Phase 3)
  ├─ Update sync_run → COMPLETED
  └─ Handle errors → FAILED
```

## Idempotency Mechanisms

### 1. BullMQ Job ID
- Uses GitHub's `X-GitHub-Delivery` header as job ID
- BullMQ prevents duplicate jobs with the same ID
- If GitHub retries, the existing job is returned

### 2. Database Sync Run
- Before creating new sync run, checks for existing delivery ID
- Uses `deliveryId` index for fast lookups
- Returns existing sync run if already created

## Security Features

1. **HMAC SHA-256 Signature Verification**
   - Validates all incoming webhooks
   - Timing-safe comparison using `crypto.timingSafeEqual()`
   - Protects against timing attacks

2. **Webhook Secret**
   - Configured via `GITHUB_WEBHOOK_SECRET` env var
   - Required for signature verification
   - Should be stored securely (e.g., secrets vault)

3. **Request Validation**
   - Validates required headers
   - Returns 400 for missing headers
   - Returns 401 for invalid signatures

## Performance Characteristics

- **Webhook Response Time**: < 100ms (synchronous operations only)
- **Queue Processing**: Asynchronous (doesn't block webhook)
- **Job Retries**: Up to 3 attempts with exponential backoff
- **Concurrency**: Configurable via `WORKER_CONCURRENCY` (default: 2)

## Database Changes

### sync_runs Table
```sql
ALTER TABLE sync_runs
  ADD COLUMN delivery_id varchar(255),
  ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;

CREATE INDEX sync_runs_delivery_id_idx ON sync_runs(delivery_id);
CREATE INDEX sync_runs_created_at_idx ON sync_runs(created_at);
```

## Migration Steps

1. **Install dependencies**: `npm install`
2. **Run migration**: `npm run db:push`
3. **Set environment variables**: Create `.env` from `.env.example`
4. **Start API**: `npm run dev`
5. **Start worker** (in separate terminal): `npx tsx src/worker/github-sync-worker.ts`

## Testing

### Manual Webhook Test
```bash
# Use provided curl command in GITHUB_WEBHOOK_SETUP.md
# Or configure GitHub webhook to point to your server
```

### Check Sync Status
```sql
SELECT * FROM sync_runs ORDER BY created_at DESC LIMIT 10;
```

## Phase 3 Readiness

All TODOs are marked in `src/queue/github-sync.processor.ts`:
- Clone repository
- Parse code with code-parser
- Create chunks and embeddings
- Persist to database
- Update lastSyncedCommitSha

The processor is ready to be extended with this functionality.

## Monitoring & Debugging

### View Queue Status
```bash
redis-cli
> LLEN "bull:github-sync:waiting"
> LLEN "bull:github-sync:active"
> LLEN "bull:github-sync:completed"
```

### Check Sync Runs
```sql
-- Last 10 syncs
SELECT id, repository_id, status, delivery_id, created_at 
FROM sync_runs 
ORDER BY created_at DESC 
LIMIT 10;

-- Failed syncs
SELECT id, repository_id, error_message, created_at 
FROM sync_runs 
WHERE status = 'FAILED' 
ORDER BY created_at DESC;
```

### View Logs
- API logs: Standard output when running `npm run dev`
- Worker logs: Output when running worker script
- Both include delivery IDs for debugging
