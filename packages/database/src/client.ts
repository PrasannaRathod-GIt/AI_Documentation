import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Get database URL from environment
const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ai_docs';

// Create connection pool
const pool = new Pool({
  connectionString: databaseUrl,
});

// Create Drizzle instance
export const db = drizzle(pool, { schema });

// Export pool for connection management
export { pool };
