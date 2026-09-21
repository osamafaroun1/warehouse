import { serve } from '@hono/node-server';
import type { ServerType } from '@hono/node-server';
import app from './app';
import { assertEnv, env } from './config/env';
import { logger } from './config/logger';
import { pool } from './db/client';
import { runMigrations } from './db/migrate';
import { seedDefaultCategories, seedDefaultUsers } from './db/seedDefaults';

const isProduction = env.nodeEnv === 'production';

// Fail fast and loud on missing/invalid secrets, instead of crashing on
// the first request that happens to need them.
assertEnv();

async function main() {
    if (isProduction) {
        await runMigrations();
    }
    await seedDefaultCategories();
    await seedDefaultUsers();

    const server: ServerType = serve(
        {
            fetch: app.fetch,
            port: env.port,
        },
        (info) => {
            logger.info(`Server listening on http://localhost:${info.port}`);
        },
    );

    function shutdown(signal: string) {
        logger.info(`${signal} received, shutting down gracefully...`);
        server.close(async () => {
            try {
                await pool.end();
                logger.info('Database pool closed');
            } catch (err) {
                logger.error({ err }, 'Error closing database pool');
            }
            process.exit(0);
        });
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
    logger.error({ err }, 'Fatal startup error:');
    process.exit(1);
});
