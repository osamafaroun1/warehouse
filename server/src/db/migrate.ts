// server/src/db/migrate.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { Pool } from 'pg';
import { env } from '../config/env';

function resolveMigrationsFolder(): string {
    const candidates = [
        // Dev/server execution (cwd usually points to server root)
        resolve(process.cwd(), 'drizzle'),
        // Bundled server execution (index.cjs in server/dist)
        resolve(__dirname, 'drizzle'),
        // Fallback if runtime path differs and drizzle is one level up
        resolve(__dirname, '../drizzle'),
    ];

    for (const folder of candidates) {
        if (existsSync(folder)) {
            return folder;
        }
    }

    throw new Error(`Migrations folder not found. Checked: ${candidates.join(', ')}`);
}

export async function runMigrations() {
    const pool = new Pool({ connectionString: env.databaseUrl() });
    const db = drizzle(pool);
    const migrationsFolder = resolveMigrationsFolder();

    console.log('🔄 Checking for pending migrations...');
    await migrate(db, { migrationsFolder });
    console.log('✅ Migrations up to date');

    await pool.end();
}
