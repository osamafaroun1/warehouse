import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod';
import z from 'zod';
import { users } from './schema';

export const PaginationSchema = z.object({
    limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).default(20),
    offset: z.string().transform(Number).pipe(z.number().int().min(0)).default(0),
    query: z.string().optional(),
});

export const AuthSchema = {
    register: z.object({
        email: z.string().email(),
        password: z.string().min(8).max(255),
        firstName: z.string().min(1).max(100),
        lastName: z.string().min(1).max(100),
        username: z.string().min(1).max(255).optional(),
    }),

    login: z.object({
        email: z.string().email(),
        password: z.string().min(1),
    }),

    refreshToken: z.object({
        refreshToken: z.string().min(1),
    }),
};

export const usersSelectSchema = createSelectSchema(users);

export const usersInsertSchema = createInsertSchema(users).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});

export const usersUpdateSchema = createUpdateSchema(users).omit({
    id: true,
    createdAt: true,
    passwordHash: true,
});

export const usersSelfUpdateSchema = z.object({
    username: z.string().min(1).max(255).optional(),
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    email: z.string().email().optional(),
    phone: z.string().max(50).nullable().optional(),
});

export const usersCreateInputSchema = z.object({
    username: z.string().min(1).max(255),
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    email: z.string().email(),
    phone: z.string().max(50).nullable().optional(),
    role: z.enum(['owner', 'admin', 'user']).default('user'),
    isActive: z.boolean().default(true),
    password: z.string().min(8).max(255),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(255),
});
