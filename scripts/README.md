# Scripts

Utility scripts for database setup, seeding, and migrations.

## Database Scripts

### `db-generate.ts`
Generate Drizzle migrations from schema changes.

```bash
npm run db:generate
```

Creates SQL files in `packages/database/migrations/` based on schema modifications.

### `db-migrate.ts`
Apply pending migrations to the database.

```bash
npm run db:migrate
```

Runs all migrations in sequence. Safe to run multiple times (idempotent).

### `seed.ts`
Seed the database with test data (organization, repository, code chunk).

```bash
npm run seed
```

**What it does:**
- Creates a test organization (Acme Corp)
- Creates a test GitHub repository
- Creates a test code chunk with a 768-dimensional mock embedding
- Queries back and prints the inserted records
- Closes the connection cleanly

**Use cases:**
- Local development setup
- Testing code without fixtures
- Verifying database connectivity

**Output:**
```
🌱 Starting database seed...

📦 Creating test organization...
✅ Organization created:
   ID: abc-123
   Name: Acme Corp
   Slug: acme-corp

📚 Creating test repository...
✅ Repository created:
   ID: def-456
   Full Name: acme/example-repo
   Provider: github

🧬 Creating test code chunk with embedding...
✅ Code chunk created:
   ID: ghi-789
   ...
```

## Usage

**First time setup:**
```bash
# 1. Start PostgreSQL with pgvector
npm run docker:up

# 2. Generate and apply migrations
npm run db:generate
npm run db:migrate

# 3. Seed test data
npm run seed

# 4. Verify in Drizzle Studio (optional)
npm run db:studio
```

## Adding New Scripts

1. Create `scripts/my-script.ts`
2. Add to `package.json` scripts: `"my-script": "tsx scripts/my-script.ts"`
3. Run with `npm run my-script`

