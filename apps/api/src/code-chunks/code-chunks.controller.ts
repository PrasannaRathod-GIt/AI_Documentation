import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { db, codeChunks } from '@ai-docs/database';

@Controller('code-chunks')
export class CodeChunksController {
  @Get()
  async list(@Query('repositoryId') repositoryId: string) {
    if (!repositoryId?.trim()) {
      throw new BadRequestException('repositoryId is required');
    }

    return db.query.codeChunks.findMany({
      where: eq(codeChunks.repositoryId, repositoryId),
    });
  }
}
