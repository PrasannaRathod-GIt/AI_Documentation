import { Injectable, Logger } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { createHash } from 'crypto';
import { createClient } from 'redis';
import { db, codeChunks } from '@ai-docs/database';
import { EmbeddingService, SearchableChunk } from '@ai-docs/ai-engine';

type SearchResultRow = {
  id: string;
  symbolName: string;
  filePath: string;
  summary: string | null;
  rawCode: string;
  similarityScore: number;
};

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private embeddingService: EmbeddingService | null = null;
  private redisClient: ReturnType<typeof createClient> | null = null;

  constructor() {
    this.initializeRedis();
  }

  private async initializeRedis(): Promise<void> {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    try {
      const client = createClient({ url: redisUrl });
      client.on('error', (error) => {
        this.logger.warn(`Redis cache error: ${error.message}`);
      });
      await client.connect();
      this.redisClient = client;
      this.logger.log('Redis cache client connected');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Redis cache unavailable: ${message}`);
      this.redisClient = null;
    }
  }

  private getCacheKey(query: string): string {
    const normalized = query.trim().toLowerCase();
    const hash = createHash('sha256').update(normalized).digest('hex');
    return `search:query:embedding:${hash}`;
  }

  private async getCachedEmbedding(query: string): Promise<number[] | null> {
    if (!this.redisClient) {
      return null;
    }

    try {
      const key = this.getCacheKey(query);
      const cached = await this.redisClient.get(key);
      return cached ? (JSON.parse(cached) as number[]) : null;
    } catch (error) {
      this.logger.warn('Failed to read from Redis cache', error instanceof Error ? error.stack : undefined);
      return null;
    }
  }

  private async setCachedEmbedding(query: string, vector: number[]): Promise<void> {
    if (!this.redisClient) {
      return;
    }

    try {
      const key = this.getCacheKey(query);
      await this.redisClient.set(key, JSON.stringify(vector), { EX: 3600 });
    } catch (error) {
      this.logger.warn('Failed to write query embedding to Redis cache', error instanceof Error ? error.stack : undefined);
    }
  }

  private getEmbeddingService(): EmbeddingService {
    if (!this.embeddingService) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not configured');
      }
      this.embeddingService = new EmbeddingService(apiKey);
    }
    return this.embeddingService;
  }

  private async getQueryEmbedding(query: string): Promise<number[]> {
    const cached = await this.getCachedEmbedding(query);
    if (cached) {
      this.logger.debug('Using cached query embedding');
      return cached;
    }

    const embedding = await this.getEmbeddingService().generateQueryEmbedding(query);
    await this.setCachedEmbedding(query, embedding);
    return embedding;
  }

  async searchCode(params: {
    query: string;
    organizationId: string;
    repositoryId?: string;
    limit?: number;
    minScore?: number;
  }): Promise<SearchableChunk[]> {
    const queryText = params.query.trim();
    if (!queryText) {
      throw new Error('Query must not be empty');
    }

    const queryVector = await this.getQueryEmbedding(queryText);
    const queryVectorLiteral = `[${queryVector.join(',')}]`;
    const limit = params.limit && params.limit > 0 ? Math.min(params.limit, 20) : 5;
    const minScore = params.minScore ?? 0.3;

    const baseQuery = db
      .select({
        id: codeChunks.id,
        symbolName: codeChunks.symbolName,
        filePath: codeChunks.filePath,
        summary: codeChunks.summary,
        rawCode: codeChunks.rawCode,
        similarityScore: sql<number>`1 - (${codeChunks.embedding} <=> ${queryVectorLiteral}::vector)`,
      })
      .from(codeChunks)
      .where(
        sql`${codeChunks.organizationId} = ${params.organizationId} AND ${codeChunks.embedding} IS NOT NULL`
      );

    const queryBuilder = params.repositoryId
      ? db
          .select({
            id: codeChunks.id,
            symbolName: codeChunks.symbolName,
            filePath: codeChunks.filePath,
            summary: codeChunks.summary,
            rawCode: codeChunks.rawCode,
            similarityScore: sql<number>`1 - (${codeChunks.embedding} <=> ${queryVectorLiteral}::vector)`,
          })
          .from(codeChunks)
          .where(
            sql`${codeChunks.organizationId} = ${params.organizationId} AND ${codeChunks.repositoryId} = ${params.repositoryId} AND ${codeChunks.embedding} IS NOT NULL`
          )
      : baseQuery;

    const rows = await queryBuilder
      .orderBy(sql`${codeChunks.embedding} <=> ${queryVectorLiteral}::vector`)
      .limit(limit);

    return rows
      .map((row: SearchResultRow) => ({
        id: row.id,
        symbolName: row.symbolName,
        filePath: row.filePath,
        summary: row.summary,
        rawCode: row.rawCode,
        similarityScore: Math.round(row.similarityScore * 10000) / 10000,
      }))
      .filter((chunk: SearchableChunk) => chunk.similarityScore >= minScore);
  }

  async searchExists(): Promise<boolean> {
    try {
      const rows = await db.select({ count: sql<number>`count(*)` }).from(codeChunks);
      return (rows[0]?.count ?? -1) >= 0;
    } catch (error) {
      this.logger.warn('Search existence check failed', error instanceof Error ? error.stack : undefined);
      return false;
    }
  }
}
