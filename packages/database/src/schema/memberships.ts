import {
  pgTable,
  varchar,
  timestamp,
  index,
  unique,
  foreignKey,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations } from './organizations';
import { users } from './users';

export const memberships = pgTable(
  'memberships',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    userId: varchar('user_id', { length: 36 }).notNull(),
    organizationId: varchar('organization_id', { length: 36 }).notNull(),
    role: varchar('role', { length: 50 }).notNull().default('member'), // 'owner', 'admin', 'member'
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => ({
    userOrgUnique: unique('memberships_user_org_unique').on(
      table.userId,
      table.organizationId
    ),
    userIdIdx: index('memberships_user_id_idx').on(table.userId),
    orgIdIdx: index('memberships_org_id_idx').on(table.organizationId),
    userIdFk: foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'memberships_user_id_fk',
    }).onDelete('cascade'),
    orgIdFk: foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organizations.id],
      name: 'memberships_org_id_fk',
    }).onDelete('cascade'),
  })
);

export type Membership = typeof memberships.$inferSelect;
export type NewMembership = typeof memberships.$inferInsert;
