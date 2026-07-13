import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { db, repositories } from '@ai-docs/database';

@Controller('repositories')
export class RepositoriesController {
  @Get()
  async list(@Query('organizationId') organizationId: string) {
    if (!organizationId?.trim()) {
      throw new BadRequestException('organizationId is required');
    }

    return db.query.repositories.findMany({
      where: eq(repositories.organizationId, organizationId),
    });
  }
}
