import { boolean, index, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['owner', 'admin', 'user']);
export type UserRole = (typeof userRoleEnum.enumValues)[number];

export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    username: text('username').notNull().unique(),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    phone: text('phone'),
    email: text('email').notNull().unique(),
    role: userRoleEnum('role').notNull().default('user'),
    passwordHash: text('password_hash').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index('user_role_idx').on(table.role),
    index('user_active_idx').on(table.isActive),
]);

export const sessions = pgTable(
    'sessions',
    {
        id: uuid('id').defaultRandom().primaryKey(),

        userId: uuid('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),

        refreshTokenHash: text('refresh_token_hash').notNull().unique(),

        userAgent: text('user_agent'),

        ipAddress: varchar('ip_address', { length: 100 }),

        expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),

        revokedAt: timestamp('revoked_at', { withTimezone: true }),

        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [index('sessions_user_idx').on(table.userId)],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
