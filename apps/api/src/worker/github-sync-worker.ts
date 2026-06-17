/**
 * GitHub Sync Worker
 * 
 * This is a standalone worker that processes GitHub sync jobs from the BullMQ queue.
 * Run this in a separate process or container to handle job processing.
 * 
 * Usage:
 *   npx tsx src/worker/github-sync-worker.ts
 */

import { GitHubSyncProcessor } from '../queue/github-sync.processor';

async function main() {
  const processor = new GitHubSyncProcessor();

  // Start the processor
  await processor.start();

  // Graceful shutdown
  const gracefulShutdown = async (signal: string) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    await processor.stop();
    process.exit(0);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

main().catch((error) => {
  console.error('Failed to start worker:', error);
  process.exit(1);
});
