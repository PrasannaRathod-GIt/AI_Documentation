import { Module } from '@nestjs/common';
import { CodeChunksController } from './code-chunks.controller.js';

@Module({
  controllers: [CodeChunksController],
})
export class CodeChunksModule {}
