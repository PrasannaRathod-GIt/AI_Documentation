# GitHub Webhook Integration - Phase 2

This document describes the GitHub webhook integration for the AI_Documentation monorepo.

## Architecture Overview

The webhook integration follows a queue-based architecture:

1. **Webhook Endpoint** (`POST /api/webhooks/github`)
   - Validates GitHub signature using HMAC SHA-256 and timing-safe comparison
   - Creates/updates a sync run in the database with status `QUEUED`
   - Enqueues a job to BullMQ with the GitHub Delivery ID as the job ID
   - Returns 200 OK immediately (fast response)

2. **BullMQ Queue** (Redis-backed)
   - Stores jobs for processing
   - Uses GitHub Delivery ID as job ID for idempotency
   - Prevents duplicate processing if GitHub retries the same delivery

3. **Worker Processor**
   - Processes jobs from the queue
   - Updates sync run status to `RUNNING` then `COMPLETED`
   - Logs the payload (ready for Phase 3 implementation)
   - Handles failures and updates sync run status to `FAILED`

## Setup Instructions

### 1. Environment Variables

Copy `.env.example` to `.env` in `apps/api/`:

```bash
cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env` with your values:

```env
GITHUB_WEBHOOK_SECRET=your_webhook_secret_from_github
REDIS_URL=redis://localhost:6379
WORKER_CONCURRENCY=2
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Database Migration

Run the Drizzle migration to add the new columns to `sync_runs`:

```bash
npm run db:push
# or
npm run db:migrate
```

This adds:
- `deliveryId` - Stores GitHub's X-GitHub-Delivery header for idempotency
- `createdAt` - Timestamp when the sync was created

### 4. Start Redis (if not running)

```bash
# Using Docker (from the repo root)
npm run docker:up
```

### 5. Start the API

```bash
npm run dev
# or
npm start
```

The webhook endpoint will be available at: `http://localhost:3333/api/webhooks/github`

## GitHub Configuration

To set up the webhook in GitHub:

1. Go to your repository settings → Webhooks → Add webhook
2. **Payload URL**: `https://your-domain.com/api/webhooks/github`
3. **Content type**: `application/json`
4. **Secret**: Use the same value as `GITHUB_WEBHOOK_SECRET` in `.env`
5. **Events**: Select `Push events` (or just the `push` event)
6. **Active**: Enable the webhook

## Webhook Payload Handling

### Accepted Events
- `push` - Repository push events (currently supported)

### Extracted Data
From the GitHub push event, the system extracts:
- Repository full name (e.g., `owner/repo`)
- Repository ID (from GitHub)
- Commit SHA
- Branch/ref
- Installation ID (if present)
- Delivery ID (from headers)

### Response
- **200 OK** - Webhook accepted (signature valid)
- **400 Bad Request** - Missing headers
- **401 Unauthorized** - Invalid signature

**Note**: The endpoint returns 200 OK even if an internal error occurs. This prevents GitHub from retrying failed requests. Errors are logged and tracked via the `sync_runs` table.

## Idempotency

The system ensures idempotency through two mechanisms:

1. **BullMQ Job ID**: Uses GitHub's `X-GitHub-Delivery` header as the job ID. If GitHub retries the same delivery, BullMQ returns the existing job instead of creating a duplicate.

2. **Database**: Before creating a new sync run, the service checks if a sync run with the same `deliveryId` already exists. If it does, the existing sync run is used.

## Sync Run States

- `QUEUED` - Initial state, job enqueued
- `RUNNING` - Processor started handling the job
- `COMPLETED` - Job finished successfully
- `FAILED` - Job failed (error message stored)

## Future Work (Phase 3+)

The processor currently logs the job payload. The following steps are marked with TODOs:

1. Clone the repository from GitHub
2. Parse code using the code-parser package
3. Create code chunks and embeddings
4. Persist chunks to the database
5. Update `repositories.lastSyncedCommitSha`

## Testing the Webhook

### Using curl
```bash
# Generate a test signature
PAYLOAD='{"repository":{"id":123,"full_name":"owner/repo"},"ref":"refs/heads/main","after":"abc123","before":"def456"}'
SECRET="your_secret"
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | sed 's/^.* //')
DELIVERY_ID=$(uuidgen)

curl -X POST http://localhost:3333/api/webhooks/github \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -H "X-Hub-Signature-256: sha256=$SIGNATURE" \
  -H "X-GitHub-Delivery: $DELIVERY_ID" \
  -d "$PAYLOAD"
```

### Using GitHub CLI
Trigger a real push event by making a change to your repository and pushing it.

## Monitoring

Check the `sync_runs` table for:
- Status of each sync
- Delivery IDs (for debugging duplicates)
- Error messages (if failed)
- Timestamps (when created and completed)

View Redis queue status:
```bash
# Check queue length
redis-cli LLEN "bull:github-sync:waiting"
```

## Architecture Files

- `src/github/github.module.ts` - GitHub module definition
- `src/github/github.controller.ts` - Webhook endpoint
- `src/github/github.service.ts` - GitHub service logic
- `src/github/github-signature.ts` - Signature verification
- `src/queue/queue.module.ts` - Queue module definition
- `src/queue/github-sync.queue.ts` - BullMQ queue
- `src/queue/github-sync.processor.ts` - Job processor
