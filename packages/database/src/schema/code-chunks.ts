import {
  pgTable,
  varchar,
  text,
  integer,
  timestamp,
  index,
  foreignKey,
  customType,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations } from './organizations';
import { repositories } from './repositories';

// Custom pgvector type for Drizzle
const vector = customType<{ data: number[] }>({
  dataType() {
    return 'vector(768)';
  },
  toDriver(value) {
    return value;
  },
});

export const codeChunks = pgTable(
  'code_chunks',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    organizationId: varchar('organization_id', { length: 36 }).notNull(),
    repositoryId: varchar('repository_id', { length: 36 }).notNull(),
    filePath: varchar('file_path', { length: 500 }).notNull(),
    symbolName: varchar('symbol_name', { length: 255 }).notNull(),
    language: varchar('language', { length: 50 }).notNull(),
    startLine: integer('start_line').notNull(),
    endLine: integer('end_line').notNull(),
    rawCode: text('raw_code').notNull(),
    summary: text('summary'),
    embedding: vector('embedding'),
    contentHash: varchar('content_hash', { length: 64 }).notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => ({
    orgIdIdx: index('code_chunks_org_id_idx').on(table.organizationId),
    repoIdIdx: index('code_chunks_repo_id_idx').on(table.repositoryId),
    symbolIdx: index('code_chunks_symbol_name_idx').on(table.symbolName),
    contentHashIdx: index('code_chunks_content_hash_idx').on(table.contentHash),
    // Vector index with HNSW using cosine distance
    embeddingHnswIdx: index('code_chunks_embedding_hnsw_idx', {
      type: 'hnsw',
      opclass: 'vector_cosine_ops',
    }).on(table.embedding),
    orgIdFk: foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organizations.id],
      name: 'code_chunks_org_id_fk',
    }).onDelete('cascade'),
    repoIdFk: foreignKey({
      columns: [table.repositoryId],
      foreignColumns: [repositories.id],
      name: 'code_chunks_repo_id_fk',
    }).onDelete('cascade'),
  })
);

export type CodeChunk = typeof codeChunks.$inferSelect;
export type NewCodeChunk = typeof codeChunks.$inferInsert;
