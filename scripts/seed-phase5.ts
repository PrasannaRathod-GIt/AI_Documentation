import { db, pool } from '../packages/database/src/client.js';
import { eq } from 'drizzle-orm';
import { organizations, repositories, codeChunks } from '../packages/database/src/schema/index.js';
import { EmbeddingService } from '../packages/ai-engine/src/embeddings/embedding.service.js';
import type { DocumentationResult } from '../packages/ai-engine/src/types.js';
import crypto from 'crypto';

function generateContentHash(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function seed(): Promise<void> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

  const embeddingService = new EmbeddingService(apiKey);

  console.log('🌱 Starting Phase 5 seed process...');

  // --- Organization ---
  console.log('📦 Ensuring organization exists...');
  let organization = await db.query.organizations.findFirst({
    where: eq(organizations.slug, 'acme-corp'),
  });

  if (!organization) {
    const rows = await db.insert(organizations).values({
      name: 'Acme Corporation',
      slug: 'acme-corp',
    }).returning();
    organization = rows[0] ?? null;
  }

  if (!organization) throw new Error('Failed to create or find organization');
  console.log(`✅ Organization: ${organization.name} (${organization.id})`);

  // --- Repository ---
  console.log('📚 Ensuring repository exists...');
  let repository = await db.query.repositories.findFirst({
    where: eq(repositories.fullName, 'acme-corp/ai-docs'),
  });

  if (!repository) {
    const rows = await db.insert(repositories).values({
      organizationId: organization.id,
      provider: 'github',
      providerRepoId: '123456789',
      fullName: 'acme-corp/ai-docs',
      defaultBranch: 'main',
      githubInstallationId: '999',
    }).returning();
    repository = rows[0] ?? null;
  }

  if (!repository) throw new Error('Failed to create or find repository');
  console.log(`✅ Repository: ${repository.fullName} (${repository.id})`);

  // --- Seed Data ---
  const docs: Array<{
    result: DocumentationResult;
    filePath: string;
    language: string;
  }> = [
    {
      filePath: 'src/auth/auth.service.ts',
      language: 'typescript',
      result: {
        symbolName: 'verifyJwtToken',
        filePath: 'src/auth/auth.service.ts',
        markdown: '## Overview\n\nVerifies a JSON Web Token (JWT) and returns the authenticated user payload.\n\n## Parameters\n\n| Name | Type | Description |\n| --- | --- | --- |\n| token | string | The JWT token to verify. |\n\n## Returns\n\nAuthenticated user payload or null if verification fails.\n\n## Example Usage\n\n```ts\nconst payload = await verifyJwtToken(token);\nif (!payload) {\n  throw new Error("Unauthorized");\n}\n```\n\n## Notes\n\nUses the application JWT secret and supports token expiration checks.',
        mermaidDiagram: 'graph TD\n  Token -->|verify| JWT[JWT Payload]\n  JWT -->|return| App[Application]',
        tokensUsed: 0,
      },
    },
    {
      filePath: 'src/payments/payment.service.ts',
      language: 'typescript',
      result: {
        symbolName: 'processCharge',
        filePath: 'src/payments/payment.service.ts',
        markdown: '## Overview\n\nProcesses a customer payment by charging a payment provider.\n\n## Parameters\n\n| Name | Type | Description |\n| --- | --- | --- |\n| paymentMethod | string | The payment provider such as stripe or paypal. |\n| amount | number | The amount to charge in cents. |\n| currency | string | The currency code for example USD. |\n\n## Returns\n\nA result object indicating success, transaction id, or failure reason.\n\n## Example Usage\n\n```ts\nconst result = await processCharge("stripe", 2500, "USD");\nif (!result.success) {\n  console.error(result.reason);\n}\n```\n\n## Notes\n\nHandles both charge and refund scenarios and logs all payment events securely.',
        mermaidDiagram: 'graph TD\n  Request --> Charge[Charge Provider]\n  Charge --> Response[Payment Result]\n  Response -->|success| Order[Order Update]',
        tokensUsed: 0,
      },
    },
    {
      filePath: 'src/database/db.ts',
      language: 'typescript',
      result: {
        symbolName: 'createDatabasePool',
        filePath: 'src/database/db.ts',
        markdown: '## Overview\n\nInitializes a PostgreSQL connection pool and returns a database client instance.\n\n## Parameters\n\n| Name | Type | Description |\n| --- | --- | --- |\n| config | object | Pool configuration settings such as connection string and max clients. |\n\n## Returns\n\nA connected PG pool that can be used for query execution.\n\n## Example Usage\n\n```ts\nconst pool = createDatabasePool({ connectionString });\nconst client = await pool.connect();\n```\n\n## Notes\n\nThe pool reuses connections and provides safe resource cleanup.',
        mermaidDiagram: 'graph TD\n  App -->|connect| Pool[Connection Pool]\n  Pool -->|query| DB[PostgreSQL Database]',
        tokensUsed: 0,
      },
    },
    {
      filePath: 'src/email/email.service.ts',
      language: 'typescript',
      result: {
        symbolName: 'sendNotificationEmail',
        filePath: 'src/email/email.service.ts',
        markdown: '## Overview\n\nSends a notification email to a user using the configured SMTP or email provider.\n\n## Parameters\n\n| Name | Type | Description |\n| --- | --- | --- |\n| recipient | string | Recipient email address. |\n| subject | string | Email subject line. |\n| body | string | The markdown or HTML body of the email. |\n\n## Returns\n\nA promise that resolves when the email has been queued or delivered.\n\n## Example Usage\n\n```ts\nawait sendNotificationEmail("user@example.com", "Welcome", "Hello and welcome!");\n```\n\n## Notes\n\nImplements retries for transient provider failures and supports templated content.',
        mermaidDiagram: 'graph TD\n  User -->|send| EmailService[Email Service]\n  EmailService --> Provider[Email Provider]\n  Provider -->|deliver| Inbox[User Inbox]',
        tokensUsed: 0,
      },
    },
    {
      filePath: 'src/storage/upload.service.ts',
      language: 'typescript',
      result: {
        symbolName: 'uploadFileToS3',
        filePath: 'src/storage/upload.service.ts',
        markdown: '## Overview\n\nUploads a file stream to S3-compatible storage and returns the public asset URL.\n\n## Parameters\n\n| Name | Type | Description |\n| --- | --- | --- |\n| fileBuffer | Buffer | The binary content to upload. |\n| destinationKey | string | The target path or key in storage. |\n| contentType | string | The MIME type of the file. |\n\n## Returns\n\nA result containing the uploaded object URL and metadata.\n\n## Example Usage\n\n```ts\nconst result = await uploadFileToS3(buffer, "uploads/photo.png", "image/png");\nconsole.log(result.url);\n```\n\n## Notes\n\nApplies content-type metadata and uses presigned uploads when available.',
        mermaidDiagram: 'graph TD\n  File -->|upload| S3[S3 Storage]\n  S3 -->|return| URL[Asset URL]',
        tokensUsed: 0,
      },
    },
  ];

  // --- Process Each Chunk ---
  for (const item of docs) {
    console.log(`\n✨ Processing: ${item.result.symbolName}`);

    const contentHash = generateContentHash(
      item.result.symbolName + item.result.filePath + item.result.markdown,
    );

    const existing = await db.query.codeChunks.findFirst({
      where: eq(codeChunks.contentHash, contentHash),
    });

    if (existing) {
      console.log(`⚠️  Already exists: ${item.result.symbolName}, skipping.`);
      continue;
    }

    console.log('🧠 Generating embedding...');
    const embedding = await embeddingService.generateDocumentationEmbedding(item.result);

    await db.insert(codeChunks).values({
      organizationId: organization.id,
      repositoryId: repository.id,
      filePath: item.filePath,
      symbolName: item.result.symbolName,
      language: item.language,
      startLine: 1,
      endLine: 1,
      rawCode: '// Documentation seed for ' + item.result.symbolName,
      summary: item.result.markdown.split('\n').find((line) => line.trim() && !line.startsWith('#')) ?? null,
      embedding,
      contentHash,
    });

    console.log(`✅ Inserted: ${item.result.symbolName}`);
    await delay(1000);
  }

  console.log('\n🎉 Phase 5 seed complete! 5 chunks inserted.');
  await pool.end();
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});