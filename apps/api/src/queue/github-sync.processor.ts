import { Logger } from '@nestjs/common';
import { Job, Worker } from 'bullmq';
import { EnqueueJobPayload } from '../github/github.service';
import { eq } from 'drizzle-orm';
import { db, syncRuns } from '@ai-docs/database';
import { toError } from '../common/utils/error.util';

/**
 * GitHub sync processor handles the actual sync work.
 * For Phase 2, this processor logs the job and updates sync_runs status.
 * Heavy lifting (clone, parse, embed) will be added in Phase 3.
 */
export class GitHubSyncProcessor {
  private readonly logger = new Logger(GitHubSyncProcessor.name);
  private worker: Worker | null = null;

  async start(): Promise<void> {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    this.worker = new Worker('github-sync', this.processJob.bind(this), {
      connection: {
        url: redisUrl,
      },
      concurrency: parseInt(process.env.WORKER_CONCURRENCY || '2'),
    });

    this.worker.on('completed', (job: Job) => {
      this.logger.debug(`Job ${job.id} completed successfully`);
    });

    this.worker.on('failed', (job: Job | undefined, err: Error) => {
      this.logger.error(
        `Job ${job?.id} failed: ${err.message}`,
        err.stack
      );
    });

    this.logger.log('GitHub sync processor started');
  }

  async stop(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      this.logger.log('GitHub sync processor stopped');
    }
  }

  /**
   * Process a single GitHub sync job.
   */
  private async processJob(job: Job<EnqueueJobPayload>): Promise<void> {
    const { syncRunId, repositoryFullName, repositoryIdFromGitHub, commitSha, branch, deliveryId } =
      job.data;

    this.logger.log(
      `Processing sync job: repo=${repositoryFullName} branch=${branch} sha=${commitSha} deliveryId=${deliveryId}`
    );

    try {
      // Update sync run status to RUNNING
      if (syncRunId) {
        await db
          .update(syncRuns)
          .set({
            status: 'RUNNING',
            startedAt: new Date(),
          })
          .where(eq(syncRuns.id, syncRunId));

        this.logger.debug(`Sync run ${syncRunId} marked as RUNNING`);
      }

      // TODO: Phase 3 - Clone the repository
      // TODO: Phase 3 - Parse the code using code-parser
      // TODO: Phase 3 - Create code chunks and embeddings
      // TODO: Phase 3 - Persist code chunks to database
      // TODO: Phase 3 - Update last_synced_commit_sha on repository

      // For now, just log the payload
      this.logger.log(`Job data: ${JSON.stringify(job.data, null, 2)}`);

      // Update sync run status to COMPLETED
      if (syncRunId) {
        await db
          .update(syncRuns)
          .set({
            status: 'COMPLETED',
            finishedAt: new Date(),
          })
          .where(eq(syncRuns.id, syncRunId));

        this.logger.debug(`Sync run ${syncRunId} marked as COMPLETED`);
      }
    } catch (err) {
      const error = toError(err);
      this.logger.error(`Error processing job ${job.id}: ${error.message}`, error.stack);

      // Update sync run status to FAILED
      if (syncRunId) {
        await db
          .update(syncRuns)
          .set({
            status: 'FAILED',
            finishedAt: new Date(),
            errorMessage: error.message,
          })
          .where(eq(syncRuns.id, syncRunId));

        this.logger.debug(`Sync run ${syncRunId} marked as FAILED`);
      }

      throw error;
    }
  }
}
