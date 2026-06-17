import { Module } from '@nestjs/common';
import { GitHubSyncQueue } from './github-sync.queue';

@Module({
  providers: [GitHubSyncQueue],
  exports: [GitHubSyncQueue],
})
export class QueueModule {}
