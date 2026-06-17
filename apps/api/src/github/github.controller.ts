import {
  Controller,
  Post,
  Headers,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
  Logger,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { GitHubService, GitHubPushPayload } from './github.service';
import { verifyGitHubSignature } from './github-signature';
import { GitHubSyncQueue } from '../queue/github-sync.queue';
import { toError } from '../common/utils/error.util';

@Controller('webhooks/github')
export class GitHubController {
  private readonly logger = new Logger(GitHubController.name);

  constructor(
    private readonly githubService: GitHubService,
    private readonly githubSyncQueue: GitHubSyncQueue
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() req: Request,
    @Headers('x-github-event') event: string,
    @Headers('x-hub-signature-256') signature: string,
    @Headers('x-github-delivery') deliveryId: string,
    @Body() payload: GitHubPushPayload
  ): Promise<{ ok: true }> {
    // Validate required headers
    if (!event || !signature || !deliveryId) {
      this.logger.warn('Missing required GitHub headers');
      throw new BadRequestException('Missing required GitHub headers');
    }

    // Only accept push events for now
    if (event !== 'push') {
      this.logger.debug(`Ignoring non-push event: ${event}`);
      return { ok: true };
    }

    // Verify GitHub signature using raw body
    const rawBody = req.rawBody;
    if (!rawBody) {
      this.logger.error('Raw body not available for signature verification');
      throw new BadRequestException('Raw body not available');
    }

    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
    if (!webhookSecret) {
      this.logger.error('GITHUB_WEBHOOK_SECRET not configured');
      throw new UnauthorizedException('Webhook secret not configured');
    }

    const isValidSignature = verifyGitHubSignature(signature, rawBody, webhookSecret);
    if (!isValidSignature) {
      this.logger.warn(`Invalid GitHub signature for delivery ${deliveryId}`);
      throw new UnauthorizedException('Invalid GitHub signature');
    }

    this.logger.debug(`Valid push event received: ${payload.repository.full_name}`);

    try {
      // Find or verify the repository exists
      const repository = await this.githubService.findRepositoryByProviderId(
        payload.repository.id,
        'github'
      );

      if (!repository) {
        this.logger.warn(
          `Repository not found for GitHub ID ${payload.repository.id}. Skipping sync.`
        );
        // Return 200 OK anyway to acknowledge receipt (don't retry)
        return { ok: true };
      }

      // Find or create sync run (idempotent operation)
      const { id: syncRunId } = await this.githubService.findOrCreateSyncRun(
        repository.id,
        payload,
        deliveryId
      );

      // Build job payload
      const jobPayload = this.githubService.buildJobPayload(
        payload,
        deliveryId,
        repository.id,
        syncRunId
      );

      // Enqueue the job with delivery ID as the job ID for idempotency
      await this.githubSyncQueue.enqueueSync(jobPayload, deliveryId);

      this.logger.debug(
        `Enqueued sync job for ${repository.fullName} (delivery: ${deliveryId})`
      );

      return { ok: true };
    } catch (error) {
      const err = toError(error);
      this.logger.error(`Error processing webhook: ${err.message}`, err.stack);
      // Return 200 OK even on errors to prevent GitHub retries
      // The failure is logged and can be tracked through the database
      return { ok: true };
    }
  }
}
