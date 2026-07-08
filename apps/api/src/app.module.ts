import { Module } from '@nestjs/common';
import { GitHubModule } from './github/github.module.js';
import { SearchModule } from './search/search.module.js';

@Module({
  imports: [GitHubModule, SearchModule],
  controllers: [],
  providers: []
})
export class AppModule {}
