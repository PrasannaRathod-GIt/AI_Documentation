import { Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { db, syncRuns, repositories } from '@ai-docs/database';

export interface GitHubPushPayload {
  action?: string;
  ref: string;
  before: string;
  after: string;
  repository: {
    id: number;
    name: string;
    full_name: string;
    owner: {
      name: string;
      login: string;
    };
  };
  pusher?: {
    name: string;
    email: string;
  };
  installation?: {
    id: number;
  };
  head_commit?: {
    id: string;
    message: string;
  };
}

export interface EnqueueJobPayload {
  provider: 'github';
  repositoryFullName: string;
  repositoryIdFromGitHub: number;
  repositoryId?: string; // Our internal database ID
  installationId?: number;
  commitSha: string;
  branch: string;
  deliveryId: string;
  receivedAt: string;
  syncRunId?: string;
}

@Injectable()
export class GitHubService {
  private readonly logger = new Logger(GitHubService.name);

  /**
   * Find or create a sync run for the webhook event.
   * Uses deliveryId to ensure idempotency.
   */
  async findOrCreateSyncRun(
    repositoryId: string,
    payload: GitHubPushPayload,
    deliveryId: string
  ): Promise<{ id: string; isNew: boolean }> {
    // Check if we already have a sync run with this delivery ID
    const existing = await db
      .select({ id: syncRuns.id })
      .from(syncRuns)
      .where(eq(syncRuns.deliveryId, deliveryId))
      .limit(1);

    if (existing.length > 0) {
      this.logger.debug(
        `Sync run already exists for delivery ${deliveryId}: ${existing[0].id}`
      );
      return { id: existing[0].id, isNew: false };
    }

    // Extract branch from ref (e.g., refs/heads/main -> main)
    const branch = payload.ref.replace(/^refs\/heads\//, '');

    // Create new sync run with QUEUED status
    const newSyncRun = await db
      .insert(syncRuns)
      .values({
        repositoryId,
        commitSha: payload.after,
        branch,
        status: 'QUEUED',
        triggerType: 'webhook',
        deliveryId,
      })
      .returning({ id: syncRuns.id });

    const syncRunId = newSyncRun[0]?.id;
    if (!syncRunId) {
      throw new Error('Failed to create sync run');
    }

    this.logger.debug(`Created new sync run ${syncRunId} for delivery ${deliveryId}`);
    return { id: syncRunId, isNew: true };
  }

  /**
   * Find repository by provider repo ID and provider.
   */
  async findRepositoryByProviderId(
    providerRepoId: string | number,
    provider: string = 'github'
  ) {
    const repo = await db
      .select()
      .from(repositories)
      .where(eq(repositories.providerRepoId, String(providerRepoId)))
      .limit(1);

    return repo[0] ?? null;
  }

  /**
   * Build the job payload for the queue.
   */
  buildJobPayload(
    payload: GitHubPushPayload,
    deliveryId: string,
    repositoryId?: string,
    syncRunId?: string
  ): EnqueueJobPayload {
    const branch = payload.ref.replace(/^refs\/heads\//, '');

    return {
      provider: 'github',
      repositoryFullName: payload.repository.full_name,
      repositoryIdFromGitHub: payload.repository.id,
      repositoryId,
      installationId: payload.installation?.id,
      commitSha: payload.after,
      branch,
      deliveryId,
      receivedAt: new Date().toISOString(),
      syncRunId,
    };
  }
}
