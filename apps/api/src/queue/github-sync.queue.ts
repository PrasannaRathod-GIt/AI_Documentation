import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { EnqueueJobPayload } from '../github/github.service';
import { toError } from '../common/utils/error.util';

@Injectable()
export class GitHubSyncQueue {
  private queue: Queue;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.queue = new Queue('github-sync', {
      connection: {
        url: redisUrl,
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          age: 86400, // Keep completed jobs for 24 hours
        },
      },
    });
  }

  /**
   * Enqueue a GitHub sync job.
   * Uses deliveryId as the job ID to ensure idempotency.
   */
  async enqueueSync(payload: EnqueueJobPayload, jobId: string): Promise<string> {
    try {
      // Try to add the job with the delivery ID as the job ID
      // If a job with this ID already exists, it will return the existing job
      const job = await this.queue.add('sync', payload, {
        jobId,
      });

      if (!job.id) {
        throw new Error('Failed to enqueue sync job: missing job id');
      }

      return job.id;
    } catch (error) {
      const err = toError(error);
      throw new Error(`Failed to enqueue sync job: ${err.message}`);
    }
  }

  /**
   * Get the queue instance (useful for testing or manual operations).
   */
  getQueue(): Queue {
    return this.queue;
  }
}
