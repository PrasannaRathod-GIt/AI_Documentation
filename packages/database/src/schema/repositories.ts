import {
  pgTable,
  varchar,
  text,
  timestamp,
  index,
  foreignKey,
  bigint,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations } from './organizations';

export const repositories = pgTable(
  'repositories',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    organizationId: varchar('organization_id', { length: 36 }).notNull(),
    provider: varchar('provider', { length: 50 }).notNull(), // 'github', 'gitlab'
    providerRepoId: varchar('provider_repo_id', { length: 255 }).notNull(),
    fullName: varchar('full_name', { length: 255 }).notNull(), // e.g., "owner/repo"
    defaultBranch: varchar('default_branch', { length: 255 }).default('main'),
    githubInstallationId: varchar('github_installation_id', { length: 255 }),
    installationId: bigint('installation_id', { mode: 'bigint' }),
    webhookSecretEncrypted: text('webhook_secret_encrypted'),
    lastSyncedCommitSha: varchar('last_synced_commit_sha', { length: 40 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => ({
    orgIdIdx: index('repositories_org_id_idx').on(table.organizationId),
    providerRepoIdx: index('repositories_provider_repo_id_idx').on(
      table.provider,
      table.providerRepoId
    ),
    orgIdFk: foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organizations.id],
      name: 'repositories_org_id_fk',
    }).onDelete('cascade'),
  })
);

export type Repository = typeof repositories.$inferSelect;
export type NewRepository = typeof repositories.$inferInsert;
