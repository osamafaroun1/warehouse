import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';

async function main() {
    const scriptDir = path.dirname(fileURLToPath(import.meta.url));
    const migrationsFolder = path.resolve(scriptDir, '../drizzle');

    console.log('Connecting...');
    const pool = new Pool({
        connectionString: 'postgresql://postgres:dev@localhost:5432/warehouse_mgmt',
    });

    const db = drizzle(pool);

    console.log('Running migration...');
    await migrate(db, { migrationsFolder });

    console.log('Migration complete.');
    await pool.end();
}

main().catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
});
