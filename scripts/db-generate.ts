#!/usr/bin/env node

/**
 * Database migration generation script
 * Generates SQL migrations from schema changes
 *
 * Usage: npm run generate
 */

import { execSync } from 'child_process';
import path from 'path';

const dbDir = path.join(__dirname, '../packages/database');

console.log('📦 Generating Drizzle migrations...');
console.log(`Database dir: ${dbDir}`);

try {
  // Run drizzle-kit generate from database package
  execSync('drizzle-kit generate', {
    cwd: dbDir,
    stdio: 'inherit',
  });

  console.log('✅ Migrations generated successfully!');
  console.log('📂 Check migrations/ folder for generated SQL files.');
} catch (error) {
  console.error('❌ Migration generation failed:', error);
  process.exit(1);
}
