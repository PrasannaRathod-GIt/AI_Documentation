import { db, pool } from '../packages/database/src/client';
import {
  organizations,
  repositories,
  codeChunks,
} from '../packages/database/src/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

/**
 * Generate a sample 768-dimensional embedding vector
 */
function generateSampleEmbedding(): number[] {
  const embedding: number[] = [];

  for (let i = 0; i < 768; i++) {
    embedding.push(Math.random() * 2 - 1);
  }

  return embedding;
}

/**
 * Generate SHA256 hash
 */
function generateContentHash(code: string): string {
  return crypto
    .createHash('sha256')
    .update(code)
    .digest('hex');
}


async function seed() {
  try {
    console.log('🌱 Starting seed process...\n');


    // ------------------------------------
    // 1. Organization
    // ------------------------------------

    console.log('📦 Checking organization...');

    let organization = await db.query.organizations.findFirst({
      where: eq(organizations.slug, 'acme-corp'),
    });


    if (!organization) {

      const orgResult = await db
        .insert(organizations)
        .values({
          name: 'Acme Corporation',
          slug: 'acme-corp',
        })
        .returning();

      organization = orgResult[0];

    }


    if (!organization) {
      throw new Error('Organization creation failed');
    }


    console.log(
      `✅ Organization: ${organization.name} (${organization.id})`
    );



    // ------------------------------------
    // 2. Repository
    // ------------------------------------

    console.log('\n📚 Checking repository...');


    let repository = await db.query.repositories.findFirst({
      where: eq(
        repositories.fullName,
        'acme-corp/ai-docs'
      ),
    });



    if (!repository) {

      const repoResult = await db
        .insert(repositories)
        .values({
          organizationId: organization.id,
          provider: 'github',
          providerRepoId: '123456789',
          fullName: 'acme-corp/ai-docs',
          defaultBranch: 'main',
          githubInstallationId: '999',
        })
        .returning();


      repository = repoResult[0];

    }



    if (!repository) {
      throw new Error('Repository creation failed');
    }


    console.log(
      `✅ Repository: ${repository.fullName} (${repository.id})`
    );



    // ------------------------------------
    // 3. Code Chunk
    // ------------------------------------

    console.log(
      '\n🧬 Checking code chunk with embedding...'
    );


    const sampleCode = `
export function greet(name: string): string {
  return \`Hello, \${name}!\`;
}
`;


    const contentHash =
      generateContentHash(sampleCode);



    let codeChunk = await db.query.codeChunks.findFirst({
      where: eq(
        codeChunks.contentHash,
        contentHash
      ),
    });



    if (!codeChunk) {


      const chunkResult = await db
        .insert(codeChunks)
        .values({

          organizationId: organization.id,

          repositoryId: repository.id,

          filePath: 'src/utils/greeting.ts',

          symbolName: 'greet',

          language: 'typescript',

          startLine: 1,

          endLine: 3,

          rawCode: sampleCode,

          summary: 'A simple greeting function',

          embedding: generateSampleEmbedding(),

          contentHash,

        })
        .returning();



      codeChunk = chunkResult[0];

    }



    if (!codeChunk) {
      throw new Error('Code chunk creation failed');
    }



    console.log(
      `✅ Code Chunk: ${codeChunk.symbolName}`
    );



    // ------------------------------------
    // 4. Read Back Test
    // ------------------------------------

    console.log(
      '\n🔍 Reading inserted code chunk...'
    );


    const result = await db
      .select()
      .from(codeChunks)
      .where(
        eq(
          codeChunks.id,
          codeChunk.id
        )
      )
      .limit(1);



    if (result.length === 0) {
      throw new Error(
        'Could not read code chunk back'
      );
    }



    const retrieved = result[0];


    console.log(
      '✅ Retrieved successfully:'
    );

    console.log(
      `   File: ${retrieved.filePath}`
    );

    console.log(
      `   Symbol: ${retrieved.symbolName}`
    );

    console.log(
      `   Language: ${retrieved.language}`
    );

    console.log(
      `   Embedding size: ${retrieved.embedding?.length}`
    );



    console.log(
      '\n✨ Seed completed successfully!'
    );


  } catch (error) {

    console.error(
      '\n❌ Seed failed:',
      error
    );

    process.exit(1);


  } finally {

    console.log(
      '\n🔌 Closing database connection...'
    );

    await pool.end();

    console.log(
      '✅ Connection closed'
    );

  }
}



seed();