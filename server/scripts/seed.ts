/**
 * Seed default admin user for warehouse management system.
 * Run: npm run seed
 */
import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db, pool } from '../src/db/client';
import { users } from '../src/db/schema';
import { hashPassword } from '../src/lib/password';

async function main() {
    const email = process.env.SEED_ADMIN_EMAIL || 'admin@warehouse.local';
    const password = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';

    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing.length) {
        console.log('Admin already exists:', email);
        await pool.end();
        return;
    }

    const passwordHash = await hashPassword(password);
    const [user] = await db
        .insert(users)
        .values({
            username: 'admin',
            firstName: 'مدير',
            lastName: 'المستودع',
            email,
            role: 'owner',
            passwordHash,
            isActive: true,
        })
        .returning();

    console.log('Created admin user:', user.email);
    console.log('Password:', password);
    await pool.end();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
