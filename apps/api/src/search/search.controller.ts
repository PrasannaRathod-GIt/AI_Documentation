import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  InternalServerErrorException,
  Query,
} from '@nestjs/common';
import { SearchService } from './search.service.js';
import type { SearchableChunk } from '@ai-docs/ai-engine';

interface SearchQueryParams {
  q?: string;
  organizationId?: string;
  repositoryId?: string;
  limit?: string;
  minScore?: string;
}

@Controller('api/search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @HttpCode(200)
  async search(
    @Query() params: SearchQueryParams,
  ): Promise<{ results: SearchableChunk[]; query: string; count: number }> {
    if (!params.q?.trim() || !params.organizationId?.trim()) {
      throw new BadRequestException('Missing required query parameters: q and organizationId');
    }

    const parsedLimit = Number.parseInt(params.limit ?? '5', 10);
    const limit = Number.isNaN(parsedLimit) ? 5 : Math.min(20, Math.max(1, parsedLimit));

    const parsedMinScore = Number.parseFloat(params.minScore ?? '0.3');
    const minScore = Number.isNaN(parsedMinScore) ? 0.3 : Math.max(0, Math.min(1, parsedMinScore));

    try {
      const results = await this.searchService.searchCode({
        query: params.q,
        organizationId: params.organizationId,
        repositoryId: params.repositoryId,
        limit,
        minScore,
      });

      return {
        results,
        query: params.q,
        count: results.length,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Search failed';
      throw new InternalServerErrorException(`Search failed: ${message}`);
    }
  }
}
