import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { GitHubSyncProcessor } from './processors/github-sync.processor';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
  ],
  providers: [GitHubSyncProcessor],
  exports: [GitHubSyncProcessor],
})
export class WorkerModule {}
