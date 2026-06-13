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
    errorMessage: text('error_message'),
    startedAt: timestamp('started_at', { withTimezone: true }),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
  },
  (table) => ({
    repoIdIdx: index('sync_runs_repo_id_idx').on(table.repositoryId),
    statusIdx: index('sync_runs_status_idx').on(table.status),
    startedAtIdx: index('sync_runs_started_at_idx').on(table.startedAt),
    repoIdFk: foreignKey({
      columns: [table.repositoryId],
      foreignColumns: [repositories.id],
      name: 'sync_runs_repo_id_fk',
    }).onDelete('cascade'),
  })
);

export type SyncRun = typeof syncRuns.$inferSelect;
export type NewSyncRun = typeof syncRuns.$inferInsert;
