import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    // Completely hardcoded — no process.env fallback to mess things up
    url: 'postgresql://postgres:prasanna123@localhost:5433/ai_docs',
  },
  verbose: true,
  strict: true,
});