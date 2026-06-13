import { db } from './client';
import {
  organizations,
  users,
  memberships,
  repositories,
  documents,
  codeChunks,
  syncRuns,
  Organization,
  NewOrganization,
  User,
  NewUser,
  Membership,
  NewMembership,
  Repository,
  NewRepository,
  Document,
  NewDocument,
  CodeChunk,
  NewCodeChunk,
  SyncRun,
  NewSyncRun,
} from './schema';

/**
 * Database access layer with type-safe queries
 * All queries go through this module for consistency
 */

export class DatabaseService {
  // Organizations
  static async createOrganization(data: NewOrganization): Promise<Organization> {
    const [org] = await db.insert(organizations).values(data).returning();
    return org;
  }

  static async getOrganization(id: string): Promise<Organization | undefined> {
    const [org] = await db
      .select()
      .from(organizations)
      .where(db.eq(organizations.id, id))
      .limit(1);
    return org;
  }

  // Users
  static async createUser(data: NewUser): Promise<User> {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  }

  static async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(db.eq(users.email, email))
      .limit(1);
    return user;
  }

  // Memberships
  static async createMembership(data: NewMembership): Promise<Membership> {
    const [membership] = await db.insert(memberships).values(data).returning();
    return membership;
  }

  static async getMembershipsByUserId(userId: string): Promise<Membership[]> {
    return await db
      .select()
      .from(memberships)
      .where(db.eq(memberships.userId, userId));
  }

  // Repositories
  static async createRepository(data: NewRepository): Promise<Repository> {
    const [repo] = await db.insert(repositories).values(data).returning();
    return repo;
  }

  static async getRepositoriesByOrgId(orgId: string): Promise<Repository[]> {
    return await db
      .select()
      .from(repositories)
      .where(db.eq(repositories.organizationId, orgId));
  }

  // Documents
  static async createDocument(data: NewDocument): Promise<Document> {
    const [doc] = await db.insert(documents).values(data).returning();
    return doc;
  }

  static async getDocumentsByRepoId(repoId: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(db.eq(documents.repositoryId, repoId));
  }

  // Code Chunks
  static async createCodeChunk(data: NewCodeChunk): Promise<CodeChunk> {
    const [chunk] = await db.insert(codeChunks).values(data).returning();
    return chunk;
  }

  static async searchCodeChunksByEmbedding(
    embedding: number[],
    orgId: string,
    limit: number = 10
  ): Promise<(CodeChunk & { similarity: number })[]> {
    // Vector similarity search using pgvector
    const results = await db
      .select({
        chunk: codeChunks,
        similarity: db.sql<number>`1 - (${codeChunks.embedding} <=> ${JSON.stringify(embedding)}::vector)`,
      })
      .from(codeChunks)
      .where(db.eq(codeChunks.organizationId, orgId))
      .orderBy((t) => t.similarity)
      .limit(limit);

    return results.map((r) => ({
      ...r.chunk,
      similarity: r.similarity,
    }));
  }

  // Sync Runs
  static async createSyncRun(data: NewSyncRun): Promise<SyncRun> {
    const [run] = await db.insert(syncRuns).values(data).returning();
    return run;
  }

  static async getSyncRunsByRepoId(repoId: string): Promise<SyncRun[]> {
    return await db
      .select()
      .from(syncRuns)
      .where(db.eq(syncRuns.repositoryId, repoId))
      .orderBy((t) => t.startedAt);
  }
}

export default DatabaseService;
