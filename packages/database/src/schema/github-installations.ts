import {
  pgTable,
  varchar,
  timestamp,
  index,
  unique,
  foreignKey,
  bigint,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations } from './organizations';

export const githubInstallations = pgTable(
  'github_installations',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    organizationId: varchar('organization_id', { length: 36 }).notNull(),
    installationId: bigint('installation_id', { mode: 'bigint' }).notNull(),
    accountLogin: varchar('account_login', { length: 255 }).notNull(),
    accountType: varchar('account_type', { length: 50 }).notNull(),
    status: varchar('status', { length: 20 }).notNull().default('active'), // 'active', 'suspended', 'deleted'
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => ({
    orgIdIdx: index('github_installations_org_id_idx').on(table.organizationId),
    installationIdUnique: unique('github_installations_installation_id_unique').on(
      table.installationId
    ),
    orgIdFk: foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organizations.id],
      name: 'github_installations_org_id_fk',
    }).onDelete('cascade'),
  })
);

export type GitHubInstallation = typeof githubInstallations.$inferSelect;
export type NewGitHubInstallation = typeof githubInstallations.$inferInsert;
