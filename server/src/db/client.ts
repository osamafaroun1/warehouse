import { drizzle } from 'drizzle-orm/node-postgres';
import { Context } from 'hono';
import { Pool } from 'pg';
import { getDatabaseUrl } from '../config/env';
import * as schema from './schema';

export const pool = new Pool({
    connectionString: getDatabaseUrl(),
});

export const db = drizzle(pool, { schema });

(async () => {
    try {
        await pool.query('SELECT 1');
        console.log('✅ Database connected successfully');
    } catch (err) {
        console.error('❌ Database connection failed:', err);
    }
})();

export type DbClient = typeof db;

export type AppVariables = {
    userId: string;
    organizationId: string;
    role: schema.UserRole;
    sessionId: string;
    validatedBody: unknown;
    validatedQuery: unknown;
};

export type AppContext = Context<{ Variables: AppVariables }>;
