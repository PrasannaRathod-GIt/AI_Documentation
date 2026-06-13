import {
  pgTable,
  varchar,
  text,
  timestamp,
  index,
  foreignKey,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations } from './organizations';
import { repositories } from './repositories';

export const documents = pgTable(
  'documents',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    organizationId: varchar('organization_id', { length: 36 }).notNull(),
    repositoryId: varchar('repository_id', { length: 36 }).notNull(),
    filePath: varchar('file_path', { length: 500 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    docType: varchar('doc_type', { length: 50 }).notNull(), // 'readme', 'api', 'module', 'guide'
    status: varchar('status', { length: 50 }).notNull().default('draft'), // 'draft', 'generated', 'approved'
    markdownContent: text('markdown_content'),
    metadataJson: text('metadata_json'), // JSON stringified
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => ({
    orgIdIdx: index('documents_org_id_idx').on(table.organizationId),
    repoIdIdx: index('documents_repo_id_idx').on(table.repositoryId),
    slugIdx: index('documents_slug_idx').on(table.slug),
    statusIdx: index('documents_status_idx').on(table.status),
    orgIdFk: foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organizations.id],
      name: 'documents_org_id_fk',
    }).onDelete('cascade'),
    repoIdFk: foreignKey({
      columns: [table.repositoryId],
      foreignColumns: [repositories.id],
      name: 'documents_repo_id_fk',
    }).onDelete('cascade'),
  })
);

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
