import { eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import {
  codeChunks,
  documents,
  memberships,
  organizations,
  repositories,
  syncRuns,
  users,
} from './schema';
import { pool } from './client';

export const db = drizzle(pool, { schema: { organizations, users, memberships, repositories, documents, codeChunks, syncRuns } });

export type Database = typeof db;

function normalizeJsonValue(value: Record<string, unknown> | string | null | undefined) {
  if (value == null) return null;
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

export class DatabaseService {
  static async createOrganization(input: { name: string; slug: string }) {
    const rows = await db.insert(organizations).values(input).returning();
    return rows[0] ?? null;
  }

  static async getOrganizationById(id: string) {
    const rows = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, id))
      .limit(1);
    return rows[0] ?? null;
  }

  static async createUser(input: {
    authProviderId: string;
    email: string;
    fullName?: string | null;
    avatarUrl?: string | null;
  }) {
    const rows = await db.insert(users).values(input).returning();
    return rows[0] ?? null;
  }

  static async getUserByEmail(email: string) {
    const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return rows[0] ?? null;
  }

  static async getMembershipsForUser(userId: string) {
    return db.select().from(memberships).where(eq(memberships.userId, userId));
  }

  static async createRepository(input: {
    organizationId: string;
    provider: 'github' | 'gitlab';
    providerRepoId: string;
    fullName: string;
    defaultBranch: string;
    githubInstallationId?: string | null;
    webhookSecretEncrypted?: string | null;
    lastSyncedCommitSha?: string | null;
  }) {
    const rows = await db.insert(repositories).values(input).returning();
    return rows[0] ?? null;
  }

  static async getRepositoriesByOrganization(orgId: string) {
    return db
      .select()
      .from(repositories)
      .where(eq(repositories.organizationId, orgId));
  }

  static async createDocument(input: {
    organizationId: string;
    repositoryId: string;
    filePath: string;
    title: string;
    slug: string;
    docType: string;
    status: string;
    markdownContent: string;
    metadataJson?: Record<string, unknown> | string | null;
  }) {
    const rows = await db.insert(documents).values({
      ...input,
      metadataJson: normalizeJsonValue(input.metadataJson),
    }).returning();
    return rows[0] ?? null;
  }

  static async getDocumentsByRepository(repoId: string) {
    return db
      .select()
      .from(documents)
      .where(eq(documents.repositoryId, repoId));
  }

  static async createCodeChunk(input: {
    organizationId: string;
    repositoryId: string;
    filePath: string;
    symbolName: string;
    language: string;
    startLine: number;
    endLine: number;
    rawCode: string;
    summary?: string | null;
    embedding: number[];
    contentHash: string;
  }) {
    const rows = await db.insert(codeChunks).values(input).returning();
    return rows[0] ?? null;
  }

  static async getCodeChunkByContentHash(contentHash: string) {
    const rows = await db
      .select()
      .from(codeChunks)
      .where(eq(codeChunks.contentHash, contentHash))
      .limit(1);
    return rows[0] ?? null;
  }

  static async findSimilarCodeChunks(
    orgId: string,
    embedding: number[],
    limit = 5,
  ) {
    return db
      .select({
        id: codeChunks.id,
        organizationId: codeChunks.organizationId,
        repositoryId: codeChunks.repositoryId,
        filePath: codeChunks.filePath,
        symbolName: codeChunks.symbolName,
        language: codeChunks.language,
        summary: codeChunks.summary,
        similarity: sql<number>`
          1 - (${codeChunks.embedding} <=> ${JSON.stringify(embedding)}::vector)
        `,
      })
      .from(codeChunks)
      .where(eq(codeChunks.organizationId, orgId))
      .orderBy(sql`
        ${codeChunks.embedding} <=> ${JSON.stringify(embedding)}::vector
      `)
      .limit(limit);
  }

  static async createSyncRun(input: {
    repositoryId: string;
    commitSha: string;
    branch: string;
    status: string;
    triggerType: string;
    errorMessage?: string | null;
    startedAt?: Date | null;
    finishedAt?: Date | null;
  }) {
    const rows = await db.insert(syncRuns).values(input).returning();
    return rows[0] ?? null;
  }

  static async getSyncRunsByRepository(repoId: string) {
    return db
      .select()
      .from(syncRuns)
      .where(eq(syncRuns.repositoryId, repoId));
  }

  static async close() {
    await pool.end();
  }
}