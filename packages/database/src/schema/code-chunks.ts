import {
  customType,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { repositories } from './repositories';

const vector768 = customType<{
  data: number[];
  driverData: string;
}>({
  dataType() {
    return 'vector(768)';
  },
  toDriver(value: number[]) {
    return `[${value.join(',')}]`;
  },
  fromDriver(value: string | number[]) {
    if (Array.isArray(value)) return value;

    const cleaned = value.trim().replace(/^\[/, '').replace(/\]$/, '');
    if (!cleaned) return [];

    return cleaned.split(',').map((part) => Number(part.trim()));
  },
});

export const codeChunks = pgTable(
  'code_chunks',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .default('gen_random_uuid()'),

    organizationId: varchar('organization_id', { length: 36 })
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),

    repositoryId: varchar('repository_id', { length: 36 })
      .notNull()
      .references(() => repositories.id, { onDelete: 'cascade' }),

    filePath: varchar('file_path', { length: 500 }).notNull(),
    symbolName: varchar('symbol_name', { length: 255 }).notNull(),
    language: varchar('language', { length: 50 }).notNull(),
    startLine: integer('start_line').notNull(),
    endLine: integer('end_line').notNull(),
    rawCode: text('raw_code').notNull(),
    summary: text('summary'),
    markdown: text('markdown'),
    mermaidDiagram: text('mermaid_diagram'),
    embedding: vector768('embedding').notNull(),
    contentHash: varchar('content_hash', { length: 64 }).notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    organizationIdIdx: index('code_chunks_org_id_idx').on(table.organizationId),
    repositoryIdIdx: index('code_chunks_repo_id_idx').on(table.repositoryId),
    symbolNameIdx: index('code_chunks_symbol_name_idx').on(table.symbolName),
    contentHashIdx: index('code_chunks_content_hash_idx').on(table.contentHash),
    // Run: pnpm --filter @ai-docs/database generate then migrate
    embeddingHnswIdx: index('code_chunks_embedding_hnsw_idx')
      .using('hnsw', table.embedding.op('vector_cosine_ops')),
  }),
);

export type CodeChunk = typeof codeChunks.$inferSelect;
export type NewCodeChunk = typeof codeChunks.$inferInsert;