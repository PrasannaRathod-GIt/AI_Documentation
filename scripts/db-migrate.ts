#!/usr/bin/env node

/**
 * Database migration runner script
 * Applies generated migrations to the database
 *
 * Usage: npm run migrate
 */

import { execSync } from 'child_process';
import path from 'path';

const dbDir = path.join(__dirname, '../packages/database');

console.log('🚀 Running Drizzle migrations...');
console.log(`Database dir: ${dbDir}`);

try {
  // Fix applied here: Added :pg to target your active Postgres Docker container
  execSync('npx drizzle-kit push:pg', {
    cwd: dbDir,
    stdio: 'inherit',
  });

  console.log('✅ Migrations applied successfully!');
  console.log('🎉 Database schema is now up to date.');
} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
}