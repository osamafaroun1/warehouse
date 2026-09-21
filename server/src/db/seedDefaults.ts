import { eq } from 'drizzle-orm';
import { db } from './client';
import { users } from './schema';
import { hashPassword } from '../lib/password';

export async function seedDefaultCategories(): Promise<void> {
    // Categories are not part of the current warehouse schema.
}

export async function seedDefaultUsers(): Promise<void> {
    const email = process.env.SEED_ADMIN_EMAIL || 'admin@warehouse.local';
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existing.length) return;

    await db.insert(users).values({
        username: process.env.SEED_ADMIN_USERNAME || 'admin',
        firstName: 'مدير',
        lastName: 'المستودع',
        email,
        role: 'owner',
        passwordHash: await hashPassword(process.env.SEED_ADMIN_PASSWORD || 'Admin123!'),
        isActive: true,
    });
}
