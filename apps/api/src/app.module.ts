import {Module} from '@nestjs/common';
import {GitHubModule} from './github/github.module';

@Module({
  imports: [GitHubModule],
  controllers: [],
  providers: []
})
export class AppModule {}
