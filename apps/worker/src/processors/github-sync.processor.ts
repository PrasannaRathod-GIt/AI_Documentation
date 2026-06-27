import { Injectable, Logger } from '@nestjs/common';
import { Job, Worker } from 'bullmq';
import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';
import { extractStructure } from '@ai-docs/code-parser';

export interface GitHubSyncJobPayload {
  provider: 'github';
  repositoryFullName: string;
  repositoryIdFromGitHub: number;
  repositoryId?: string;
  installationId?: number;
  commitSha: string;
  branch: string;
  deliveryId: string;
  receivedAt: string;
  syncRunId?: string;
}

interface GitHubFileChange {
  path?: string;
  filename?: string;
  status?: string;
  size?: number;
  patch?: string;
}

interface ProcessedFile {
  filePath: string;
  language: string;
  symbols: Array<{
    type: string;
    name: string;
    signature: string;
    startLine: number;
    endLine: number;
  }>;
}

const IGNORED_DIRECTORIES = new Set(['node_modules', 'dist', 'build']);
const MAX_FILE_SIZE_BYTES = 500 * 1024;
const SUPPORTED_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);

@Injectable()
export class GitHubSyncProcessor {
  private readonly logger = new Logger(GitHubSyncProcessor.name);
  private worker: Worker | null = null;

  async start(): Promise<void> {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    this.worker = new Worker('github-sync', this.processJob.bind(this), {
      connection: { url: redisUrl },
      concurrency: Number(process.env.WORKER_CONCURRENCY || '2'),
    });

    this.worker.on('completed', (job: Job) => {
      this.logger.debug(`Job ${job.id} completed successfully`);
    });

    this.worker.on('failed', (job: Job | undefined, error: Error) => {
      this.logger.error(`Job ${job?.id} failed: ${error.message}`, error.stack);
    });

    this.logger.log('GitHub sync processor started');
  }

  async stop(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      this.logger.log('GitHub sync processor stopped');
    }
  }

  async processJob(job: Job<GitHubSyncJobPayload>): Promise<ProcessedFile[]> {
    const { repositoryFullName, installationId, commitSha, branch, deliveryId } = job.data;
    this.logger.log(
      `Processing sync job for ${repositoryFullName} branch=${branch} sha=${commitSha} deliveryId=${deliveryId}`
    );

    try {
      const octokit = await this.createOctokit(installationId);

      const changedFiles = (await octokit.repos.getCommit({
        owner: repositoryFullName.split('/')[0],
        repo: repositoryFullName.split('/')[1],
        ref: commitSha,
      })).data.files || [];
      const filesToProcess = this.filterRelevantFiles(changedFiles);

      const processedFiles: ProcessedFile[] = [];
      for (const file of filesToProcess) {
        const filePath = file.filename || file.path || '';
        const ext = filePath.slice(filePath.lastIndexOf('.'));
        if (!SUPPORTED_EXTENSIONS.has(ext.toLowerCase())) {
          processedFiles.push({
            filePath,
            language: this.getLanguageName(ext),
            symbols: [],
          });
          continue;
        }

        const response = await octokit.repos.getContent({
          owner: repositoryFullName.split('/')[0],
          repo: repositoryFullName.split('/')[1],
          path: filePath,
          ref: commitSha,
        });

        if (Array.isArray(response.data) || response.data.type !== 'file') {
          continue;
        }

        const content = Buffer.from(response.data.content || '', 'base64').toString('utf8');
        if (content.includes('\0')) {
          this.logger.debug(`Skipping binary content for ${filePath}`);
          continue;
        }

        const structure = extractStructure(content, filePath);
        processedFiles.push({
          filePath,
          language: structure.language,
          symbols: structure.symbols,
        });
      }

      this.logger.log(`Processed ${processedFiles.length} files for ${repositoryFullName}`);
      return processedFiles;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to process sync job ${job.id}: ${message}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  private async createOctokit(installationId?: number): Promise<Octokit> {
    if (!installationId) {
      throw new Error('Missing GitHub installation id');
    }

    const appId = process.env.GITHUB_APP_ID;
    const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;

    if (!appId || !privateKey) {
      throw new Error('Missing GitHub app credentials');
    }

    const appAuth = createAppAuth({
      appId,
      privateKey: privateKey.replace(/\\n/g, '\n'),
      installationId,
    });

    const authResult = await appAuth({ type: 'installation' });
    if (authResult.type !== 'token' || !authResult.token) {
      throw new Error('Failed to authenticate GitHub app installation');
    }

    return new Octokit({ auth: authResult.token });
  }

  private filterRelevantFiles(changedFiles: GitHubFileChange[]): GitHubFileChange[] {
    return changedFiles.filter((file) => {
      const filePath = file.filename || file.path || '';
      if (!filePath) {
        return false;
      }

      const segments = filePath.split('/');
      if (segments.some((segment) => IGNORED_DIRECTORIES.has(segment))) {
        return false;
      }

      const extension = filePath.slice(filePath.lastIndexOf('.'));
      if (!SUPPORTED_EXTENSIONS.has(extension.toLowerCase())) {
        return false;
      }

      if (typeof file.size === 'number' && file.size > MAX_FILE_SIZE_BYTES) {
        return false;
      }

      if (!file.patch) {
        return false;
      }

      return true;
    });
  }

  private getLanguageName(extension: string): string {
    switch (extension.toLowerCase()) {
      case '.ts':
      case '.tsx':
        return 'typescript';
      case '.js':
      case '.jsx':
        return 'javascript';
      default:
        return 'unknown';
    }
  }
}
