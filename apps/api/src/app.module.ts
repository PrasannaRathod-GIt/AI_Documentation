import { Module } from '@nestjs/common';
import { ClerkModule } from './clerk/clerk.module.js';
import { GitHubModule } from './github/github.module.js';
import { SearchModule } from './search/search.module.js';
import { RepositoriesModule } from './repositories/repositories.module.js';
import { CodeChunksModule } from './code-chunks/code-chunks.module.js';

@Module({
  imports: [GitHubModule, SearchModule, ClerkModule, RepositoriesModule, CodeChunksModule],
  controllers: [],
  providers: []
})
export class AppModule {}
