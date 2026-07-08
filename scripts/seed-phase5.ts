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
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const embeddingService = new EmbeddingService(apiKey);

  console.log('🌱 Starting Phase 5 seed process...');

  console.log('📦 Ensuring organization exists...');
  let organization = await db.query.organizations.findFirst({
    where: organizations.slug.eq('acme-corp'),
  });

  if (!organization) {
    const rows = await db.insert(organizations).values({
      name: 'Acme Corporation',
      slug: 'acme-corp',
    }).returning();
    organization = rows[0] ?? null;
  }

  if (!organization) {
    throw new Error('Failed to create or find organization');
  }

  console.log(`✅ Organization ready: ${organization.name} (${organization.id})`);

  console.log('📚 Ensuring repository exists...');
  let repository = await db.query.repositories.findFirst({
    where: repositories.fullName.eq('acme-corp/ai-docs'),
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

  if (!repository) {
    throw new Error('Failed to create or find repository');
  }

  console.log(`✅ Repository ready: ${repository.fullName} (${repository.id})`);

  const docs: Array<{ result: DocumentationResult; filePath: string; language: string }> = [
    {
      filePath: 'src/auth/auth.service.ts',
      language: 'typescript',
      result: {
        symbolName: 'verifyJwtToken',
        filePath: 'src/auth/auth.service.ts',
        markdown: `## Overview

Verifies a JSON Web Token (JWT) and returns the authenticated user payload.

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| token | string | The JWT token to verify. |

## Returns

- `type` Authenticated user payload or null if verification fails.

## Example Usage

\`\`\`ts
const payload = await verifyJwtToken(token);
if (!payload) {
  throw new Error('Unauthorized');
}
\`\`\`

## Notes

Uses the application's JWT secret and supports token expiration checks.
`,
        mermaidDiagram: 'graph TD
  Token -->|verify| JWT[JWT Payload]
  JWT -->|return| App[Application]',
        tokensUsed: 0,
      },
    },
    {
      filePath: 'src/payments/payment.service.ts',
      language: 'typescript',
      result: {
        symbolName: 'processCharge',
        filePath: 'src/payments/payment.service.ts',
        markdown: `## Overview

Processes a customer payment by charging a payment provider and managing refund logic.

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| paymentMethod | string | The payment provider method, such as 'stripe' or 'paypal'. |
| amount | number | The amount to charge in cents. |
| currency | string | The currency code, for example 'USD'. |

## Returns

- `type` A result object indicating success, transaction id, or failure reason.

## Example Usage

\\`\`\`ts
const result = await processCharge('stripe', 2500, 'USD');
if (!result.success) {
  console.error(result.reason);
}
\`\`\`

## Notes

Handles both charge and refund scenarios and logs all payment events securely.
`,
        mermaidDiagram: 'graph TD
  Request --> Charge[Charge Provider]
  Charge --> Response[Payment Result]
  Response -->|success| Order[Order Update]',
        tokensUsed: 0,
      },
    },
    {
      filePath: 'src/database/db.ts',
      language: 'typescript',
      result: {
        symbolName: 'createDatabasePool',
        filePath: 'src/database/db.ts',
        markdown: `## Overview

Initializes a PostgreSQL connection pool and returns a database client instance.

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| config | object | Pool configuration settings such as connection string and max clients. |

## Returns

- `type` A connected PG pool that can be used for query execution.

## Example Usage

\\`\`\`ts
const pool = createDatabasePool({ connectionString });
const client = await pool.connect();
\`\`\`

## Notes

The pool reuses connections and provides safe resource cleanup.
`,
        mermaidDiagram: 'graph TD
  App -->|connect| Pool[Connection Pool]
  Pool -->|query| DB[PostgreSQL Database]',
        tokensUsed: 0,
      },
    },
    {
      filePath: 'src/email/email.service.ts',
      language: 'typescript',
      result: {
        symbolName: 'sendNotificationEmail',
        filePath: 'src/email/email.service.ts',
        markdown: `## Overview

Sends a notification email to a user using the configured SMTP or email provider.

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| recipient | string | Recipient email address. |
| subject | string | Email subject line. |
| body | string | The markdown or HTML body of the email. |

## Returns

- `type` A promise that resolves when the email has been queued or delivered.

## Example Usage

\\`\`\`ts
await sendNotificationEmail('user@example.com', 'Welcome', 'Hello and welcome!');
\`\`\`

## Notes

Implements retries for transient provider failures and supports templated content.
`,
        mermaidDiagram: 'graph TD
  User -->|send| EmailService[Email Service]
  EmailService --> Provider[Email Provider]
  Provider -->|deliver| Inbox[User Inbox]',
        tokensUsed: 0,
      },
    },
    {
      filePath: 'src/storage/upload.service.ts',
      language: 'typescript',
      result: {
        symbolName: 'uploadFileToS3',
        filePath: 'src/storage/upload.service.ts',
        markdown: `## Overview

Uploads a file stream to S3-compatible storage and returns the public asset URL.

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| fileBuffer | Buffer | The binary content to upload. |
| destinationKey | string | The target path or key in storage. |
| contentType | string | The MIME type of the file. |

## Returns

- `type` A result containing the uploaded object URL and metadata.

## Example Usage

\\`\`\`ts
const result = await uploadFileToS3(buffer, 'uploads/photo.png', 'image/png');
console.log(result.url);
\`\`\`

## Notes

Applies content-type metadata and uses presigned uploads when available.
`,
        mermaidDiagram: 'graph TD
  File -->|upload| S3[S3 Storage]
  S3 -->|return| URL[Asset URL]',
        tokensUsed: 0,
      },
    },
  ];

  for (const item of docs) {
    console.log(`\n✨ Processing seed chunk: ${item.result.symbolName}`);
    const contentHash = generateContentHash(item.result.symbolName + item.result.filePath + item.result.markdown);

    const existing = await db.query.codeChunks.findFirst({
      where: codeChunks.contentHash.eq(contentHash),
    });

    if (existing) {
      console.log(`⚠️ Chunk already exists for ${item.result.symbolName}, skipping embedding generation.`);
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
      rawCode: `// Documentation seed for ${item.result.symbolName}`,
      summary: item.result.markdown.split(/\r?\n/).find((line) => line.trim()) ?? null,
      markdown: item.result.markdown,
      mermaidDiagram: item.result.mermaidDiagram ?? null,
      embedding,
      contentHash,
    });

    console.log(`✅ Inserted seed chunk ${item.result.symbolName}`);
    await delay(1000);
  }

  console.log('\n🎉 Phase 5 seed process complete.');
}

seed()
  .catch((error) => {
    console.error('❌ Seed phase 5 failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
    console.log('🔌 Database connection closed');
  });
