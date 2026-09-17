import { pgTable, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  avatarUrl: varchar('avatar_url', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const oauthAccounts = pgTable(
  'oauth_accounts',
  {
    createdAt: timestamp('created_at').defaultNow().notNull(),
    id: uuid('id').defaultRandom().primaryKey(),
    provider: varchar('provider', { length: 50 }).notNull().default('google'),
    providerUserId: varchar('provider_user_id', { length: 255 }).notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => [uniqueIndex('oauth_provider_user_idx').on(table.provider, table.providerUserId)],
);
