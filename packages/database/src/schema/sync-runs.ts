import {
  pgTable,
  varchar,
  text,
  timestamp,
  index,
  foreignKey,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { repositories } from './repositories';

export const syncRuns = pgTable(
  'sync_runs',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    repositoryId: varchar('repository_id', { length: 36 }).notNull(),
    commitSha: varchar('commit_sha', { length: 40 }).notNull(),
    branch: varchar('branch', { length: 255 }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('pending'), // 'pending', 'running', 'completed', 'failed'
    triggerType: varchar('trigger_type', { length: 50 }).notNull(), // 'webhook', 'manual', 'scheduled'
    deliveryId: varchar('delivery_id', { length: 255 }), // GitHub delivery ID for idempotency
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    startedAt: timestamp('started_at', { withTimezone: true }),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
  },
  (table) => ({
    repoIdIdx: index('sync_runs_repo_id_idx').on(table.repositoryId),
    statusIdx: index('sync_runs_status_idx').on(table.status),
    deliveryIdIdx: index('sync_runs_delivery_id_idx').on(table.deliveryId),
    createdAtIdx: index('sync_runs_created_at_idx').on(table.createdAt),
    repoIdFk: foreignKey({
      columns: [table.repositoryId],
      foreignColumns: [repositories.id],
      name: 'sync_runs_repo_id_fk',
    }).onDelete('cascade'),
  })
);

export type SyncRun = typeof syncRuns.$inferSelect;
export type NewSyncRun = typeof syncRuns.$inferInsert;
